#!/usr/bin/env node
/**
 * restart.mjs — self-healing backend restart:
 * 1. Убиваем процессы на порту 3000
 * 2. Проверяем Docker Desktop (перезапускаем если сломан)
 * 3. Освобождаем порт 5432 от чужих контейнеров
 * 4. Запускаем Docker (postgres + redis) + проверяем TCP-подключение
 * 5. Создаём базу если не существует
 * 6. Применяем схему БД (drizzle-kit push) с retry
 * 7. Сидируем дефолтные тарифы
 * 8. Обновляем IP
 * 9. Запускаем backend
 */

import { execSync, spawn } from 'child_process'
import { createConnection } from 'net'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { readFileSync } from 'fs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const COMPOSE = 'apps/backend/docker/docker-compose.dev.yml'

const c = {
  reset: '\x1b[0m', bold: '\x1b[1m',
  red: '\x1b[31m', green: '\x1b[32m',
  yellow: '\x1b[33m', blue: '\x1b[34m', gray: '\x1b[90m',
}
const time = () => new Date().toLocaleTimeString('ru', { hour12: false })
const info  = (m) => console.log(`${c.gray}[${time()}]${c.reset} ${c.blue}${c.bold}▶${c.reset} ${m}`)
const ok    = (m) => console.log(`${c.gray}[${time()}]${c.reset} ${c.green}${c.bold}✓${c.reset} ${m}`)
const warn  = (m) => console.log(`${c.gray}[${time()}]${c.reset} ${c.yellow}${c.bold}!${c.reset} ${m}`)
const fatal = (m) => { console.log(`${c.gray}[${time()}]${c.reset} ${c.red}${c.bold}✗${c.reset} ${m}`); process.exit(1) }

