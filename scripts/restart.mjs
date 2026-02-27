#!/usr/bin/env node
/**
 * restart.mjs — единая команда перезапуска всего окружения:
 * 1. Убиваем процессы на порту 3000 и expo/metro
 * 2. Запускаем Docker (postgres + redis)
 * 3. Ждём готовности PostgreSQL
 * 4. Обновляем IP в .env мобильного
 * 5. Открываем backend в новом окне терминала
 * 6. Открываем mobile в новом окне терминала
 */

import { execSync, execFileSync } from 'child_process'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')

// ─── Цвета ───────────────────────────────────────────────────────────────────
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
function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

// ─── Шаг 1: убиваем старые процессы ─────────────────────────────────────────
function killOldProcesses() {
  info('Останавливаем старые процессы...')
  const pids = run('lsof -ti:3000')
  if (pids) {
    pids.split('\n').forEach(pid => { try { execSync(`kill -9 ${pid.trim()}`, { stdio: 'ignore' }) } catch {} })
    warn(`Убиты процессы на порту 3000: ${pids.replace(/\n/g, ', ')}`)
  }
  run("pkill -f 'expo start' || true")
  run("pkill -f 'metro' || true")
  ok('Старые процессы остановлены')
}

// ─── Шаг 2: Docker (с ожиданием healthcheck) ─────────────────────────────────
function startDocker() {
  info('Запускаем Docker и ждём готовности сервисов...')
  try {
    execSync('docker compose -f apps/backend/docker/docker-compose.dev.yml up -d --wait', { stdio: 'inherit', cwd: ROOT })
    ok('Docker запущен, postgres и redis готовы')
  } catch (e) {
    fatal('Ошибка запуска Docker: ' + e.message)
  }
}

// ─── Шаг 3: обновляем схему БД ───────────────────────────────────────────────
function pushDb() {
  info('Применяем схему БД (drizzle-kit push)...')
  try {
    execSync('npm run db:push -w apps/backend', { stdio: 'inherit', cwd: ROOT })
    ok('Схема БД обновлена')
  } catch (e) {
    fatal('Ошибка обновления схемы БД: ' + e.message)
  }
}

// ─── Шаг 4: обновляем IP ─────────────────────────────────────────────────────
function updateIp() {
  info('Обновляем IP адрес...')
  try {
    execSync('node scripts/update-ip.mjs', { stdio: 'inherit', cwd: ROOT })
    ok('IP обновлён')
  } catch (e) {
    warn('Ошибка обновления IP: ' + e.message)
  }
}

// ─── Шаг 5: открываем новые окна терминала (macOS) ───────────────────────────
function openTerminalWindow(title, cmd) {
  // Используем osascript для открытия нового окна в Terminal.app
  const script = `
    tell application "Terminal"
      activate
      set newWin to do script "${cmd.replace(/"/g, '\\"')}"
      tell newWin
        set custom title to "${title}"
      end tell
    end tell
  `
  try {
    execFileSync('osascript', ['-e', script])
    ok(`Открыто окно: ${title}`)
  } catch (e) {
    fatal(`Не удалось открыть терминал для ${title}: ` + e.message)
  }
}

// ─── Главная функция ──────────────────────────────────────────────────────────
async function main() {
  console.log()
  console.log(`${c.bold}${c.blue}════════════════════════════════════════${c.reset}`)
  console.log(`${c.bold}${c.blue}   MVP Restart — полный перезапуск      ${c.reset}`)
  console.log(`${c.bold}${c.blue}════════════════════════════════════════${c.reset}`)
  console.log()

  killOldProcesses()
  startDocker()
  pushDb()
  updateIp()

  console.log()
  ok('Открываем терминалы для backend и mobile...')
  console.log()

  openTerminalWindow('Backend', `cd ${ROOT} && npm run dev -w apps/backend`)
  await sleep(500)
  openTerminalWindow('Mobile', `cd ${ROOT} && npm run start -w apps/mobile`)

  console.log()
  ok('Готово! Backend и Mobile запущены в отдельных окнах.')
}

main().catch((e) => {
  fatal(e.message)
})
