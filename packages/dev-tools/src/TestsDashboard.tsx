import React, { useState, useEffect, useCallback } from 'react'
import { ScrollView, Platform, Linking } from 'react-native'
import { YStack, Text, useTheme } from 'tamagui'
import { AppButton, FadeIn } from '@mvp/ui'
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

const ICONS: Record<string, LucideIcon> = {
  'flask-conical': FlaskConical, server: Server, database: Database,
  library: Library, languages: Languages, 'bar-chart-3': BarChart3,
  'file-check': FileCheck, 'table-2': Table2, camera: Camera,
  globe: Globe, puzzle: Puzzle, image: Image,
  'check-square': CheckSquare, 'shield-alert': ShieldAlert,
  container: Container, rocket: Rocket,
}

const ANSI: Record<string, string> = {
  '30': '#555', '31': '#f87171', '32': '#4ade80', '33': '#fbbf24',
  '34': '#60a5fa', '35': '#c084fc', '36': '#22d3ee', '37': '#e5e7eb',
  '90': '#9ca3af', '91': '#fca5a5', '92': '#86efac', '93': '#fde68a', '1': '',
}

function ansiToReact(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = []
  const re = /\x1b\[([0-9;]+)m/g
  let last = 0, color: string | null = null, bold = false, m: RegExpExecArray | null
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push(<span key={last} style={{ color: color || '#d1d5db', fontWeight: bold ? 700 : 400 }}>{text.slice(last, m.index)}</span>)
    for (const c of m[1].split(';')) { if (c === '0') { color = null; bold = false } else if (c === '1') bold = true; else if (ANSI[c]) color = ANSI[c] }
    last = m.index + m[0].length
  }
  if (last < text.length) parts.push(<span key={last} style={{ color: color || '#d1d5db', fontWeight: bold ? 700 : 400 }}>{text.slice(last)}</span>)
  return parts
}

interface St { status: TestStatus; elapsed: string | null; summary: string }

const CFG: Record<TestStatus, { color: string; bg: string; Icon: React.FC<any>; label: string }> = {
  idle:    { color: '#6b7280', bg: 'transparent', Icon: Circle,       label: 'Ready' },
  running: { color: '#f59e0b', bg: '#f59e0b12',  Icon: Loader2,      label: 'Running' },
  passed:  { color: '#22c55e', bg: '#22c55e10',  Icon: CheckCircle2, label: 'Passed' },
  failed:  { color: '#ef4444', bg: '#ef444410',  Icon: XCircle,      label: 'Failed' },
}

const G_ICONS: Record<string, React.FC<any>> = {
  unit: FlaskConical, specialized: Wrench, e2e: Globe, quality: ShieldCheck,
}

interface Props { apiBase?: string }

