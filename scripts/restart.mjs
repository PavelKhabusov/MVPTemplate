#!/usr/bin/env node
/**
 * restart.mjs — единая команда перезапуска всего окружения:
 * 1. Убиваем процессы на порту 3000 (backend) и expo
 * 2. Запускаем Docker (postgres + redis)
 * 3. Ждём готовности БД
 * 4. Обновляем IP в .env мобильного
 * 5. Запускаем backend + mobile параллельно
 */

import { spawn, execSync } from 'child_process'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')

// ─── Цвета вывода ────────────────────────────────────────────────────────────
const c = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
}

function log(prefix, color, msg) {
  const time = new Date().toLocaleTimeString('ru', { hour12: false })
  console.log(`${c.gray}[${time}]${c.reset} ${color}${c.bold}[${prefix}]${c.reset} ${msg}`)
}

const info  = (msg) => log('restart', c.blue,   msg)
const ok    = (msg) => log('restart', c.green,  msg)
const warn  = (msg) => log('restart', c.yellow, msg)
const error = (msg) => log('restart', c.red,    msg)

// ─── Утилиты ─────────────────────────────────────────────────────────────────
function run(cmd, opts = {}) {
  try {
    return execSync(cmd, { stdio: 'pipe', ...opts }).toString().trim()
  } catch {
    return ''
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// ─── Шаг 1: убиваем старые процессы ─────────────────────────────────────────
function killOldProcesses() {
  info('Останавливаем старые процессы...')

  // backend на порту 3000
  const pids = run("lsof -ti:3000")
  if (pids) {
    pids.split('\n').forEach(pid => {
      try { execSync(`kill -9 ${pid.trim()}`, { stdio: 'ignore' }) } catch {}
    })
    warn(`Убиты процессы на порту 3000: ${pids.replace(/\n/g, ', ')}`)
  }

  // expo / metro bundler
  run("pkill -f 'expo start' || true")
  run("pkill -f 'metro' || true")
  ok('Старые процессы остановлены')
}

// ─── Шаг 2: Docker ───────────────────────────────────────────────────────────
async function startDocker() {
  info('Запускаем Docker (postgres + redis)...')
  try {
    execSync(
      'docker compose -f apps/backend/docker/docker-compose.dev.yml up -d',
      { stdio: 'inherit', cwd: ROOT }
    )
    ok('Docker запущен')
  } catch (e) {
    error('Ошибка запуска Docker: ' + e.message)
    process.exit(1)
  }
}

// ─── Шаг 3: ждём готовности postgres ─────────────────────────────────────────
async function waitForPostgres(maxAttempts = 20, interval = 1500) {
  info('Ждём готовности PostgreSQL...')
  for (let i = 0; i < maxAttempts; i++) {
    const result = run(
      "docker exec $(docker ps -qf 'name=postgres') pg_isready -U postgres 2>/dev/null"
    )
    if (result.includes('accepting connections')) {
      ok('PostgreSQL готов')
      return
    }
    process.stdout.write(`\r${c.yellow}  Ожидание PostgreSQL... попытка ${i + 1}/${maxAttempts}${c.reset}`)
    await sleep(interval)
  }
  console.log()
  warn('PostgreSQL не ответил, продолжаем...')
}

// ─── Шаг 4: обновляем IP ─────────────────────────────────────────────────────
async function updateIp() {
  info('Обновляем IP адрес...')
  try {
    execSync('node scripts/update-ip.mjs', { stdio: 'inherit', cwd: ROOT })
    ok('IP обновлён')
  } catch (e) {
    error('Ошибка обновления IP: ' + e.message)
  }
}

// ─── Шаг 5: запускаем процессы параллельно ───────────────────────────────────
const children = []

function spawnProcess(label, color, cmd, args, cwd) {
  const prefix = `${color}${c.bold}[${label}]${c.reset}`
  const child = spawn(cmd, args, {
    cwd,
    env: { ...process.env },
    stdio: ['ignore', 'pipe', 'pipe'],
  })

  child.stdout.on('data', (data) => {
    data.toString().split('\n').forEach(line => {
      if (line.trim()) console.log(`${prefix} ${line}`)
    })
  })

  child.stderr.on('data', (data) => {
    data.toString().split('\n').forEach(line => {
      if (line.trim()) console.log(`${prefix} ${c.red}${line}${c.reset}`)
    })
  })

  child.on('exit', (code) => {
    if (code !== 0 && code !== null) {
      console.log(`${prefix} ${c.red}завершился с кодом ${code}${c.reset}`)
    }
  })

  children.push(child)
  return child
}

function startBackend() {
  info('Запускаем backend...')
  spawnProcess('backend', c.cyan, 'npm', ['run', 'dev', '-w', 'apps/backend'], ROOT)
}

function startMobile() {
  info('Запускаем mobile...')
  spawnProcess('mobile', c.green, 'npm', ['run', 'start', '-w', 'apps/mobile'], ROOT)
}

// ─── Cleanup при выходе ───────────────────────────────────────────────────────
function cleanup() {
  console.log()
  warn('Останавливаем процессы...')
  children.forEach(child => {
    try { child.kill('SIGTERM') } catch {}
  })
  process.exit(0)
}

process.on('SIGINT', cleanup)
process.on('SIGTERM', cleanup)

// ─── Главная функция ──────────────────────────────────────────────────────────
async function main() {
  console.log()
  console.log(`${c.bold}${c.blue}═══════════════════════════════════════${c.reset}`)
  console.log(`${c.bold}${c.blue}  MVP Restart — полный перезапуск      ${c.reset}`)
  console.log(`${c.bold}${c.blue}═══════════════════════════════════════${c.reset}`)
  console.log()

  killOldProcesses()
  await startDocker()
  await waitForPostgres()
  await updateIp()

  console.log()
  ok('Всё готово, запускаем сервисы...')
  console.log()

  startBackend()
  // Небольшая пауза чтобы backend успел стартовать первым
  await sleep(1000)
  startMobile()

  console.log()
  info('Нажмите Ctrl+C для остановки всех процессов')
}

main().catch((e) => {
  error(e.message)
  process.exit(1)
})