function run(cmd) {
  try { return execSync(cmd, { stdio: 'pipe', cwd: ROOT }).toString().trim() } catch { return '' }
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

/** Test real TCP data exchange with PostgreSQL (not just port open) */
function testPgConnection(host, port, timeoutMs = 5000) {
  return new Promise((resolve) => {
    const sock = createConnection({ host, port }, () => {
      // Send SSL negotiation request (8 bytes)
      const buf = Buffer.alloc(8)
      buf.writeInt32BE(8, 0)
      buf.writeInt32BE(80877103, 4) // SSLRequest magic
      sock.write(buf)
    })
    sock.setTimeout(timeoutMs)
    sock.once('data', () => { sock.destroy(); resolve(true) })
    sock.once('timeout', () => { sock.destroy(); resolve(false) })
    sock.once('error', () => { sock.destroy(); resolve(false) })
  })
}

/** Parse DATABASE_URL from .env */
function parseDatabaseUrl() {
  try {
    const envFile = readFileSync(resolve(ROOT, 'apps/backend/.env'), 'utf-8')
    const match = envFile.match(/DATABASE_URL=(.+)/)
    if (match) {
      const url = new URL(match[1].trim())
      return { host: url.hostname, port: parseInt(url.port) || 5432, db: url.pathname.slice(1) }
    }
  } catch {}
  return { host: 'localhost', port: 5432, db: 'mvp_template' }
}

// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  const dbInfo = parseDatabaseUrl()

  // 1. Kill port 3000
  info('Останавливаем процессы на порту 3000...')
  const pids = run('lsof -ti:3000')
  if (pids) {
    pids.split('\n').forEach(pid => { try { execSync(`kill -9 ${pid.trim()}`, { stdio: 'ignore' }) } catch {} })
    warn(`Убиты PID: ${pids.replace(/\n/g, ', ')}`)
  } else {
    ok('Порт 3000 свободен')
  }

  // 2. Check Docker Desktop
  info('Проверяем Docker...')
  const dockerOk = run('docker info')
  if (!dockerOk) {
    warn('Docker Desktop не отвечает, запускаем...')
    if (process.platform === 'darwin') {
      run('open -a Docker')
    }
    // Wait for Docker to become available (up to 60s)
    for (let i = 0; i < 30; i++) {
      await sleep(2000)
      if (run('docker info')) { ok('Docker Desktop запущен'); break }
      if (i === 29) fatal('Docker Desktop не запускается. Запустите вручную.')
    }
  } else {
    ok('Docker работает')
  }

  // 3. Free port 5432 from other containers
  info('Проверяем порт 5432...')
  const pgContainer = run("docker ps --filter 'publish=5432' --format '{{.Names}}'")
  if (pgContainer) {
    const project = run(`docker inspect ${pgContainer} --format '{{index .Config.Labels "com.docker.compose.project"}}'`)
    if (project !== 'docker') {
      info(`Останавливаем чужой контейнер: ${pgContainer} (проект: ${project})`)
      run(`docker stop ${pgContainer}`)
      ok(`Контейнер ${pgContainer} остановлен`)
    } else {
      ok('Порт 5432 — наш контейнер')
    }
  } else {
    ok('Порт 5432 свободен')
  }

  // 4. Start Docker containers
  info('Запускаем контейнеры...')
  try {
    execSync(`docker compose -f ${COMPOSE} up -d --wait`, { stdio: 'inherit', cwd: ROOT })
    ok('Контейнеры запущены')
  } catch (e) {
    fatal('Ошибка Docker: ' + e.message)
  }

  // 5. Verify real TCP connection to PostgreSQL
  info('Проверяем TCP-подключение к PostgreSQL...')
  let connected = await testPgConnection(dbInfo.host, dbInfo.port)

  if (!connected) {
    warn('PostgreSQL не отвечает на данные — пересоздаём контейнер...')
    run(`docker compose -f ${COMPOSE} down`)
    await sleep(2000)
    try {
      execSync(`docker compose -f ${COMPOSE} up -d --wait`, { stdio: 'inherit', cwd: ROOT })
    } catch (e) {
      fatal('Ошибка пересоздания контейнеров: ' + e.message)
    }

    // Retry connection
    for (let i = 0; i < 5; i++) {
      await sleep(2000)
      connected = await testPgConnection(dbInfo.host, dbInfo.port)
      if (connected) break
    }

    if (!connected) {
      warn('PostgreSQL всё ещё не отвечает. Пересоздаём с очисткой данных...')
      run(`docker compose -f ${COMPOSE} down -v`)
      await sleep(2000)
      try {
        execSync(`docker compose -f ${COMPOSE} up -d --wait`, { stdio: 'inherit', cwd: ROOT })
      } catch (e) {
        fatal('Ошибка: ' + e.message)
      }
      for (let i = 0; i < 10; i++) {
        await sleep(2000)
        connected = await testPgConnection(dbInfo.host, dbInfo.port)
        if (connected) break
      }
      if (!connected) {
        fatal('PostgreSQL не отвечает после пересоздания. Перезапустите Docker Desktop вручную.')
      }
    }
  }
  ok('PostgreSQL отвечает')

  // 6. Ensure database exists
  const containerName = run("docker ps --filter 'publish=5432' --format '{{.Names}}'") || 'docker-postgres-1'
  info(`Проверяем базу «${dbInfo.db}»...`)
  const dbExists = run(`docker exec ${containerName} psql -U postgres -tAc "SELECT 1 FROM pg_database WHERE datname='${dbInfo.db}'"`)
  if (dbExists.trim() === '1') {
    ok(`База «${dbInfo.db}» существует`)
  } else {
    info(`Создаём базу «${dbInfo.db}»...`)
    try {
      execSync(`docker exec ${containerName} psql -U postgres -c "CREATE DATABASE ${dbInfo.db};"`, { stdio: 'pipe' })
      ok(`База «${dbInfo.db}» создана`)
    } catch (e) {
      fatal(`Не удалось создать базу: ${e.message}`)
    }
  }

  // 7. DB push (with retry)
  info('Применяем схему БД...')
  let pushOk = false
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      execSync('npm run db:push -w apps/backend', { stdio: 'inherit', cwd: ROOT, timeout: 30000 })
      pushOk = true
      ok('Схема БД обновлена')
      break
    } catch (e) {
      if (attempt < 3) {
        warn(`db:push не удался (попытка ${attempt}/3), ждём 3с...`)
        await sleep(3000)
      } else {
        warn(`db:push не удался после 3 попыток: ${e.message}`)
        warn('Пропускаем — backend попробует подключиться сам')
      }
    }
  }

  // 8. Seed (idempotent)
  if (pushOk) {
    info('Сидируем дефолтные тарифы (если ещё нет)...')
    try {
      execSync('npm run db:seed -w apps/backend', { stdio: 'inherit', cwd: ROOT, timeout: 15000 })
    } catch (e) {
      warn('Ошибка db:seed: ' + e.message)
    }
  }

  // 9. Update IP
  info('Обновляем IP...')
  try {
    execSync('node scripts/update-ip.mjs', { stdio: 'inherit', cwd: ROOT })
    ok('IP обновлён')
  } catch (e) {
    warn('Ошибка update-ip: ' + e.message)
  }

  // 10. Start backend
  console.log()
  console.log(`${c.bold}${c.green}▶ Запускаем backend...${c.reset}`)
  console.log()

  const backend = spawn('npm', ['run', 'dev', '-w', 'apps/backend'], {
    cwd: ROOT,
    stdio: 'inherit',
  })

  process.on('SIGINT', () => { backend.kill('SIGTERM'); process.exit(0) })
  process.on('SIGTERM', () => { backend.kill('SIGTERM'); process.exit(0) })

  backend.on('exit', (code) => process.exit(code ?? 0))
}

main().catch(e => fatal(e.message))
