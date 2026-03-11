import React, { useState, useEffect, useRef, useCallback } from 'react'
import { ScrollView, Platform, Linking } from 'react-native'
import { YStack, XStack, Text, useTheme } from 'tamagui'
import { AppButton, FadeIn, ScalePress } from '@mvp/ui'
import {
  CheckCircle2, XCircle, Circle, Loader2, Play, Square, Clock,
  FlaskConical, Wrench, Globe, ShieldCheck,
  Terminal, RefreshCw, X, CloudOff,
  Server, Database, Library, Languages,
  BarChart3, FileCheck, Table2, Camera,
  Puzzle, Image, CheckSquare, ShieldAlert,
  Container, Rocket,
  type LucideIcon,
} from 'lucide-react'
import { TESTS, GROUP_LABELS, GROUPS, type TestStatus } from './tests'

// --- Lucide icon map ---------------------------------------------------------------

const LUCIDE_ICONS: Record<string, LucideIcon> = {
  'flask-conical': FlaskConical, server: Server, database: Database,
  library: Library, languages: Languages, 'bar-chart-3': BarChart3,
  'file-check': FileCheck, 'table-2': Table2, camera: Camera,
  globe: Globe, puzzle: Puzzle, image: Image,
  'check-square': CheckSquare, 'shield-alert': ShieldAlert,
  container: Container, rocket: Rocket,
}

// --- ANSI color conversion ---------------------------------------------------------

const ANSI_COLORS: Record<string, string> = {
  '30': '#555', '31': '#f87171', '32': '#4ade80', '33': '#fbbf24',
  '34': '#60a5fa', '35': '#c084fc', '36': '#22d3ee', '37': '#e5e7eb',
  '90': '#9ca3af', '91': '#fca5a5', '92': '#86efac', '93': '#fde68a',
  '1': '',
}

function ansiToReactNodes(text: string): React.ReactNode[] {
  if (Platform.OS !== 'web') return [text]
  const parts: React.ReactNode[] = []
  const regex = /\x1b\[([0-9;]+)m/g
  let lastIndex = 0
  let currentColor: string | null = null
  let bold = false
  let match: RegExpExecArray | null
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      const chunk = text.slice(lastIndex, match.index)
      parts.push(<span key={lastIndex} style={{ color: currentColor || '#d1d5db', fontWeight: bold ? 700 : 400 }}>{chunk}</span>)
    }
    const codes = match[1].split(';')
    for (const code of codes) {
      if (code === '0') { currentColor = null; bold = false }
      else if (code === '1') bold = true
      else if (ANSI_COLORS[code]) currentColor = ANSI_COLORS[code]
    }
    lastIndex = match.index + match[0].length
  }
  if (lastIndex < text.length) {
    parts.push(<span key={lastIndex} style={{ color: currentColor || '#d1d5db', fontWeight: bold ? 700 : 400 }}>{text.slice(lastIndex)}</span>)
  }
  return parts
}

// --- Helpers -----------------------------------------------------------------------

interface CardTestState {
  status: TestStatus
  elapsed: string | null
  summary: string
}

const STATUS_CFG: Record<TestStatus, { color: string; bg: string; Icon: React.FC<any>; label: string }> = {
  idle:    { color: '#6b7280', bg: 'transparent',  Icon: Circle,       label: 'Ready' },
  running: { color: '#f59e0b', bg: '#f59e0b12',    Icon: Loader2,      label: 'Running' },
  passed:  { color: '#22c55e', bg: '#22c55e10',    Icon: CheckCircle2, label: 'Passed' },
  failed:  { color: '#ef4444', bg: '#ef444410',    Icon: XCircle,      label: 'Failed' },
}

const GROUP_ICONS: Record<string, React.FC<any>> = {
  unit: FlaskConical, specialized: Wrench, e2e: Globe, quality: ShieldCheck,
}

// --- Component ---------------------------------------------------------------------

interface Props { apiBase?: string }

