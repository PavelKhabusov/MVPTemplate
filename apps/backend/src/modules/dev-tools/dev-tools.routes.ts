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
import { TESTS, type TestState } from '@mvp/dev-tools/src/tests'

const ROOT = resolve(process.cwd(), '../..')

// ─── State ───────────────────────────────────────────────────────────────────

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
    const origin = request.headers.origin
    reply.raw.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      ...(origin ? { 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Credentials': 'true' } : {}),
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
