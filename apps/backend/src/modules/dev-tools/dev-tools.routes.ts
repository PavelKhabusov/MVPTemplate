/**
 * Dev Tools — Test Dashboard
 *
 * Визуальный дашборд для запуска и мониторинга тестов.
 * Доступен только в development: http://localhost:3000/dev/tests
 *
 * Routes:
 *   GET  /dev/tests          → HTML дашборд
 *   GET  /dev/tests/stream   → SSE стрим логов
 *   POST /dev/tests/run      → Запуск теста
 *   POST /dev/tests/stop     → Остановка теста
 *   GET  /dev/tests/modules  → Список backend модулей
 *   GET  /dev/tests/log      → Лог конкретного теста
 */
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { spawn, ChildProcess } from 'child_process'
import { resolve } from 'path'
import { readdirSync, existsSync } from 'fs'
import { devTestsDashboardHTML } from './dashboard-html'

// ─── Test definitions ────────────────────────────────────────────────────────

interface TestDef {
  id: string
  icon: string
  name: string
  desc: string
  group: string
  cmd: string
}

const ROOT = resolve(process.cwd(), '../..')

const TESTS: TestDef[] = [
  // Unit tests
  { id: 'all', icon: '🧪', name: 'Все юнит-тесты', desc: 'Проверяет всю логику приложения автоматически', group: 'unit', cmd: 'npx vitest run' },
  { id: 'backend', icon: '⚙️', name: 'Backend', desc: 'Тесты серверной части (API, авторизация, платежи)', group: 'unit', cmd: 'npx vitest run --project backend' },
  { id: 'store', icon: '🗄️', name: 'Store', desc: 'Тесты хранилища данных (Zustand)', group: 'unit', cmd: 'npx vitest run --project store' },
  { id: 'lib', icon: '📚', name: 'Библиотеки', desc: 'Тесты общих утилит и хелперов', group: 'unit', cmd: 'npx vitest run --project lib' },
  { id: 'i18n', icon: '🌍', name: 'Переводы (i18n)', desc: 'Проверяет что все переводы на месте (en, ru, es, ja)', group: 'unit', cmd: 'npx vitest run --project i18n' },
  // Specialized
  { id: 'coverage', icon: '📊', name: 'Покрытие кода', desc: 'Показывает % кода покрытого тестами. Минимум: 70%', group: 'specialized', cmd: 'npx vitest run --coverage' },
  { id: 'contracts', icon: '📝', name: 'API-контракты', desc: 'Проверяет что формат ответов API не сломался', group: 'specialized', cmd: 'npx vitest run --project backend -- api-contracts' },
  { id: 'schema', icon: '🗃️', name: 'Схема базы данных', desc: 'Проверяет структуру таблиц в PostgreSQL', group: 'specialized', cmd: 'npx vitest run --project backend -- schema-consistency' },
  { id: 'snapshots', icon: '📸', name: 'Обновить снапшоты', desc: 'Пересоздаёт эталонные снимки для сравнения', group: 'specialized', cmd: 'npx vitest run -u --project backend' },
  // E2E
  { id: 'e2e', icon: '🌐', name: 'E2E Web', desc: 'Открывает браузер и кликает по приложению как пользователь', group: 'e2e', cmd: 'npx playwright test' },
  { id: 'e2e-ext', icon: '🧩', name: 'E2E Расширение', desc: 'Тестирует Chrome расширение в реальном браузере', group: 'e2e', cmd: 'npx playwright test --config=playwright.extension.config.ts' },
  { id: 'e2e-visual', icon: '🎨', name: 'Визуальная регрессия', desc: 'Сравнивает скриншоты UI — ищет сломанную вёрстку', group: 'e2e', cmd: 'npx playwright test tests/e2e/visual.spec.ts' },
  // Quality
  { id: 'lint', icon: '✅', name: 'Lint + Типы', desc: 'Проверяет стиль кода и типы TypeScript', group: 'quality', cmd: 'npx turbo typecheck && npx eslint .' },
  { id: 'audit', icon: '🔒', name: 'Аудит безопасности', desc: 'Сканирует зависимости на критические уязвимости', group: 'quality', cmd: 'npm audit --audit-level=critical' },
  { id: 'docker', icon: '🐳', name: 'Docker сборка', desc: 'Проверяет что Docker-образ backend собирается', group: 'quality', cmd: 'docker build -f apps/backend/docker/Dockerfile -t mvp-backend:test apps/backend' },
  { id: 'ci', icon: '🚀', name: 'Полный CI', desc: 'Запускает ВСЁ как на сервере (lint → тесты → Docker)', group: 'quality', cmd: 'npx turbo typecheck && npx eslint . && npx vitest run && npx vitest run --coverage && docker build -f apps/backend/docker/Dockerfile -t mvp-backend:ci apps/backend' },
]

// ─── State ───────────────────────────────────────────────────────────────────

interface TestState {
  status: 'idle' | 'running' | 'passed' | 'failed'
  log: string
  startedAt: number | null
  elapsed: string | null
  summary: string
}