export function TestsDashboard({ apiBase }: Props) {
  const devApi = `${apiBase ?? (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000')}/dev`
  const theme = useTheme()
  const [states, setStates] = useState<Record<string, CardTestState>>(() => {
    const init: Record<string, CardTestState> = {}
    for (const t of TESTS) init[t.id] = { status: 'idle', elapsed: null, summary: '' }
    return init
  })
  const [runningId, setRunningId] = useState<string | null>(null)
  const [log, setLog] = useState('')
  const [activeLogId, setActiveLogId] = useState<string | null>(null)
  const [connected, setConnected] = useState(false)

  // Native fallback
  if (Platform.OS !== 'web') {
    return (
      <YStack flex={1} padding="$4" alignItems="center" justifyContent="center" gap="$4">
        <FlaskConical size={48} color="#888" />
        <Text fontSize="$4" color="$mutedText" textAlign="center">Тест-дашборд доступен только в браузере</Text>
        <AppButton onPress={() => Linking.openURL(`${devApi}/tests`)}>Открыть в браузере</AppButton>
      </YStack>
    )
  }

  // SSE
  useEffect(() => {
    const es = new EventSource(`${devApi}/tests/stream`)
    es.addEventListener('init', (e: any) => {
      try {
        const d = JSON.parse(e.data)
        if (d.running) setRunningId(d.running)
        if (d.state) {
          const ns: Record<string, CardTestState> = {}
          for (const [id, s] of Object.entries(d.state) as [string, any][])
            ns[id] = { status: s.status, elapsed: s.elapsed, summary: s.summary }
          setStates(p => ({ ...p, ...ns }))
        }
        setConnected(true)
      } catch { /* */ }
    })
    es.addEventListener('status', (e: any) => {
      try {
        const d = JSON.parse(e.data)
        setStates(p => ({ ...p, [d.id]: { status: d.status, elapsed: d.elapsed || p[d.id]?.elapsed || null, summary: d.summary || p[d.id]?.summary || '' } }))
        if (d.status === 'running') setRunningId(d.id)
        else setRunningId(p => p === d.id ? null : p)
      } catch { /* */ }
    })
    es.addEventListener('log', (e: any) => {
      try { const d = JSON.parse(e.data); setActiveLogId(d.id); setLog(p => p + d.text) } catch { /* */ }
    })
    es.onerror = () => setConnected(false)
    return () => { es.close() }
  }, [devApi])

  const runTest = useCallback((id: string) => {
    setLog(''); setActiveLogId(id)
    fetch(`${devApi}/tests/run`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) }).catch(() => {})
  }, [devApi])
  const stopTest = useCallback(() => { fetch(`${devApi}/tests/stop`, { method: 'POST' }).catch(() => {}) }, [devApi])
  const fetchLog = useCallback((id: string) => {
    fetch(`${devApi}/tests/log?id=${id}`).then(r => r.json()).then(d => { if (d.log) { setLog(d.log); setActiveLogId(id) } }).catch(() => {})
  }, [devApi])

  const passedCount = Object.values(states).filter(s => s.status === 'passed').length
  const failedCount = Object.values(states).filter(s => s.status === 'failed').length
  const runningCount = Object.values(states).filter(s => s.status === 'running').length
  const activeTest = activeLogId ? TESTS.find(t => t.id === activeLogId) : null

  return (
    <YStack flex={1}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>

        {/* Status bar */}
        <FadeIn>
          {/* @ts-ignore */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 20 }}>
            {/* @ts-ignore */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              {[
                { count: passedCount, color: '#22c55e', Icon: CheckCircle2, label: 'passed' },
                { count: failedCount, color: '#ef4444', Icon: XCircle, label: 'failed' },
                { count: runningCount, color: '#f59e0b', Icon: Loader2, label: 'running' },
              ].filter(s => s.count > 0).map(s => (
                // @ts-ignore
                <div key={s.label} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 20, background: `${s.color}10`, fontSize: 12, fontWeight: 600, color: s.color }}>
                  <s.Icon size={13} color={s.color} />
                  {s.count} {s.label}
                </div>
              ))}
              {/* @ts-ignore */}
              <span style={{ fontSize: 12, color: '#6b7280' }}>{TESTS.length} tests total</span>
            </div>
            {/* @ts-ignore */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {/* @ts-ignore */}
              <div style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: connected ? '#22c55e' : '#ef4444', boxShadow: connected ? '0 0 6px #22c55e80' : '0 0 6px #ef444480' }} />
              {/* @ts-ignore */}
              <span style={{ fontSize: 11, color: '#6b7280' }}>{connected ? 'Connected' : 'Disconnected'}</span>
            </div>
          </div>
        </FadeIn>

        {/* Disconnected */}
        {!connected && (
          <FadeIn>
            {/* @ts-ignore */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 10, background: '#ef444408', border: '1px solid #ef444420', marginBottom: 20, fontSize: 12, color: '#f87171' }}>
              <CloudOff size={15} color="#ef4444" />
              No connection to server. Run: npm run dev:backend
            </div>
          </FadeIn>
        )}

        {/* Test groups */}
        {GROUPS.map(group => {
          const groupTests = TESTS.filter(t => t.group === group)
          const GroupIcon = GROUP_ICONS[group] || FlaskConical
          return (
            <FadeIn key={group}>
              {/* @ts-ignore */}
              <div style={{ marginBottom: 28 }}>
                {/* Group header */}
                {/* @ts-ignore */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <GroupIcon size={14} color="#6b7280" />
                  {/* @ts-ignore */}
                  <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.2, color: '#6b7280' }}>{GROUP_LABELS[group]}</span>
                  {/* @ts-ignore */}
                  <div style={{ flex: 1, height: 1, background: '#ffffff08' }} />
                </div>

                {/* Test rows */}
                {/* @ts-ignore */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {groupTests.map(test => {
                    const st = states[test.id] || { status: 'idle' as TestStatus, elapsed: null, summary: '' }
                    const cfg = STATUS_CFG[st.status]
                    const StatusIcon = cfg.Icon
                    const TestIcon = LUCIDE_ICONS[test.lucideIcon] || FlaskConical
                    const isRunning = st.status === 'running'
                    const isActive = activeLogId === test.id

                    return (
                      // @ts-ignore
                      <div
                        key={test.id}
                        onClick={() => isRunning ? stopTest() : runTest(test.id)}
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '28px 1fr auto auto auto',
                          alignItems: 'center',
                          gap: 12,
                          padding: '10px 14px',
                          borderRadius: 10,
                          border: `1px solid ${isActive ? (theme.accent?.val || '#8b5cf6') : 'transparent'}`,
                          background: isActive ? '#ffffff06' : 'transparent',
                          cursor: 'pointer',
                          transition: 'all 0.12s ease',
                        }}
                        onMouseEnter={(e: any) => { if (!isActive) e.currentTarget.style.background = '#ffffff04' }}
                        onMouseLeave={(e: any) => { if (!isActive) e.currentTarget.style.background = 'transparent' }}
                      >
                        {/* Icon */}
                        <TestIcon size={18} color="#6b7280" />

                        {/* Name + desc + cmd */}
                        {/* @ts-ignore */}
                        <div style={{ minWidth: 0 }}>
                          {/* @ts-ignore */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            {/* @ts-ignore */}
                            <span style={{ fontSize: 13, fontWeight: 600, color: '#e5e7eb', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {test.name}
                            </span>
                            {/* @ts-ignore */}
                            <span style={{ fontSize: 11, color: '#4b5563', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {test.desc}
                            </span>
                          </div>
                          {/* @ts-ignore */}
                          <div style={{ fontSize: 10, fontFamily: 'JetBrains Mono, SF Mono, monospace', color: '#374151', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {test.cmd}
                          </div>
                        </div>

                        {/* Result summary */}
                        {/* @ts-ignore */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 80, justifyContent: 'flex-end' }}>
                          {st.summary && (
                            // @ts-ignore
                            <span style={{ fontSize: 11, fontWeight: 500, color: st.status === 'passed' ? '#22c55e' : st.status === 'failed' ? '#ef4444' : '#6b7280' }}>
                              {st.summary}
                            </span>
                          )}
                          {st.elapsed && (
                            // @ts-ignore
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 11, color: '#4b5563' }}>
                              <Clock size={10} color="#4b5563" />
                              {st.elapsed}s
                            </span>
                          )}
                        </div>

                        {/* Status badge */}
                        {/* @ts-ignore */}
                        <div style={{
                          display: 'inline-flex', alignItems: 'center', gap: 5,
                          padding: '3px 10px', borderRadius: 20,
                          background: cfg.bg, fontSize: 11, fontWeight: 600, color: cfg.color,
                          minWidth: 75, justifyContent: 'center',
                        }}>
                          <StatusIcon
                            size={12}
                            color={cfg.color}
                            style={isRunning ? { animation: 'spin 1s linear infinite' } : undefined}
                          />
                          {cfg.label}
                        </div>

                        {/* Action button */}
                        {/* @ts-ignore */}
                        <div style={{
                          display: 'inline-flex', alignItems: 'center', gap: 4,
                          padding: '5px 12px', borderRadius: 6,
                          background: isRunning ? '#f59e0b18' : (theme.accent?.val || '#8b5cf6'),
                          fontSize: 11, fontWeight: 600,
                          color: isRunning ? '#f59e0b' : 'white',
                          cursor: 'pointer', transition: 'opacity 0.12s',
                          whiteSpace: 'nowrap',
                        }}
                        onMouseEnter={(e: any) => { e.currentTarget.style.opacity = '0.8' }}
                        onMouseLeave={(e: any) => { e.currentTarget.style.opacity = '1' }}
                        >
                          {isRunning ? <Square size={10} /> : <Play size={10} fill="white" />}
                          {isRunning ? 'Stop' : 'Run'}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </FadeIn>
          )
        })}

        {/* Log panel */}
        {activeLogId && (
          <FadeIn>
            {/* @ts-ignore */}
            <div style={{ marginTop: 8 }}>
              {/* Log header */}
              {/* @ts-ignore */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, padding: '0 4px' }}>
                {/* @ts-ignore */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Terminal size={14} color="#6b7280" />
                  {/* @ts-ignore */}
                  <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: '#6b7280' }}>Output</span>
                  {activeTest && (
                    // @ts-ignore
                    <span style={{ fontSize: 11, color: '#9ca3af', padding: '2px 8px', background: '#ffffff06', borderRadius: 4 }}>
                      {activeTest.name}
                    </span>
                  )}
                </div>
                {/* @ts-ignore */}
                <div style={{ display: 'flex', gap: 12 }}>
                  {/* @ts-ignore */}
                  <span onClick={() => fetchLog(activeLogId)} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#6b7280', cursor: 'pointer' }}
                    onMouseEnter={(e: any) => { e.currentTarget.style.color = '#9ca3af' }}
                    onMouseLeave={(e: any) => { e.currentTarget.style.color = '#6b7280' }}
                  >
                    <RefreshCw size={11} />Refresh
                  </span>
                  {/* @ts-ignore */}
                  <span onClick={() => { setLog(''); setActiveLogId(null) }} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#6b7280', cursor: 'pointer' }}
                    onMouseEnter={(e: any) => { e.currentTarget.style.color = '#9ca3af' }}
                    onMouseLeave={(e: any) => { e.currentTarget.style.color = '#6b7280' }}
                  >
                    <X size={13} />Close
                  </span>
                </div>
              </div>

              {/* Log body */}
              {/* @ts-ignore */}
              <div style={{
                borderRadius: 10, border: '1px solid #ffffff08',
                background: 'linear-gradient(180deg, #0d1117, #161b22)',
                maxHeight: 450, overflow: 'hidden',
              }}>
                {/* @ts-ignore */}
                <div style={{ maxHeight: 450, overflow: 'auto', padding: 16 }}>
                  {/* @ts-ignore */}
                  <pre style={{
                    margin: 0, fontFamily: 'JetBrains Mono, SF Mono, Menlo, Consolas, monospace',
                    fontSize: 12, lineHeight: 1.7, whiteSpace: 'pre-wrap', wordBreak: 'break-all', color: '#d1d5db',
                  }}>
                    {log ? ansiToReactNodes(log) : <span style={{ color: '#4b5563', fontStyle: 'italic' }}>Waiting for output...</span>}
                  </pre>
                </div>
              </div>
            </div>
          </FadeIn>
        )}
      </ScrollView>
      {/* @ts-ignore */}
      <style dangerouslySetInnerHTML={{ __html: '@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}' }} />
    </YStack>
  )
}
