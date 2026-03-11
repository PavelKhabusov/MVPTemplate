import React, { useState, useEffect, useCallback, useRef } from 'react'
import { ScrollView, Platform, Pressable, useWindowDimensions, PanResponder } from 'react-native'
import { YStack, XStack, Text, useTheme } from 'tamagui'
import { FadeIn } from '@mvp/ui'
import {
  CheckCircle2, XCircle, Circle, Loader2, Play, Square, Clock,
  FlaskConical, Wrench, Globe, ShieldCheck,
  Terminal, RefreshCw, X, CloudOff, GripHorizontal,
  Server, Database, Library, Languages,
  BarChart3, FileCheck, Table2, Camera,
  Puzzle, Image, CheckSquare, ShieldAlert,
  Container, Rocket, ChevronDown, ChevronUp, Trash2,
  type LucideIcon,
} from 'lucide-react-native'
import { TESTS, GROUP_LABELS, GROUPS, type TestStatus } from './tests'

const ICONS: Record<string, LucideIcon> = {
  'flask-conical': FlaskConical, server: Server, database: Database,
  library: Library, languages: Languages, 'bar-chart-3': BarChart3,
  'file-check': FileCheck, 'table-2': Table2, camera: Camera,
  globe: Globe, puzzle: Puzzle, image: Image,
  'check-square': CheckSquare, 'shield-alert': ShieldAlert,
  container: Container, rocket: Rocket,
}

// ─── ANSI → colored Text segments ────────────────────────────────────────────

const ANSI_COLORS: Record<string, string> = {
  '30': '#555555', '31': '#f87171', '32': '#4ade80', '33': '#fbbf24',
  '34': '#60a5fa', '35': '#c084fc', '36': '#22d3ee', '37': '#e5e7eb',
  '90': '#9ca3af', '91': '#fca5a5', '92': '#86efac', '93': '#fde68a',
  '94': '#93c5fd', '95': '#d8b4fe', '96': '#67e8f9', '97': '#f9fafb',
}

interface AnsiSegment { text: string; color: string; bold: boolean; dim: boolean }

