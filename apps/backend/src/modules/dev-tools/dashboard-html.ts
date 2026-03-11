/**
 * Test Dashboard HTML — inline SPA for /dev/tests
 */

interface TestDef {
  id: string
  icon: string
  name: string
  desc: string
  group: string
}

export function devTestsDashboardHTML(tests: TestDef[], modules: string[]): string {
  const testsJSON = JSON.stringify(tests)
  const modulesJSON = JSON.stringify(modules)

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
    padding: 20px 28px;
    border-bottom: 1px solid var(--border);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    flex-wrap: wrap;
  }
  .header h1 { font-size: 20px; font-weight: 700; letter-spacing: -0.3px; }
  .header h1 span { margin-right: 8px; }
  .global-status {
    font-size: 13px;
    padding: 5px 14px;
    border-radius: 20px;
    font-weight: 500;
  }
  .global-status.idle { background: var(--surface); color: var(--text-dim); }
  .global-status.passed { background: var(--green-bg); color: var(--green); }
  .global-status.failed { background: var(--red-bg); color: var(--red); }
  .global-status.running { background: var(--yellow-bg); color: var(--yellow); }

  /* Layout */
  .main { display: flex; flex-direction: column; height: calc(100vh - 65px); }
  .cards-area { flex: 1; overflow-y: auto; padding: 20px 28px; }

  /* Group */
  .group-title {
    font-size: 12px; font-weight: 600; text-transform: uppercase;
    letter-spacing: 1px; color: var(--text-dim); margin: 18px 0 10px 0;
  }
  .group-title:first-child { margin-top: 0; }

  /* Cards grid */
  .cards-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: 10px;
    margin-bottom: 6px;
  }

  /* Card */
  .card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 14px 16px;
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

  .card-header { display: flex; align-items: center; gap: 10px; margin-bottom: 4px; }
  .card-icon { font-size: 20px; flex-shrink: 0; }
  .card-name { font-size: 14px; font-weight: 600; }
  .card-desc { font-size: 12px; color: var(--text-dim); margin-bottom: 10px; line-height: 1.4; }

  .card-footer { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
  .card-status { font-size: 11px; display: flex; align-items: center; gap: 6px; }
  .status-dot {
    width: 7px; height: 7px; border-radius: 50%;
    background: var(--text-dim); flex-shrink: 0;
  }
  .status-dot.running { background: var(--yellow); animation: pulse 1s infinite; }
  .status-dot.passed { background: var(--green); }
  .status-dot.failed { background: var(--red); }

  @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }

  .card-btn {
    background: var(--blue); color: #fff; border: none; border-radius: 8px;
    padding: 5px 12px; font-size: 11px; font-weight: 600; cursor: pointer;
    display: flex; align-items: center; gap: 4px; transition: background 0.15s; white-space: nowrap;
  }
  .card-btn:hover { background: #2563eb; }
  .card-btn.stop { background: var(--red); }
  .card-btn.stop:hover { background: #dc2626; }

  .card-result {
    font-size: 10px; color: var(--text-dim); margin-top: 6px;
    display: flex; align-items: center; gap: 6px;
  }
  .card-result .time { color: var(--text-dim); }
  .card-result .pass-count { color: var(--green); }
  .card-result .fail-count { color: var(--red); }

  /* Progress bar */
  .progress-bar {
    height: 2px; background: var(--border); border-radius: 2px;
    margin-top: 8px; overflow: hidden; display: none;
  }
  .card.status-running .progress-bar { display: block; }
  .progress-bar-inner {
    height: 100%; background: var(--yellow); border-radius: 2px;
    animation: indeterminate 1.5s infinite ease-in-out; width: 40%;
  }
  @keyframes indeterminate { 0% { transform: translateX(-100%); } 100% { transform: translateX(350%); } }

  /* Module runner */
  .module-runner {
    padding: 0 28px 14px; display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
  }
  .module-runner label { font-size: 12px; color: var(--text-dim); }
  .module-runner select {
    background: var(--surface); color: var(--text); border: 1px solid var(--border);
    border-radius: 8px; padding: 5px 10px; font-size: 12px; cursor: pointer;
  }
  .module-runner select:hover { border-color: #3a3e4a; }
  .module-btn {
    background: var(--accent); color: #fff; border: none; border-radius: 8px;
    padding: 5px 14px; font-size: 11px; font-weight: 600; cursor: pointer;
  }
  .module-btn:hover { background: #7c3aed; }

  /* Log panel */
  .log-panel {
    border-top: 1px solid var(--border); height: 260px; min-height: 100px;
    display: flex; flex-direction: column; background: #0a0c10;
    flex-shrink: 0; resize: vertical; overflow: hidden;
  }
  .log-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 6px 14px; border-bottom: 1px solid var(--border);
    background: var(--surface); flex-shrink: 0;
  }
  .log-title { font-size: 12px; font-weight: 600; display: flex; align-items: center; gap: 8px; }
  .log-actions { display: flex; gap: 6px; }
  .log-actions button {
    background: transparent; color: var(--text-dim); border: 1px solid var(--border);
    border-radius: 6px; padding: 2px 8px; font-size: 10px; cursor: pointer;
  }
  .log-actions button:hover { color: var(--text); border-color: #3a3e4a; }
  .log-content {
    flex: 1; overflow-y: auto; padding: 10px 14px;
    font-family: 'JetBrains Mono', 'SF Mono', 'Fira Code', monospace;
    font-size: 11.5px; line-height: 1.6; white-space: pre-wrap;
    word-break: break-all; color: #c9d1d9;
  }

  /* ANSI colors */
  .ansi-red { color: #f87171; } .ansi-green { color: #4ade80; }
  .ansi-yellow { color: #facc15; } .ansi-blue { color: #60a5fa; }
  .ansi-magenta { color: #c084fc; } .ansi-cyan { color: #22d3ee; }
  .ansi-gray { color: #6b7280; } .ansi-white { color: #e5e7eb; }
  .ansi-bold { font-weight: 700; } .ansi-dim { opacity: 0.6; }

  /* Scrollbar */
  ::-webkit-scrollbar { width: 5px; height: 5px; }
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
      <div class="log-title"><span>📋</span><span id="logLabel">Лог вывода</span></div>
      <div class="log-actions">
        <button onclick="copyLog()">Копировать</button>
        <button onclick="clearLog()">Очистить</button>
      </div>
    </div>
    <div class="log-content" id="logContent">Выберите тест для запуска...\\n</div>
  </div>
</div>

<script>
const TESTS = ${testsJSON};
const MODULES = ${modulesJSON};
const PREFIX = '/dev/tests';
const groups = {
  unit: '\\u{1f52c} Юнит-тесты',
  specialized: '\\u{1f3af} Специализированные',
  e2e: '\\u{1f310} E2E (End-to-End)',
  quality: '\\u{1f6e1}\\ufe0f Качество и CI/CD',
};

const state = {};
TESTS.forEach(t => { state[t.id] = { status: 'idle', log: '', elapsed: null, summary: '' }; });
let activeCardId = null;
let runningId = null;

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
      card.onclick = (e) => { if (e.target.closest('.card-btn')) return; selectCard(t.id); };
      const statusLabel = { idle: 'Ожидание', running: 'Выполняется...', passed: 'Пройден', failed: 'Ошибки' }[s.status] || s.status;
      card.innerHTML = '<div class="card-header"><span class="card-icon">' + t.icon + '</span><span class="card-name">' + t.name + '</span></div>'
        + '<div class="card-desc">' + t.desc + '</div>'
        + '<div class="card-footer"><div class="card-status"><span class="status-dot ' + s.status + '"></span><span>' + statusLabel + '</span></div>'
        + (isRunning
          ? '<button class="card-btn stop" onclick="stopTest()">\\u25a0 Стоп</button>'
          : '<button class="card-btn" onclick="runTest(\\'' + t.id + '\\')">\\u25b6 Запустить</button>')
        + '</div>'
        + (s.elapsed || s.summary ? '<div class="card-result">'
          + (s.summary ? '<span class="' + (s.status === 'passed' ? 'pass-count' : 'fail-count') + '">' + s.summary + '</span>' : '')
          + (s.elapsed ? '<span class="time">' + s.elapsed + 's</span>' : '')
          + '</div>' : '')
        + '<div class="progress-bar"><div class="progress-bar-inner"></div></div>';
      grid.appendChild(card);
    }
    area.appendChild(grid);
  }
}

function selectCard(id) { activeCardId = id; render(); showLog(id); }

function showLog(id) {
  const s = state[id] || {};
  const t = TESTS.find(x => x.id === id) || { icon: '\\u26a1', name: id };
  document.getElementById('logLabel').textContent = t.icon + ' ' + t.name;
  document.getElementById('logContent').innerHTML = ansiToHtml(s.log || 'Лог пуст. Нажмите \\u25b6 для запуска.');
  const el = document.getElementById('logContent');
  el.scrollTop = el.scrollHeight;
}

function escapeHtml(s) { return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

function ansiToHtml(text) {
  text = escapeHtml(text);
  const map = { '1':'ansi-bold','2':'ansi-dim','31':'ansi-red','32':'ansi-green','33':'ansi-yellow','34':'ansi-blue','35':'ansi-magenta','36':'ansi-cyan','37':'ansi-white','90':'ansi-gray','91':'ansi-red','92':'ansi-green','93':'ansi-yellow','94':'ansi-blue','95':'ansi-magenta','96':'ansi-cyan' };
  return text.replace(/\\x1b\\[(\\d+(?:;\\d+)*)m/g, function(_, codes) {
    if (codes === '0' || codes === '39') return '</span>';
    var classes = codes.split(';').map(function(c){return map[c]}).filter(Boolean).join(' ');
    return classes ? '<span class="' + classes + '">' : '';
  });
}

function runTest(id) {
  if (!state[id]) state[id] = { status: 'idle', log: '', elapsed: null, summary: '' };
  state[id] = { status: 'running', log: '', startedAt: Date.now(), elapsed: null, summary: '' };
  runningId = id; activeCardId = id;
  render(); showLog(id); updateGlobalStatus();
  fetch(PREFIX + '/run', { method: 'POST', body: JSON.stringify({ id }), headers: { 'Content-Type': 'application/json' } });
}

function stopTest() { fetch(PREFIX + '/stop', { method: 'POST' }); }

function runModule() {
  var mod = document.getElementById('moduleSelect').value;
  if (!mod) return;
  if (!state[mod]) state[mod] = { status: 'idle', log: '', elapsed: null, summary: '' };
  runTest(mod);
}

function clearLog() { document.getElementById('logContent').innerHTML = ''; if (activeCardId && state[activeCardId]) state[activeCardId].log = ''; }
function copyLog() { navigator.clipboard.writeText(document.getElementById('logContent').innerText); }

function updateGlobalStatus() {
  var el = document.getElementById('globalStatus');
  var statuses = Object.values(state).map(function(s){return s.status});
  if (statuses.includes('running')) { el.className = 'global-status running'; el.textContent = '\\u23f3 Тесты выполняются...'; }
  else if (statuses.includes('failed')) { var n = statuses.filter(function(s){return s==='failed'}).length; el.className = 'global-status failed'; el.textContent = '\\u2717 ' + n + ' с ошибками'; }
  else if (statuses.some(function(s){return s==='passed'})) { var n = statuses.filter(function(s){return s==='passed'}).length; el.className = 'global-status passed'; el.textContent = '\\u2713 ' + n + ' пройдено'; }
  else { el.className = 'global-status idle'; el.textContent = 'Готов к запуску'; }
}

function connectSSE() {
  var es = new EventSource(PREFIX + '/stream');
  es.addEventListener('init', function(e) {
    var data = JSON.parse(e.data);
    Object.assign(state, data.state || {});
    runningId = data.running;
    render(); updateGlobalStatus();
    if (activeCardId) showLog(activeCardId);
  });
  es.addEventListener('log', function(e) {
    var d = JSON.parse(e.data);
    if (state[d.id]) state[d.id].log += d.text;
    if (activeCardId === d.id) {
      var el = document.getElementById('logContent');
      el.innerHTML = ansiToHtml(state[d.id].log);
      el.scrollTop = el.scrollHeight;
    }
  });
  es.addEventListener('status', function(e) {
    var d = JSON.parse(e.data);
    if (state[d.id]) { state[d.id].status = d.status; if (d.elapsed != null) state[d.id].elapsed = d.elapsed; if (d.summary != null) state[d.id].summary = d.summary; }
    if (d.status !== 'running') runningId = null;
    render(); updateGlobalStatus();
    if (activeCardId === d.id) showLog(d.id);
  });
  es.onerror = function() { es.close(); setTimeout(connectSSE, 2000); };
}

var sel = document.getElementById('moduleSelect');
MODULES.forEach(function(m) { var o = document.createElement('option'); o.value = m; o.textContent = m; sel.appendChild(o); });
render();
connectSSE();
</script>
</body>
</html>`;
}
