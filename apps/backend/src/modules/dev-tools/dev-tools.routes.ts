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
  state[t.id] = { status: 'idle', log: '', startedAt: null, elapsed: null, summary: '', passed: 0, failed: 0, total: 0 }
}

let runningProcess: ChildProcess | null = null
let runningId: string | null = null
const sseClients = new Set<FastifyReply>()

// ─── Failure history (in-memory, last N per test) ───────────────────────────

interface FailureEntry {
  id: string
  testName: string
  timestamp: number
  elapsed: string | null
  summary: string
  log: string
  passed: number
  failed: number
  total: number
  failedTests: FailedTestInfo[]
}

const MAX_FAILURES = 50
const failureHistory: FailureEntry[] = []

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

interface TestSummary {
  text: string
  passed: number
  failed: number
  total: number
}

function parseSummary(log: string): TestSummary {
  // Vitest: "Tests  2 failed | 5 passed (7)"
  const vitestFail = log.match(/Tests\s+(\d+)\s+failed\s*\|\s*(\d+)\s+passed\s*\((\d+)\)/)
  if (vitestFail) {
    const failed = parseInt(vitestFail[1]), passed = parseInt(vitestFail[2]), total = parseInt(vitestFail[3])
    return { text: `${passed}/${total}`, passed, failed, total }
  }
  // Vitest: "Tests  2 failed | 5 passed" (no total in parens)
  const vitestFail2 = log.match(/Tests\s+(\d+)\s+failed\s*\|\s*(\d+)\s+passed/)
  if (vitestFail2) {
    const failed = parseInt(vitestFail2[1]), passed = parseInt(vitestFail2[2]), total = passed + failed
    return { text: `${passed}/${total}`, passed, failed, total }
  }
  // Vitest: "Tests  5 passed (5)"
  const vitestPass = log.match(/Tests\s+(\d+)\s+passed\s+\((\d+)\)/)
  if (vitestPass) {
    const passed = parseInt(vitestPass[1]), total = parseInt(vitestPass[2])
    return { text: `${passed}/${total}`, passed, failed: 0, total }
  }
  // Playwright: "5 passed"
  const pwMatch = log.match(/(\d+)\s+passed/)
  if (pwMatch) {
    const passed = parseInt(pwMatch[1])
    // Check for "X failed" too
    const pwFail = log.match(/(\d+)\s+failed/)
    const failed = pwFail ? parseInt(pwFail[1]) : 0
    const total = passed + failed
    return { text: `${passed}/${total}`, passed, failed, total }
  }
  return { text: '', passed: 0, failed: 0, total: 0 }
}

interface FailedTestInfo {
  name: string
  file?: string
  error?: string
}