function parseAnsi(raw: string): AnsiSegment[] {
  const segments: AnsiSegment[] = []
  const re = /\x1b\[([0-9;]*)m/g
  let last = 0, color = '#d1d5db', bold = false, dim = false
  let m: RegExpExecArray | null
  while ((m = re.exec(raw)) !== null) {
    if (m.index > last) {
      segments.push({ text: raw.slice(last, m.index), color, bold, dim })
    }
    for (const code of m[1].split(';')) {
      if (code === '0' || code === '') { color = '#d1d5db'; bold = false; dim = false }
      else if (code === '1') bold = true
      else if (code === '2') dim = true
      else if (code === '22') { bold = false; dim = false }
      else if (ANSI_COLORS[code]) color = ANSI_COLORS[code]
      else if (code === '39') color = '#d1d5db' // default fg
    }
    last = m.index + m[0].length
  }
  if (last < raw.length) segments.push({ text: raw.slice(last), color, bold, dim })
  return segments
}

function AnsiText({ text, monoFamily }: { text: string; monoFamily: string }) {
  const segments = React.useMemo(() => parseAnsi(text), [text])
  return (
    <Text
      fontFamily={monoFamily}
      fontSize={12} lineHeight={20} color="#d1d5db"
      // @ts-ignore web-only
      style={Platform.OS === 'web' ? { whiteSpace: 'pre-wrap', wordBreak: 'break-all' } : undefined}
    >
      {segments.map((seg, i) => (
        <Text
          key={i}
          color={seg.dim ? '#4b5563' : seg.color}
          fontWeight={seg.bold ? '700' : '400'}
          fontFamily={monoFamily}
          fontSize={12}
          lineHeight={20}
          opacity={seg.dim ? 0.7 : 1}
        >
          {seg.text}
        </Text>
      ))}
    </Text>
  )
}

interface St { status: TestStatus; elapsed: string | null; summary: string }

const STATUS_CFG: Record<TestStatus, { color: string; bg: string; Icon: LucideIcon; label: string }> = {
  idle:    { color: '#6b7280', bg: 'transparent', Icon: Circle,       label: 'Ready' },
  running: { color: '#f59e0b', bg: '#f59e0b18',  Icon: Loader2,      label: 'Running' },
  passed:  { color: '#22c55e', bg: '#22c55e18',  Icon: CheckCircle2, label: 'Passed' },
  failed:  { color: '#ef4444', bg: '#ef444418',  Icon: XCircle,      label: 'Failed' },
}

const GROUP_ICONS: Record<string, LucideIcon> = {
  unit: FlaskConical, specialized: Wrench, e2e: Globe, quality: ShieldCheck,
}

const MIN_CONSOLE_H = 120
const MAX_CONSOLE_H = 600
const DEFAULT_CONSOLE_H = 250

// ─── Drag handle (web: mouse events, native: PanResponder) ──────────────────

function DragHandle({ onHeightChange }: { onHeightChange: (h: number) => void }) {
  const isWeb = Platform.OS === 'web'
  const heightRef = useRef(DEFAULT_CONSOLE_H)

  // Native: PanResponder
  const startHRef = useRef(DEFAULT_CONSOLE_H)
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => { startHRef.current = heightRef.current },
      onPanResponderMove: (_, gs) => {
        const next = Math.min(MAX_CONSOLE_H, Math.max(MIN_CONSOLE_H, startHRef.current - gs.dy))
        heightRef.current = next
        onHeightChange(next)
      },
    })
  ).current

  // Web: raw DOM mousedown → mousemove → mouseup
  const handleRef = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    if (!isWeb || !handleRef.current) return
    const el = handleRef.current
    const onMouseDown = (e: MouseEvent) => {
      e.preventDefault()
      const startY = e.clientY
      const startH = heightRef.current
      const onMove = (ev: MouseEvent) => {
        const next = Math.min(MAX_CONSOLE_H, Math.max(MIN_CONSOLE_H, startH + (startY - ev.clientY)))
        heightRef.current = next
        onHeightChange(next)
      }
      const onUp = () => {
        document.removeEventListener('mousemove', onMove)
        document.removeEventListener('mouseup', onUp)
      }
      document.addEventListener('mousemove', onMove)
      document.addEventListener('mouseup', onUp)
    }
    el.addEventListener('mousedown', onMouseDown)
    return () => el.removeEventListener('mousedown', onMouseDown)
  }, [isWeb, onHeightChange])

  if (isWeb) {
    return (
      <div
        ref={handleRef as any}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          height: 20, cursor: 'row-resize', userSelect: 'none',
        }}
      >
        <GripHorizontal size={16} color="#4b5563" />
      </div>
    )
  }

  return (
    <YStack
      alignItems="center" justifyContent="center" height={20}
      {...panResponder.panHandlers}
    >
      <GripHorizontal size={16} color="#4b5563" />
    </YStack>
  )
}

interface Props { apiBase?: string }

