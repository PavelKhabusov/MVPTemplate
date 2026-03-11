#!/usr/bin/env node
/**
 * test-dashboard.mjs — Visual web UI for running and monitoring all project tests.
 *
 * Usage: node scripts/test-dashboard.mjs
 * Opens: http://localhost:5175
 */

import { createServer } from 'http'
import { spawn, execSync } from 'child_process'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { readdirSync, existsSync } from 'fs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const PORT = 5175

// ─── Test definitions ────────────────────────────────────────────────────────

const TESTS = [
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

const state = {}
for (const t of TESTS) {
  state[t.id] = { status: 'idle', log: '', startedAt: null, elapsed: null, summary: '' }
}

let runningProcess = null
let runningId = null
const sseClients = new Set()

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getBackendModules() {
  const dir = resolve(ROOT, 'apps/backend/src/modules')
  if (!existsSync(dir)) return []
  return readdirSync(dir, { withFileTypes: true })
    .filter(d => d.isDirectory() && existsSync(resolve(dir, d.name, '__tests__')))
    .map(d => d.name)
}

function broadcast(event, data) {
  const msg = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
  for (const res of sseClients) {
    try { res.write(msg) } catch { sseClients.delete(res) }
  }
}

function parseSummary(log) {
  // Try to parse vitest summary
  const vitestMatch = log.match(/Tests\s+(\d+)\s+failed\s*\|\s*(\d+)\s+passed/)
  if (vitestMatch) return `${vitestMatch[2]} passed, ${vitestMatch[1]} failed`
  const vitestPass = log.match(/Tests\s+(\d+)\s+passed\s+\((\d+)\)/)
  if (vitestPass) return `${vitestPass[1]} passed`
  // Playwright
  const pwMatch = log.match(/(\d+)\s+passed/)
  if (pwMatch) return `${pwMatch[1]} passed`
  return ''
}

function runTest(id) {
  // Find test definition — could be a predefined test or a module
  let cmd
  const testDef = TESTS.find(t => t.id === id)
  if (testDef) {
    cmd = testDef.cmd
  } else {
    // Module test
    const modules = getBackendModules()
    if (modules.includes(id)) {
      cmd = `npx vitest run --project backend -- ${id}`
    } else {
      return
    }
  }

  // Kill previous
  if (runningProcess) {
    try { runningProcess.kill('SIGTERM') } catch {}
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

  const onData = (chunk) => {
    const text = chunk.toString()
    state[id].log += text
    broadcast('log', { id, text })
  }
  proc.stdout.on('data', onData)
  proc.stderr.on('data', onData)

  proc.on('close', (code) => {
    const elapsed = ((Date.now() - state[id].startedAt) / 1000).toFixed(1)
    state[id].status = code === 0 ? 'passed' : 'failed'
    state[id].elapsed = elapsed
    state[id].summary = parseSummary(state[id].log)
    if (runningId === id) { runningProcess = null; runningId = null }
    broadcast('status', { id, status: state[id].status, elapsed, summary: state[id].summary })
  })
}

function stopTest() {
  if (runningProcess) {
    try { runningProcess.kill('SIGTERM') } catch {}
    if (runningId && state[runningId]) {
      state[runningId].status = 'idle'
      broadcast('status', { id: runningId, status: 'idle' })
    }
    runningProcess = null
    runningId = null
  }
}

// ─── HTTP Server ─────────────────────────────────────────────────────────────

const server = createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`)

  // SSE
  if (url.pathname === '/api/stream') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    })
    res.write(`event: init\ndata: ${JSON.stringify({ state, running: runningId })}\n\n`)
    sseClients.add(res)
    req.on('close', () => sseClients.delete(res))
    return
  }

  // API: modules
  if (url.pathname === '/api/modules' && req.method === 'GET') {
    const modules = getBackendModules()
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify(modules))
    return
  }

  // API: run
  if (url.pathname === '/api/run' && req.method === 'POST') {
    let body = ''
    req.on('data', c => body += c)
    req.on('end', () => {
      try {
        const { id } = JSON.parse(body)
        runTest(id)
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ ok: true }))
      } catch {
        res.writeHead(400)
        res.end('Bad request')
      }
    })
    return
  }

  // API: stop
  if (url.pathname === '/api/stop' && req.method === 'POST') {
    stopTest()
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ ok: true }))
    return
  }

  // API: log for specific test
  if (url.pathname === '/api/log' && req.method === 'GET') {
    const id = url.searchParams.get('id')
    if (id && state[id]) {
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ log: state[id].log }))
    } else {
      res.writeHead(404)
      res.end('Not found')
    }
    return
  }

  // HTML
  if (url.pathname === '/') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
    res.end(getHTML())
    return
  }

  res.writeHead(404)
  res.end('Not found')
})

server.listen(PORT, () => {
  console.log(`\n  🧪 Test Dashboard: http://localhost:${PORT}\n`)
  // Auto-open browser
  try {
    const platform = process.platform
    const cmd = platform === 'darwin' ? 'open' : platform === 'win32' ? 'start' : 'xdg-open'
    execSync(`${cmd} http://localhost:${PORT}`, { stdio: 'ignore' })
  } catch {}
})