export function TestsDashboard({ apiBase }: Props) {
  const devApi = `${apiBase ?? (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000')}/dev`
  const theme = useTheme()
  const [states, setStates] = useState<Record<string, St>>(() => {
    const r: Record<string, St> = {}; for (const t of TESTS) r[t.id] = { status: 'idle', elapsed: null, summary: '' }; return r
  })
  const [log, setLog] = useState('')
  const [activeId, setActiveId] = useState<string | null>(null)
  const [connected, setConnected] = useState(false)

  if (Platform.OS !== 'web') {
    return (
      <YStack flex={1} padding="$4" alignItems="center" justifyContent="center" gap="$4">
        <FlaskConical size={48} color="#888" />
        <Text fontSize="$4" color="$mutedText" textAlign="center">Тест-дашборд доступен только в браузере</Text>
        <AppButton onPress={() => Linking.openURL(`${devApi}/tests`)}>Открыть в браузере</AppButton>
      </YStack>
    )
  }

  useEffect(() => {
    const es = new EventSource(`${devApi}/tests/stream`)
    es.addEventListener('init', (e: any) => {
      try {
        const d = JSON.parse(e.data)
        if (d.state) { const ns: Record<string, St> = {}; for (const [id, s] of Object.entries(d.state) as any) ns[id] = { status: s.status, elapsed: s.elapsed, summary: s.summary }; setStates(p => ({ ...p, ...ns })) }
        setConnected(true)
      } catch {}
    })
    es.addEventListener('status', (e: any) => {
      try { const d = JSON.parse(e.data); setStates(p => ({ ...p, [d.id]: { status: d.status, elapsed: d.elapsed || p[d.id]?.elapsed, summary: d.summary || p[d.id]?.summary || '' } })) } catch {}
    })
    es.addEventListener('log', (e: any) => {
      try { const d = JSON.parse(e.data); setActiveId(d.id); setLog(p => p + d.text) } catch {}
    })
    es.onerror = () => setConnected(false)
    return () => es.close()
  }, [devApi])

  const run = useCallback((id: string) => {
    setLog(''); setActiveId(id)
    fetch(`${devApi}/tests/run`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) }).catch(() => {})
  }, [devApi])
  const stop = useCallback(() => { fetch(`${devApi}/tests/stop`, { method: 'POST' }).catch(() => {}) }, [devApi])
  const fetchLog = useCallback((id: string) => {
    fetch(`${devApi}/tests/log?id=${id}`).then(r => r.json()).then(d => { if (d.log) { setLog(d.log); setActiveId(id) } }).catch(() => {})
  }, [devApi])

  const passed = Object.values(states).filter(s => s.status === 'passed').length
  const failed = Object.values(states).filter(s => s.status === 'failed').length
  const running = Object.values(states).filter(s => s.status === 'running').length
  const activeTest = activeId ? TESTS.find(t => t.id === activeId) : null
  const accent = theme.accent?.val || '#8b5cf6'

  // @ts-ignore — web-only HTML
  return (
    <YStack flex={1}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        <FadeIn>
          {/* Status bar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              {[
                { n: passed, c: '#22c55e', I: CheckCircle2, l: 'passed' },
                { n: failed, c: '#ef4444', I: XCircle, l: 'failed' },
                { n: running, c: '#f59e0b', I: Loader2, l: 'running' },
              ].filter(s => s.n > 0).map(s => (
                <div key={s.l} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 20, background: `${s.c}10`, fontSize: 12, fontWeight: 600, color: s.c }}>
                  <s.I size={13} />{s.n} {s.l}
                </div>
              ))}
              <span style={{ fontSize: 12, color: '#6b7280' }}>{TESTS.length} total</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: connected ? '#22c55e' : '#ef4444', boxShadow: connected ? '0 0 6px #22c55e80' : '0 0 6px #ef444480' }} />
              <span style={{ fontSize: 11, color: '#6b7280' }}>{connected ? 'Connected' : 'Disconnected'}</span>
            </div>
          </div>
        </FadeIn>

        {!connected && (
          <FadeIn>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 10, background: '#ef444408', border: '1px solid #ef444420', marginBottom: 20, fontSize: 12, color: '#f87171' }}>
              <CloudOff size={15} />No connection. Run: npm run dev:backend
            </div>
          </FadeIn>
        )}

        {GROUPS.map(group => {
          const tests = TESTS.filter(t => t.group === group)
          const GI = G_ICONS[group] || FlaskConical
          return (
            <FadeIn key={group}>
              <div style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <GI size={14} color="#6b7280" />
                  <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.2, color: '#6b7280' }}>{GROUP_LABELS[group]}</span>
                  <div style={{ flex: 1, height: 1, background: '#ffffff08' }} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 8 }}>
                  {tests.map(test => {
                    const st = states[test.id] || { status: 'idle' as TestStatus, elapsed: null, summary: '' }
                    const cfg = CFG[st.status]
                    const SI = cfg.Icon
                    const TI = ICONS[test.lucideIcon] || FlaskConical
                    const isRun = st.status === 'running'
                    const isAct = activeId === test.id

                    return (
                      <div
                        key={test.id}
                        onClick={() => isRun ? stop() : run(test.id)}
                        style={{
                          padding: '12px 14px',
                          borderRadius: 10,
                          border: `1px solid ${isAct ? accent : '#ffffff0a'}`,
                          background: isAct ? '#ffffff06' : '#ffffff02',
                          cursor: 'pointer',
                          transition: 'all 0.12s ease',
                          position: 'relative',
                          overflow: 'hidden',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 8,
                        }}
                        onMouseEnter={(e: any) => { e.currentTarget.style.background = '#ffffff08'; e.currentTarget.style.borderColor = isAct ? accent : '#ffffff15' }}
                        onMouseLeave={(e: any) => { e.currentTarget.style.background = isAct ? '#ffffff06' : '#ffffff02'; e.currentTarget.style.borderColor = isAct ? accent : '#ffffff0a' }}
                      >
                        {/* Status accent line */}
                        {st.status !== 'idle' && (
                          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, backgroundColor: cfg.color, opacity: 0.7 }} />
                        )}

                        {/* Row 1: icon + name + status */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <TI size={16} color="#6b7280" style={{ flexShrink: 0 }} />
                          <span style={{ fontSize: 13, fontWeight: 600, color: '#e5e7eb', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {test.name}
                          </span>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 12, background: cfg.bg, flexShrink: 0 }}>
                            <SI size={11} color={cfg.color} style={isRun ? { animation: 'spin 1s linear infinite' } : undefined} />
                            <span style={{ fontSize: 10, fontWeight: 600, color: cfg.color }}>{cfg.label}</span>
                          </div>
                        </div>

                        {/* Row 2: description */}
                        <span style={{ fontSize: 11, color: '#6b7280', lineHeight: '16px' }}>{test.desc}</span>

                        {/* Row 3: cmd */}
                        <span style={{ fontSize: 10, fontFamily: 'JetBrains Mono, SF Mono, monospace', color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          $ {test.cmd}
                        </span>

                        {/* Row 4: bottom — action + results */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 }}>
                          <div
                            style={{
                              display: 'inline-flex', alignItems: 'center', gap: 4,
                              padding: '4px 10px', borderRadius: 6,
                              background: isRun ? '#f59e0b18' : accent,
                              fontSize: 11, fontWeight: 600,
                              color: isRun ? '#f59e0b' : 'white',
                            }}
                          >
                            {isRun ? <Square size={10} /> : <Play size={10} fill="white" />}
                            {isRun ? 'Stop' : 'Run'}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            {st.summary && (
                              <span style={{ fontSize: 11, fontWeight: 500, color: st.status === 'passed' ? '#22c55e' : st.status === 'failed' ? '#ef4444' : '#6b7280' }}>
                                {st.summary}
                              </span>
                            )}
                            {st.elapsed && (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 10, color: '#4b5563' }}>
                                <Clock size={10} />{st.elapsed}s
                              </span>
                            )}
                          </div>
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
        {activeId && (
          <FadeIn>
            <div style={{ marginTop: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, padding: '0 4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Terminal size={14} color="#6b7280" />
                  <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: '#6b7280' }}>Output</span>
                  {activeTest && <span style={{ fontSize: 11, color: '#9ca3af', padding: '2px 8px', background: '#ffffff06', borderRadius: 4 }}>{activeTest.name}</span>}
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                  <span onClick={() => fetchLog(activeId)} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#6b7280', cursor: 'pointer' }}
                    onMouseEnter={(e: any) => { e.currentTarget.style.color = '#9ca3af' }}
                    onMouseLeave={(e: any) => { e.currentTarget.style.color = '#6b7280' }}>
                    <RefreshCw size={11} />Refresh
                  </span>
                  <span onClick={() => { setLog(''); setActiveId(null) }} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#6b7280', cursor: 'pointer' }}
                    onMouseEnter={(e: any) => { e.currentTarget.style.color = '#9ca3af' }}
                    onMouseLeave={(e: any) => { e.currentTarget.style.color = '#6b7280' }}>
                    <X size={13} />Close
                  </span>
                </div>
              </div>
              <div style={{ borderRadius: 10, border: '1px solid #ffffff08', background: 'linear-gradient(180deg, #0d1117, #161b22)', maxHeight: 450, overflow: 'hidden' }}>
                <div style={{ maxHeight: 450, overflow: 'auto', padding: 16 }}>
                  <pre style={{ margin: 0, fontFamily: 'JetBrains Mono, SF Mono, Menlo, Consolas, monospace', fontSize: 12, lineHeight: 1.7, whiteSpace: 'pre-wrap', wordBreak: 'break-all', color: '#d1d5db' }}>
                    {log ? ansiToReact(log) : <span style={{ color: '#4b5563', fontStyle: 'italic' }}>Waiting for output...</span>}
                  </pre>
                </div>
              </div>
            </div>
          </FadeIn>
        )}
      </ScrollView>
      <style dangerouslySetInnerHTML={{ __html: '@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}' }} />
    </YStack>
  )
}