export function TestsDashboard({ apiBase }: Props) {
  const devApi = `${apiBase ?? (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000')}/dev`
  const theme = useTheme()
  const { width: screenWidth } = useWindowDimensions()
  const isNarrow = screenWidth < 500
  const [states, setStates] = useState<Record<string, St>>(() => {
    const r: Record<string, St> = {}; for (const t of TESTS) r[t.id] = { status: 'idle', elapsed: null, summary: '' }; return r
  })
  const [log, setLog] = useState('')
  const [activeId, setActiveId] = useState<string | null>(null)
  const [connected, setConnected] = useState(false)
  const [consoleHeight, setConsoleHeight] = useState(DEFAULT_CONSOLE_H)
  const [consoleCollapsed, setConsoleCollapsed] = useState(false)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const logScrollRef = useRef<ScrollView>(null)
  const isWeb = Platform.OS === 'web'
  const accent = theme.accent?.val || '#8b5cf6'
  const monoFamily = isWeb ? 'JetBrains Mono, SF Mono, Menlo, Consolas, monospace' : '$mono'

  // Auto-scroll log to bottom
  const prevLogLen = useRef(0)
  useEffect(() => {
    if (log.length > prevLogLen.current) {
      logScrollRef.current?.scrollToEnd({ animated: false })
    }
    prevLogLen.current = log.length
  }, [log])

  // SSE on web, polling on native
  useEffect(() => {
    if (isWeb && typeof EventSource !== 'undefined') {
      const es = new EventSource(`${devApi}/tests/stream`)
      es.addEventListener('init', (e: any) => {
        try {
          const d = JSON.parse(e.data)
          if (d.state) {
            const ns: Record<string, St> = {}
            for (const [id, s] of Object.entries(d.state) as [string, any][])
              ns[id] = { status: s.status, elapsed: s.elapsed, summary: s.summary }
            setStates(p => ({ ...p, ...ns }))
          }
          setConnected(true)
        } catch { /* ignore */ }
      })
      es.addEventListener('status', (e: any) => {
        try {
          const d = JSON.parse(e.data)
          setStates(p => ({ ...p, [d.id]: { status: d.status, elapsed: d.elapsed || p[d.id]?.elapsed, summary: d.summary || p[d.id]?.summary || '' } }))
        } catch { /* ignore */ }
      })
      es.addEventListener('log', (e: any) => {
        try { const d = JSON.parse(e.data); setActiveId(d.id); setLog(p => p + d.text) } catch { /* ignore */ }
      })
      es.onerror = () => setConnected(false)
      return () => es.close()
    } else {
      // Polling fallback for native (no EventSource)
      const poll = async () => {
        try {
          const res = await fetch(`${devApi}/tests/state`)
          if (res.ok) {
            const d = await res.json()
            if (d.state) {
              const ns: Record<string, St> = {}
              for (const [id, s] of Object.entries(d.state) as [string, any][])
                ns[id] = { status: s.status, elapsed: s.elapsed, summary: s.summary }
              setStates(p => ({ ...p, ...ns }))
            }
            setConnected(true)
          } else {
            setConnected(false)
          }
        } catch {
          setConnected(false)
        }
      }
      poll()
      pollRef.current = setInterval(poll, 2000)
      return () => { if (pollRef.current) clearInterval(pollRef.current) }
    }
  }, [devApi, isWeb])

  const run = useCallback((id: string) => {
    setLog(''); setActiveId(id); setConsoleCollapsed(false)
    fetch(`${devApi}/tests/run`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) }).catch(() => {})
  }, [devApi])

  const stop = useCallback(() => {
    fetch(`${devApi}/tests/stop`, { method: 'POST' }).catch(() => {})
  }, [devApi])

  const fetchLog = useCallback((id: string) => {
    fetch(`${devApi}/tests/log?id=${id}`)
      .then(r => r.json())
      .then(d => { if (d.log) { setLog(d.log); setActiveId(id) } })
      .catch(() => {})
  }, [devApi])

  // On native, poll for active test log
  useEffect(() => {
    if (isWeb || !activeId) return
    const id = setInterval(() => {
      const st = states[activeId]
      if (st?.status === 'running') fetchLog(activeId)
    }, 2000)
    return () => clearInterval(id)
  }, [isWeb, activeId, states, fetchLog])

  const handleHeightChange = useCallback((h: number) => {
    setConsoleHeight(h)
  }, [])

  const passed = Object.values(states).filter(s => s.status === 'passed').length
  const failed = Object.values(states).filter(s => s.status === 'failed').length
  const running = Object.values(states).filter(s => s.status === 'running').length
  const activeTest = activeId ? TESTS.find(t => t.id === activeId) : null

  const cardWidth = isNarrow ? '100%' : 260
  const consoleOpen = activeId !== null
  const consoleBarH = 36
  const effectiveConsoleH = consoleOpen ? (consoleCollapsed ? consoleBarH : consoleBarH + 20 + consoleHeight) : 0

  return (
    <YStack flex={1}>
      {/* Scrollable test cards area */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20, paddingBottom: effectiveConsoleH + 20 }}
      >
        <FadeIn>
          {/* Status bar */}
          <XStack alignItems="center" justifyContent="space-between" flexWrap="wrap" gap="$2" marginBottom="$4">
            <XStack alignItems="center" gap="$2" flexWrap="wrap">
              {passed > 0 && (
                <XStack alignItems="center" gap={5} paddingHorizontal={10} paddingVertical={4} borderRadius={20} backgroundColor="#22c55e18">
                  <CheckCircle2 size={13} color="#22c55e" />
                  <Text fontSize={12} fontWeight="600" color="#22c55e">{passed} passed</Text>
                </XStack>
              )}
              {failed > 0 && (
                <XStack alignItems="center" gap={5} paddingHorizontal={10} paddingVertical={4} borderRadius={20} backgroundColor="#ef444418">
                  <XCircle size={13} color="#ef4444" />
                  <Text fontSize={12} fontWeight="600" color="#ef4444">{failed} failed</Text>
                </XStack>
              )}
              {running > 0 && (
                <XStack alignItems="center" gap={5} paddingHorizontal={10} paddingVertical={4} borderRadius={20} backgroundColor="#f59e0b18">
                  <Loader2 size={13} color="#f59e0b" />
                  <Text fontSize={12} fontWeight="600" color="#f59e0b">{running} running</Text>
                </XStack>
              )}
              <Text fontSize={12} color="$mutedText">{TESTS.length} total</Text>
            </XStack>
            <XStack alignItems="center" gap={6}>
              <YStack width={7} height={7} borderRadius={4} backgroundColor={connected ? '#22c55e' : '#ef4444'} />
              <Text fontSize={11} color="$mutedText">{connected ? 'Connected' : 'Disconnected'}</Text>
            </XStack>
          </XStack>
        </FadeIn>

        {!connected && (
          <FadeIn>
            <XStack
              alignItems="center" gap="$2" padding="$3" borderRadius={10}
              backgroundColor="#ef444410" borderWidth={1} borderColor="#ef444430"
              marginBottom="$4"
            >
              <CloudOff size={15} color="#f87171" />
              <Text fontSize={12} color="#f87171">No connection. Run: npm run dev:backend</Text>
            </XStack>
          </FadeIn>
        )}

        {GROUPS.map(group => {
          const tests = TESTS.filter(t => t.group === group)
          const GIcon = GROUP_ICONS[group] || FlaskConical
          return (
            <FadeIn key={group}>
              <YStack marginBottom="$5">
                <XStack alignItems="center" gap="$2" marginBottom="$2.5">
                  <GIcon size={14} color="#6b7280" />
                  <Text fontSize={11} fontWeight="700" textTransform="uppercase" letterSpacing={1.2} color="$mutedText">
                    {GROUP_LABELS[group]}
                  </Text>
                  <YStack flex={1} height={1} backgroundColor="$borderColor" opacity={0.3} />
                </XStack>

                <XStack flexWrap="wrap" gap={8}>
                  {tests.map(test => {
                    const st = states[test.id] || { status: 'idle' as TestStatus, elapsed: null, summary: '' }
                    const cfg = STATUS_CFG[st.status]
                    const StatusIcon = cfg.Icon
                    const TestIcon = ICONS[test.lucideIcon] || FlaskConical
                    const isRun = st.status === 'running'
                    const isAct = activeId === test.id

                    return (
                      <Pressable
                        key={test.id}
                        onPress={() => isRun ? stop() : run(test.id)}
                        style={{
                          width: isNarrow ? '100%' : cardWidth,
                          flexGrow: isNarrow ? 1 : 0,
                        }}
                      >
                        <YStack
                          padding="$3"
                          borderRadius={10}
                          borderWidth={1}
                          borderColor={isAct ? accent : '$borderColor'}
                          backgroundColor={isAct ? '$backgroundHover' : '$background'}
                          gap={8}
                          overflow="hidden"
                          position="relative"
                        >
                          {/* Status accent line */}
                          {st.status !== 'idle' && (
                            <YStack
                              position="absolute" top={0} left={0} right={0} height={2}
                              backgroundColor={cfg.color} opacity={0.7}
                            />
                          )}

                          {/* Row 1: icon + name + status */}
                          <XStack alignItems="center" gap={8}>
                            <TestIcon size={16} color="#6b7280" />
                            <Text
                              fontSize={13} fontWeight="600" color="$color"
                              flex={1} numberOfLines={1}
                            >
                              {test.name}
                            </Text>
                            <XStack
                              alignItems="center" gap={4}
                              paddingHorizontal={8} paddingVertical={2}
                              borderRadius={12} backgroundColor={cfg.bg}
                            >
                              <StatusIcon size={11} color={cfg.color} />
                              <Text fontSize={10} fontWeight="600" color={cfg.color}>{cfg.label}</Text>
                            </XStack>
                          </XStack>

                          {/* Row 2: description */}
                          <Text fontSize={11} color="$mutedText" lineHeight={16}>{test.desc}</Text>

                          {/* Row 3: cmd */}
                          <Text
                            fontSize={10} fontFamily={monoFamily}
                            color="#4b5563" numberOfLines={1}
                          >
                            $ {test.cmd}
                          </Text>

                          {/* Row 4: action + results */}
                          <XStack alignItems="center" justifyContent="space-between" marginTop={2}>
                            <XStack
                              alignItems="center" gap={4}
                              paddingHorizontal={10} paddingVertical={4}
                              borderRadius={6}
                              backgroundColor={isRun ? '#f59e0b18' : accent}
                            >
                              {isRun
                                ? <Square size={10} color="#f59e0b" />
                                : <Play size={10} color="white" fill="white" />
                              }
                              <Text fontSize={11} fontWeight="600" color={isRun ? '#f59e0b' : 'white'}>
                                {isRun ? 'Stop' : 'Run'}
                              </Text>
                            </XStack>
                            <XStack alignItems="center" gap={8}>
                              {st.summary ? (
                                <Text
                                  fontSize={11} fontWeight="500"
                                  color={st.status === 'passed' ? '#22c55e' : st.status === 'failed' ? '#ef4444' : '$mutedText'}
                                >
                                  {st.summary}
                                </Text>
                              ) : null}
                              {st.elapsed ? (
                                <XStack alignItems="center" gap={3}>
                                  <Clock size={10} color="#4b5563" />
                                  <Text fontSize={10} color="#4b5563">{st.elapsed}s</Text>
                                </XStack>
                              ) : null}
                            </XStack>
                          </XStack>
                        </YStack>
                      </Pressable>
                    )
                  })}
                </XStack>
              </YStack>
            </FadeIn>
          )
        })}
      </ScrollView>

      {/* ─── Sticky bottom console ──────────────────────────────────────── */}
      {consoleOpen && (
        <YStack
          // @ts-ignore web position: sticky/fixed
          style={isWeb ? { position: 'sticky', bottom: 0 } : undefined}
          borderTopWidth={1}
          borderTopColor="#1e293b"
          backgroundColor="#0d1117"
        >
          {/* Drag handle */}
          {!consoleCollapsed && <DragHandle onHeightChange={handleHeightChange} />}

          {/* Console toolbar */}
          <XStack
            alignItems="center"
            justifyContent="space-between"
            paddingHorizontal={12}
            height={consoleBarH}
            backgroundColor="#161b22"
            borderBottomWidth={consoleCollapsed ? 0 : 1}
            borderBottomColor="#1e293b"
          >
            <XStack alignItems="center" gap={8}>
              <Terminal size={13} color="#8b949e" />
              <Text fontSize={11} fontWeight="700" textTransform="uppercase" letterSpacing={1} color="#8b949e">
                Console
              </Text>
              {activeTest && (
                <Text
                  fontSize={11} color="#8b949e"
                  backgroundColor="#1e293b" paddingHorizontal={8} paddingVertical={2} borderRadius={4}
                >
                  {activeTest.name}
                </Text>
              )}
              {running > 0 && (
                <YStack width={6} height={6} borderRadius={3} backgroundColor="#f59e0b" />
              )}
            </XStack>
            <XStack alignItems="center" gap={4}>
              <Pressable onPress={() => fetchLog(activeId!)}>
                <XStack alignItems="center" paddingHorizontal={6} paddingVertical={4}>
                  <RefreshCw size={12} color="#8b949e" />
                </XStack>
              </Pressable>
              <Pressable onPress={() => setLog('')}>
                <XStack alignItems="center" paddingHorizontal={6} paddingVertical={4}>
                  <Trash2 size={12} color="#8b949e" />
                </XStack>
              </Pressable>
              <Pressable onPress={() => setConsoleCollapsed(c => !c)}>
                <XStack alignItems="center" paddingHorizontal={6} paddingVertical={4}>
                  {consoleCollapsed ? <ChevronUp size={14} color="#8b949e" /> : <ChevronDown size={14} color="#8b949e" />}
                </XStack>
              </Pressable>
              <Pressable onPress={() => { setLog(''); setActiveId(null) }}>
                <XStack alignItems="center" paddingHorizontal={6} paddingVertical={4}>
                  <X size={14} color="#8b949e" />
                </XStack>
              </Pressable>
            </XStack>
          </XStack>

          {/* Log content */}
          {!consoleCollapsed && (
            <ScrollView
              ref={logScrollRef}
              style={{ height: consoleHeight }}
              contentContainerStyle={{ padding: 12, paddingBottom: 16 }}
            >
              {log ? (
                <AnsiText text={log} monoFamily={monoFamily} />
              ) : (
                <Text
                  fontFamily={monoFamily}
                  fontSize={12} lineHeight={20} color="#4b5563" fontStyle="italic"
                >
                  Waiting for output...
                </Text>
              )}
            </ScrollView>
          )}
        </YStack>
      )}
    </YStack>
  )
}
