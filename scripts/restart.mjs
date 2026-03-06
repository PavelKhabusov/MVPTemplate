#!/usr/bin/env node
/**
 * restart.mjs — перезапуск backend:
 * 1. Убиваем процессы на порту 3000
 * 2. Запускаем Docker (postgres + redis) с ожиданием healthcheck
 * 3. Применяем схему БД (drizzle-kit push)
 * 4. Сидируем дефолтные тарифы (идемпотентно — пропускает если уже есть)
 * 5. Обновляем IP в .env мобильного
 * 6. Запускаем backend в текущем терминале
 */

import { execSync, spawn } from 'child_process'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')

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
  try { return execSync(cmd, { stdio: 'pipe' }).toString().trim() } catch { return '' }
}

// 1. Kill port 3000
info('Останавливаем процессы на порту 3000...')
const pids = run('lsof -ti:3000')
if (pids) {
  pids.split('\n').forEach(pid => { try { execSync(`kill -9 ${pid.trim()}`, { stdio: 'ignore' }) } catch {} })
  warn(`Убиты PID: ${pids.replace(/\n/g, ', ')}`)
} else {
  ok('Порт 3000 свободен')
}

// 1.5 Освобождаем порт 5432 от чужих контейнеров
info('Проверяем порт 5432...')
const pg = run("docker ps --filter 'publish=5432' --format '{{.Names}}'")
if (pg) {
  const project = run(`docker inspect ${pg} --format '{{index .Config.Labels "com.docker.compose.project"}}'`)
  if (project !== 'docker') {
    info(`Останавливаем чужой контейнер: ${pg} (проект: ${project})`)
    run(`docker stop ${pg}`)
    ok(`Контейнер ${pg} остановлен`)
  } else {
    ok('Порт 5432 — наш контейнер')
  }
} else {
  ok('Порт 5432 свободен')
}

// 2. Docker
info('Запускаем Docker и ждём готовности сервисов...')
try {
  execSync('docker compose -f apps/backend/docker/docker-compose.dev.yml up -d --wait', { stdio: 'inherit', cwd: ROOT })
  ok('Docker готов')
} catch (e) {
  fatal('Ошибка Docker: ' + e.message)
}

// 3. DB push
info('Применяем схему БД...')
try {
  execSync('npm run db:push -w apps/backend', { stdio: 'inherit', cwd: ROOT })
  ok('Схема БД обновлена')
} catch (e) {
  fatal('Ошибка db:push: ' + e.message)
}

// 4. Seed default plans (idempotent — skips if plans already exist)
info('Сидируем дефолтные тарифы (если ещё нет)...')
try {
  execSync('npm run db:seed -w apps/backend', { stdio: 'inherit', cwd: ROOT })
} catch (e) {
  warn('Ошибка db:seed: ' + e.message)
}

// 5. Update IP
info('Обновляем IP...')
try {
  execSync('node scripts/update-ip.mjs', { stdio: 'inherit', cwd: ROOT })
  ok('IP обновлён')
} catch (e) {
  warn('Ошибка update-ip: ' + e.message)
}

// 6. Start backend
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