// ─── HTML ────────────────────────────────────────────────────────────────────

function getHTML() {
  const testsJSON = JSON.stringify(TESTS)
  const modulesJSON = JSON.stringify(getBackendModules())

  return `<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>MVPTemplate — Тест-центр</title>
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg: #0f1117;
    --surface: #1a1d27;
    --surface-hover: #222633;
    --border: #2a2e3a;
    --text: #e1e4ed;
    --text-dim: #8b8fa3;
    --green: #22c55e;
    --green-bg: rgba(34,197,94,0.1);
    --red: #ef4444;
    --red-bg: rgba(239,68,68,0.1);
    --yellow: #eab308;
    --yellow-bg: rgba(234,179,8,0.1);
    --blue: #3b82f6;
    --blue-bg: rgba(59,130,246,0.1);
    --accent: #8b5cf6;
    --radius: 12px;
  }

  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
    background: var(--bg);
    color: var(--text);
    min-height: 100vh;
    line-height: 1.5;
  }

  /* Header */
  .header {
    padding: 24px 32px;
    border-bottom: 1px solid var(--border);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    flex-wrap: wrap;
  }
  .header h1 {
    font-size: 22px;
    font-weight: 700;
    letter-spacing: -0.3px;
  }
  .header h1 span { margin-right: 8px; }
  .global-status {
    font-size: 14px;
    padding: 6px 14px;
    border-radius: 20px;
    font-weight: 500;
  }
  .global-status.idle { background: var(--surface); color: var(--text-dim); }
  .global-status.passed { background: var(--green-bg); color: var(--green); }
  .global-status.failed { background: var(--red-bg); color: var(--red); }
  .global-status.running { background: var(--yellow-bg); color: var(--yellow); }

  /* Layout */
  .main {
    display: flex;
    flex-direction: column;
    height: calc(100vh - 73px);
  }
  .cards-area {
    flex: 1;
    overflow-y: auto;
    padding: 24px 32px;
  }

  /* Group */
  .group-title {
    font-size: 13px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: var(--text-dim);
    margin: 20px 0 12px 0;
  }
  .group-title:first-child { margin-top: 0; }

  /* Cards grid */
  .cards-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 12px;
    margin-bottom: 8px;
  }

  /* Card */
  .card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 16px 18px;
    cursor: pointer;
    transition: all 0.15s ease;
    position: relative;
    overflow: hidden;
  }
  .card:hover { background: var(--surface-hover); border-color: #3a3e4a; }
  .card.active { border-color: var(--accent); box-shadow: 0 0 0 1px var(--accent); }
  .card.status-running { border-color: var(--yellow); }
  .card.status-passed { border-left: 3px solid var(--green); }
  .card.status-failed { border-left: 3px solid var(--red); }

  .card-header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 6px;
  }
  .card-icon { font-size: 22px; flex-shrink: 0; }
  .card-name { font-size: 15px; font-weight: 600; }
  .card-desc {
    font-size: 12.5px;
    color: var(--text-dim);
    margin-bottom: 12px;
    line-height: 1.4;
  }

  .card-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }
  .card-status {
    font-size: 12px;
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .status-dot {
    width: 8px; height: 8px;
    border-radius: 50%;
    background: var(--text-dim);
    flex-shrink: 0;
  }
  .status-dot.running { background: var(--yellow); animation: pulse 1s infinite; }
  .status-dot.passed { background: var(--green); }
  .status-dot.failed { background: var(--red); }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.4; }
  }

  .card-btn {
    background: var(--blue);
    color: #fff;
    border: none;
    border-radius: 8px;
    padding: 6px 14px;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 5px;
    transition: background 0.15s;
    white-space: nowrap;
  }
  .card-btn:hover { background: #2563eb; }
  .card-btn.stop { background: var(--red); }
  .card-btn.stop:hover { background: #dc2626; }

  .card-result {
    font-size: 11px;
    color: var(--text-dim);
    margin-top: 8px;
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .card-result .time { color: var(--text-dim); }
  .card-result .pass-count { color: var(--green); }
  .card-result .fail-count { color: var(--red); }

  /* Progress bar */
  .progress-bar {
    height: 3px;
    background: var(--border);
    border-radius: 2px;
    margin-top: 10px;
    overflow: hidden;
    display: none;
  }
  .card.status-running .progress-bar { display: block; }
  .progress-bar-inner {
    height: 100%;
    background: var(--yellow);
    border-radius: 2px;
    animation: indeterminate 1.5s infinite ease-in-out;
    width: 40%;
  }
  @keyframes indeterminate {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(350%); }
  }

  /* Module runner */
  .module-runner {
    padding: 0 32px 16px;
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
  }
  .module-runner label {
    font-size: 13px;
    color: var(--text-dim);
  }
  .module-runner select {
    background: var(--surface);
    color: var(--text);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 6px 12px;
    font-size: 13px;
    cursor: pointer;
  }
  .module-runner select:hover { border-color: #3a3e4a; }
  .module-btn {
    background: var(--accent);
    color: #fff;
    border: none;
    border-radius: 8px;
    padding: 6px 16px;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
  }
  .module-btn:hover { background: #7c3aed; }

  /* Log panel */
  .log-panel {
    border-top: 1px solid var(--border);
    height: 280px;
    min-height: 120px;
    display: flex;
    flex-direction: column;
    background: #0a0c10;
    flex-shrink: 0;
    resize: vertical;
    overflow: hidden;
  }
  .log-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 16px;
    border-bottom: 1px solid var(--border);
    background: var(--surface);
    flex-shrink: 0;
  }
  .log-title {
    font-size: 13px;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .log-actions {
    display: flex;
    gap: 8px;
  }
  .log-actions button {
    background: transparent;
    color: var(--text-dim);
    border: 1px solid var(--border);
    border-radius: 6px;
    padding: 3px 10px;
    font-size: 11px;
    cursor: pointer;
  }
  .log-actions button:hover { color: var(--text); border-color: #3a3e4a; }
  .log-content {
    flex: 1;
    overflow-y: auto;
    padding: 12px 16px;
    font-family: 'JetBrains Mono', 'SF Mono', 'Fira Code', 'Cascadia Code', monospace;
    font-size: 12px;
    line-height: 1.6;
    white-space: pre-wrap;
    word-break: break-all;
    color: #c9d1d9;
  }

  /* ANSI colors */
  .ansi-red { color: #f87171; }
  .ansi-green { color: #4ade80; }
  .ansi-yellow { color: #facc15; }
  .ansi-blue { color: #60a5fa; }
  .ansi-magenta { color: #c084fc; }
  .ansi-cyan { color: #22d3ee; }
  .ansi-gray { color: #6b7280; }
  .ansi-white { color: #e5e7eb; }
  .ansi-bold { font-weight: 700; }
  .ansi-dim { opacity: 0.6; }

  /* Scrollbar */
  ::-webkit-scrollbar { width: 6px; height: 6px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: #333; border-radius: 3px; }
  ::-webkit-scrollbar-thumb:hover { background: #444; }
</style>
</head>
<body>

<div class="header">
  <h1><span>🧪</span> MVPTemplate — Тест-центр</h1>
  <div class="global-status idle" id="globalStatus">Готов к запуску</div>
</div>

<div class="main">
  <div class="cards-area" id="cardsArea"></div>

  <div class="module-runner">
    <label>⚡ Быстрый запуск модуля:</label>
    <select id="moduleSelect"><option value="">Выберите модуль...</option></select>
    <button class="module-btn" onclick="runModule()">▶ Запустить</button>
  </div>

  <div class="log-panel">
    <div class="log-header">
      <div class="log-title">
        <span>📋</span>
        <span id="logLabel">Лог вывода</span>
      </div>
      <div class="log-actions">
        <button onclick="copyLog()">Копировать</button>
        <button onclick="clearLog()">Очистить</button>
      </div>
    </div>
    <div class="log-content" id="logContent">Выберите тест для запуска...\n</div>
  </div>
</div>

<script>
const TESTS = ${testsJSON};
const MODULES = ${modulesJSON};
const groups = {
  unit: '🔬 Юнит-тесты',
  specialized: '🎯 Специализированные',
  e2e: '🌐 E2E (End-to-End)',
  quality: '🛡️ Качество и CI/CD',
};

// State
const state = {};
TESTS.forEach(t => { state[t.id] = { status: 'idle', log: '', elapsed: null, summary: '' }; });
let activeCardId = null;
let runningId = null;

// ─── Render ───────────────────────────────────────────────────────────────

function render() {
  const area = document.getElementById('cardsArea');
  area.innerHTML = '';

  for (const [groupId, groupLabel] of Object.entries(groups)) {
    const tests = TESTS.filter(t => t.group === groupId);
    if (!tests.length) continue;

    const title = document.createElement('div');
    title.className = 'group-title';
    title.textContent = groupLabel;
    area.appendChild(title);

    const grid = document.createElement('div');
    grid.className = 'cards-grid';

    for (const t of tests) {
      const s = state[t.id] || { status: 'idle' };
      const isActive = activeCardId === t.id;
      const isRunning = s.status === 'running';

      const card = document.createElement('div');
      card.className = 'card' + (isActive ? ' active' : '') + ' status-' + s.status;
      card.onclick = (e) => {
        if (e.target.closest('.card-btn')) return;
        selectCard(t.id);
      };

      const statusLabel = {
        idle: 'Ожидание', running: 'Выполняется...', passed: 'Пройден', failed: 'Ошибки'
      }[s.status] || s.status;

      card.innerHTML = \`
        <div class="card-header">
          <span class="card-icon">\${t.icon}</span>
          <span class="card-name">\${t.name}</span>
        </div>
        <div class="card-desc">\${t.desc}</div>
        <div class="card-footer">
          <div class="card-status">
            <span class="status-dot \${s.status}"></span>
            <span>\${statusLabel}</span>
          </div>
          \${isRunning
            ? '<button class="card-btn stop" onclick="stopTest()">■ Стоп</button>'
            : '<button class="card-btn" onclick="runTest(\\'' + t.id + '\\')">▶ Запустить</button>'}
        </div>
        \${s.elapsed || s.summary ? \`<div class="card-result">
          \${s.summary ? '<span class="' + (s.status === 'passed' ? 'pass-count' : 'fail-count') + '">' + s.summary + '</span>' : ''}
          \${s.elapsed ? '<span class="time">' + s.elapsed + 's</span>' : ''}
        </div>\` : ''}
        <div class="progress-bar"><div class="progress-bar-inner"></div></div>
      \`;

      grid.appendChild(card);
    }
    area.appendChild(grid);
  }
}

function selectCard(id) {
  activeCardId = id;
  render();
  showLog(id);
}

function showLog(id) {
  const s = state[id] || {};
  const t = TESTS.find(x => x.id === id) || { icon: '⚡', name: id };
  document.getElementById('logLabel').textContent = t.icon + ' ' + t.name;
  document.getElementById('logContent').innerHTML = ansiToHtml(s.log || 'Лог пуст. Нажмите ▶ для запуска.');
  const el = document.getElementById('logContent');
  el.scrollTop = el.scrollHeight;
}

// ─── ANSI → HTML ──────────────────────────────────────────────────────────

function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function ansiToHtml(text) {
  text = escapeHtml(text);
  const map = {
    '1': 'ansi-bold', '2': 'ansi-dim',
    '31': 'ansi-red', '32': 'ansi-green', '33': 'ansi-yellow',
    '34': 'ansi-blue', '35': 'ansi-magenta', '36': 'ansi-cyan',
    '37': 'ansi-white', '90': 'ansi-gray',
    '91': 'ansi-red', '92': 'ansi-green', '93': 'ansi-yellow',
    '94': 'ansi-blue', '95': 'ansi-magenta', '96': 'ansi-cyan',
  };
  // Replace ANSI codes with spans
  let result = text.replace(/\\x1b\\[(\\d+(?:;\\d+)*)m/g, (_, codes) => {
    if (codes === '0' || codes === '39') return '</span>';
    const classes = codes.split(';').map(c => map[c]).filter(Boolean).join(' ');
    return classes ? '<span class="' + classes + '">' : '';
  });
  // Also handle \\e[ and \\033[ patterns from raw output
  result = result.replace(/(?:\\\\x1b|\\\\e|\\\\033)\\[(\\d+(?:;\\d+)*)m/g, (_, codes) => {
    if (codes === '0' || codes === '39') return '</span>';
    const classes = codes.split(';').map(c => map[c]).filter(Boolean).join(' ');
    return classes ? '<span class="' + classes + '">' : '';
  });
  return result;
}

// ─── API calls ────────────────────────────────────────────────────────────

function runTest(id) {
  state[id] = { status: 'running', log: '', startedAt: Date.now(), elapsed: null, summary: '' };
  runningId = id;
  activeCardId = id;
  render();
  showLog(id);
  updateGlobalStatus();
  fetch('/api/run', { method: 'POST', body: JSON.stringify({ id }), headers: { 'Content-Type': 'application/json' } });
}

function stopTest() {
  fetch('/api/stop', { method: 'POST' });
}

function runModule() {
  const sel = document.getElementById('moduleSelect');
  const mod = sel.value;
  if (!mod) return;
  if (!state[mod]) state[mod] = { status: 'idle', log: '', elapsed: null, summary: '' };
  runTest(mod);
}

function clearLog() {
  document.getElementById('logContent').innerHTML = '';
  if (activeCardId && state[activeCardId]) state[activeCardId].log = '';
}

function copyLog() {
  const text = document.getElementById('logContent').innerText;
  navigator.clipboard.writeText(text);
}

function updateGlobalStatus() {
  const el = document.getElementById('globalStatus');
  const statuses = Object.values(state).map(s => s.status);
  if (statuses.includes('running')) {
    el.className = 'global-status running';
    el.textContent = '⏳ Тесты выполняются...';
  } else if (statuses.includes('failed')) {
    const failCount = statuses.filter(s => s === 'failed').length;
    el.className = 'global-status failed';
    el.textContent = '✗ ' + failCount + ' с ошибками';
  } else if (statuses.some(s => s === 'passed')) {
    const passCount = statuses.filter(s => s === 'passed').length;
    el.className = 'global-status passed';
    el.textContent = '✓ ' + passCount + ' пройдено';
  } else {
    el.className = 'global-status idle';
    el.textContent = 'Готов к запуску';
  }
}

// ─── SSE ──────────────────────────────────────────────────────────────────

function connectSSE() {
  const es = new EventSource('/api/stream');

  es.addEventListener('init', (e) => {
    const data = JSON.parse(e.data);
    Object.assign(state, data.state || {});
    runningId = data.running;
    render();
    updateGlobalStatus();
    if (activeCardId) showLog(activeCardId);
  });

  es.addEventListener('log', (e) => {
    const { id, text } = JSON.parse(e.data);
    if (state[id]) state[id].log += text;
    if (activeCardId === id) {
      const el = document.getElementById('logContent');
      el.innerHTML = ansiToHtml(state[id].log);
      el.scrollTop = el.scrollHeight;
    }
  });

  es.addEventListener('status', (e) => {
    const { id, status, elapsed, summary } = JSON.parse(e.data);
    if (state[id]) {
      state[id].status = status;
      if (elapsed != null) state[id].elapsed = elapsed;
      if (summary != null) state[id].summary = summary;
    }
    if (status !== 'running') runningId = null;
    render();
    updateGlobalStatus();
    if (activeCardId === id) showLog(id);
  });

  es.onerror = () => {
    es.close();
    setTimeout(connectSSE, 2000);
  };
}

// ─── Init ─────────────────────────────────────────────────────────────────

// Populate modules dropdown
const sel = document.getElementById('moduleSelect');
MODULES.forEach(m => {
  const opt = document.createElement('option');
  opt.value = m;
  opt.textContent = m;
  sel.appendChild(opt);
});

render();
connectSSE();
</script>
</body>
</html>`;
}