function parseFailedTests(log: string): FailedTestInfo[] {
  const failed: FailedTestInfo[] = []
  const seen = new Set<string>()

  // Strip ANSI codes for easier parsing
  const clean = log.replace(/\x1b\[[0-9;]*m/g, '')

  // Vitest: " FAIL  src/modules/auth/__tests__/auth.test.ts > Suite > test name"
  const vitestFailBlocks = clean.match(/^\s*(?:FAIL|×|✕|❌)\s+(.+)$/gm)
  if (vitestFailBlocks) {
    for (const line of vitestFailBlocks) {
      const name = line.replace(/^\s*(?:FAIL|×|✕|❌)\s+/, '').trim()
      if (!name || seen.has(name)) continue
      seen.add(name)
      // Extract file from "path/to/file.ts > ..." pattern
      const fileParts = name.match(/^([\w/.@-]+\.(?:ts|tsx|js|jsx))\s*>\s*(.+)/)
      const info: FailedTestInfo = fileParts
        ? { name: fileParts[2].trim(), file: fileParts[1] }
        : { name }
      failed.push(info)
    }
  }

  // Vitest: look for AssertionError/Error messages after FAIL lines
  const errorBlocks = clean.split(/(?=^\s*(?:FAIL|×|✕|❌)\s+)/m)
  for (const block of errorBlocks) {
    const headerMatch = block.match(/^\s*(?:FAIL|×|✕|❌)\s+(.+)$/m)
    if (!headerMatch) continue
    const testName = headerMatch[1].trim()
    // Find error message: "AssertionError: ..." or "Error: ..." or "expected ... to ..."
    const errMatch = block.match(/(?:AssertionError|Error|TypeError|ReferenceError):\s*(.+?)(?:\n|$)/m)
      || block.match(/expected\s+(.+?)(?:\n|$)/m)
    if (errMatch) {
      const entry = failed.find(f => f.name === testName || (f.file && testName.startsWith(f.file)))
      if (entry && !entry.error) {
        entry.error = errMatch[0].trim().slice(0, 200) // cap length
      }
    }
  }

  // Playwright: "  1) [chromium] › path/to/test.ts:42:5 › test name ──"
  const pwLines = clean.match(/^\s*\d+\)\s+(.+?)(?:\s*─+\s*)?$/gm)
  if (pwLines) {
    for (const line of pwLines) {
      const name = line.replace(/^\s*\d+\)\s+/, '').replace(/\s*─+\s*$/, '').trim()
      if (!name || seen.has(name)) continue
      seen.add(name)
      // Extract file: "[chromium] › path.ts:42:5 › test name"
      const pwParts = name.match(/(?:\[.+?\]\s*›\s*)?([\w/.@-]+\.(?:ts|tsx|js|jsx)(?::\d+(?::\d+)?)?)\s*›\s*(.+)/)
      failed.push(pwParts
        ? { name: pwParts[2].trim(), file: pwParts[1] }
        : { name }
      )
    }
  }

  return failed
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

  if (!state[id]) state[id] = { status: 'idle', log: '', startedAt: null, elapsed: null, summary: '', passed: 0, failed: 0, total: 0 }
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
    const summary = parseSummary(state[id].log)
    state[id].status = code === 0 ? 'passed' : 'failed'
    state[id].elapsed = elapsed
    state[id].summary = summary.text
    state[id].passed = summary.passed
    state[id].failed = summary.failed
    state[id].total = summary.total
    if (runningId === id) { runningProcess = null; runningId = null }
    // On pass: remove from failure history
    if (state[id].status === 'passed') {
      const prevIdx = failureHistory.findIndex(f => f.id === id)
      if (prevIdx !== -1) {
        failureHistory.splice(prevIdx, 1)
        broadcast('failure', { id, removed: true, count: failureHistory.length })
      }
    }
    // Save failure to history
    if (state[id].status === 'failed') {
      const testDef = TESTS.find(t => t.id === id)
      // Remove previous failure for the same test (keep only latest per test)
      const prevIdx = failureHistory.findIndex(f => f.id === id)
      if (prevIdx !== -1) failureHistory.splice(prevIdx, 1)
      failureHistory.unshift({
        id,
        testName: testDef?.name ?? id,
        timestamp: Date.now(),
        elapsed,
        summary: summary.text,
        log: state[id].log,
        passed: summary.passed,
        failed: summary.failed,
        total: summary.total,
        failedTests: parseFailedTests(state[id].log),
      })
      if (failureHistory.length > MAX_FAILURES) failureHistory.length = MAX_FAILURES
      broadcast('failure', { id, testName: testDef?.name ?? id, timestamp: Date.now(), count: failureHistory.length })
    }
    broadcast('status', { id, status: state[id].status, elapsed, summary: summary.text, passed: summary.passed, failed: summary.failed, total: summary.total })
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

  // Full state (polling fallback for native — no SSE)
  app.get('/tests/state', async () => {
    const s: Record<string, { status: string; elapsed: string | null; summary: string; passed: number; failed: number; total: number }> = {}
    for (const [id, v] of Object.entries(state)) {
      s[id] = { status: v.status, elapsed: v.elapsed, summary: v.summary, passed: v.passed, failed: v.failed, total: v.total }
    }
    return { state: s, running: runningId }
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

  // Failure history — list (without logs for lightweight fetch)
  app.get('/tests/failures', async () => {
    return failureHistory.map(f => ({
      id: f.id,
      testName: f.testName,
      timestamp: f.timestamp,
      elapsed: f.elapsed,
      summary: f.summary,
      passed: f.passed,
      failed: f.failed,
      total: f.total,
      failedTests: f.failedTests,
    }))
  })

  // Failure log — full log for a specific failure entry by index
  app.get('/tests/failures/log', async (request: FastifyRequest, reply: FastifyReply) => {
    const { index } = request.query as { index: string }
    const i = parseInt(index, 10)
    if (isNaN(i) || i < 0 || i >= failureHistory.length) {
      reply.code(404)
      return { error: 'Not found' }
    }
    return { log: failureHistory[i].log, id: failureHistory[i].id, testName: failureHistory[i].testName, timestamp: failureHistory[i].timestamp }
  })

  // Clear failure history
  app.delete('/tests/failures', async () => {
    failureHistory.length = 0
    return { ok: true }
  })
}