const state: Record<string, TestState> = {}
for (const t of TESTS) {
  state[t.id] = { status: 'idle', log: '', startedAt: null, elapsed: null, summary: '' }
}

let runningProcess: ChildProcess | null = null
let runningId: string | null = null
const sseClients = new Set<FastifyReply>()

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getBackendModules(): string[] {
  const dir = resolve(ROOT, 'apps/backend/src/modules')
  if (!existsSync(dir)) return []
  return readdirSync(dir, { withFileTypes: true })
    .filter(d => d.isDirectory() && existsSync(resolve(dir, d.name, '__tests__')))
    .map(d => d.name)
}

function broadcast(event: string, data: unknown) {
  const msg = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
  for (const reply of sseClients) {
    try { reply.raw.write(msg) } catch { sseClients.delete(reply) }
  }
}

function parseSummary(log: string): string {
  const vitestFail = log.match(/Tests\s+(\d+)\s+failed\s*\|\s*(\d+)\s+passed/)
  if (vitestFail) return `${vitestFail[2]} passed, ${vitestFail[1]} failed`
  const vitestPass = log.match(/Tests\s+(\d+)\s+passed\s+\((\d+)\)/)
  if (vitestPass) return `${vitestPass[1]} passed`
  const pwMatch = log.match(/(\d+)\s+passed/)
  if (pwMatch) return `${pwMatch[1]} passed`
  return ''
}

function runTest(id: string) {
  let cmd: string
  const testDef = TESTS.find(t => t.id === id)
  if (testDef) {
    cmd = testDef.cmd
  } else {
    const modules = getBackendModules()
    if (modules.includes(id)) {
      cmd = `npx vitest run --project backend -- ${id}`
    } else {
      return
    }
  }

  // Kill previous
  if (runningProcess) {
    try { runningProcess.kill('SIGTERM') } catch { /* ignore */ }
    if (runningId && state[runningId]) state[runningId].status = 'idle'
  }

  if (!state[id]) state[id] = { status: 'idle', log: '', startedAt: null, elapsed: null, summary: '' }
  state[id].status = 'running'
  state[id].log = ''
  state[id].startedAt = Date.now()
  state[id].elapsed = null
  state[id].summary = ''
  runningId = id
  broadcast('status', { id, status: 'running' })

  const proc = spawn('sh', ['-c', cmd], { cwd: ROOT, env: { ...process.env, FORCE_COLOR: '1' } })
  runningProcess = proc

  const onData = (chunk: Buffer) => {
    const text = chunk.toString()
    state[id].log += text
    broadcast('log', { id, text })
  }
  proc.stdout.on('data', onData)
  proc.stderr.on('data', onData)

  proc.on('close', (code) => {
    const elapsed = ((Date.now() - (state[id].startedAt || Date.now())) / 1000).toFixed(1)
    state[id].status = code === 0 ? 'passed' : 'failed'
    state[id].elapsed = elapsed
    state[id].summary = parseSummary(state[id].log)
    if (runningId === id) { runningProcess = null; runningId = null }
    broadcast('status', { id, status: state[id].status, elapsed, summary: state[id].summary })
  })
}

function stopTest() {
  if (runningProcess) {
    try { runningProcess.kill('SIGTERM') } catch { /* ignore */ }
    if (runningId && state[runningId]) {
      state[runningId].status = 'idle'
      broadcast('status', { id: runningId, status: 'idle' })
    }
    runningProcess = null
    runningId = null
  }
}

// ─── Routes ──────────────────────────────────────────────────────────────────

export async function devToolsRoutes(app: FastifyInstance) {
  // Dashboard HTML
  app.get('/tests', async (_request: FastifyRequest, reply: FastifyReply) => {
    const modules = getBackendModules()
    reply.header('Content-Type', 'text/html; charset=utf-8')
    return devTestsDashboardHTML(TESTS, modules)
  })

  // SSE stream
  app.get('/tests/stream', async (request: FastifyRequest, reply: FastifyReply) => {
    reply.raw.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    })
    reply.raw.write(`event: init\ndata: ${JSON.stringify({ state, running: runningId })}\n\n`)
    sseClients.add(reply)

    const heartbeat = setInterval(() => {
      try { reply.raw.write(`:heartbeat\n\n`) } catch { clearInterval(heartbeat) }
    }, 30000)

    request.raw.on('close', () => {
      clearInterval(heartbeat)
      sseClients.delete(reply)
    })
  })

  // Run test
  app.post('/tests/run', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.body as { id: string }
    runTest(id)
    return { ok: true }
  })

  // Stop test
  app.post('/tests/stop', async (_request: FastifyRequest, _reply: FastifyReply) => {
    stopTest()
    return { ok: true }
  })

  // Modules list
  app.get('/tests/modules', async () => {
    return getBackendModules()
  })

  // Log for specific test
  app.get('/tests/log', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.query as { id: string }
    if (id && state[id]) {
      return { log: state[id].log }
    }
    reply.code(404)
    return { error: 'Not found' }
  })
}
