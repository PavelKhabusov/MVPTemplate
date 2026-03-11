import React, { useState, useEffect, useCallback, useRef } from 'react'
import { ScrollView, Platform, Pressable, useWindowDimensions, PanResponder } from 'react-native'
import { YStack, XStack, Text, useTheme } from 'tamagui'
import { FadeIn } from '@mvp/ui'
import { useAppTranslation } from '@mvp/i18n'
import {
  CheckCircle2, XCircle, Circle, Loader2, Play, Square, Clock,
  FlaskConical, Wrench, Globe, ShieldCheck,
  Terminal, RefreshCw, X, CloudOff, GripHorizontal,
  Server, Database, Library, Languages,
  BarChart3, FileCheck, Table2, Camera,
  Puzzle, Image, CheckSquare, ShieldAlert,
  Container, Rocket, ChevronDown, ChevronUp, Trash2,
  History, ChevronLeft, ChevronRight, Copy, Check,
  type LucideIcon,
} from 'lucide-react-native'
import { TESTS, GROUPS, type TestStatus } from './tests'
// GROUP_LABELS no longer imported — using i18n keys instead

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

interface FailedTestInfo { name: string; file?: string; error?: string }

interface St {
  status: TestStatus
  elapsed: string | null
  summary: string
  passed?: number
  failed?: number
  total?: number
}

interface FailureRecord {
  id: string
  testName: string
  timestamp: number
  elapsed: string | null
  summary: string
  passed: number
  failed: number
  total: number
  failedTests: FailedTestInfo[]
}

const GROUP_ICONS: Record<string, LucideIcon> = {
  unit: FlaskConical, specialized: Wrench, e2e: Globe, quality: ShieldCheck,
}

const GROUP_I18N: Record<string, string> = {
  unit: 'testsGroupUnit',
  specialized: 'testsGroupSpecialized',
  e2e: 'testsGroupE2e',
  quality: 'testsGroupQuality',
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

// ─── Copy button helper ─────────────────────────────────────────────────────

function CopyButton({ text, monoFamily, label }: { text: string; monoFamily: string; label?: string }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = useCallback(() => {
    if (Platform.OS === 'web' && typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(text).then(() => {
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }).catch(() => {})
    }
  }, [text])

  if (Platform.OS !== 'web') return null

  return (
    <Pressable onPress={handleCopy}>
      <XStack alignItems="center" gap={4} paddingHorizontal={6} paddingVertical={3} borderRadius={4} backgroundColor="#1e293b" hoverStyle={{ backgroundColor: '#2d3748' }}>
        {copied ? <Check size={10} color="#22c55e" /> : <Copy size={10} color="#8b949e" />}
        <Text fontSize={9} fontFamily={monoFamily} color={copied ? '#22c55e' : '#8b949e'}>
          {copied ? 'Copied' : (label || 'Copy')}
        </Text>
      </XStack>
    </Pressable>
  )
}

interface Props { apiBase?: string }

export function TestsDashboard({ apiBase }: Props) {
  const devApi = `${apiBase ?? (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000')}/dev`
  const { t } = useAppTranslation()
  const theme = useTheme()
  const { width: screenWidth } = useWindowDimensions()
  const isNarrow = screenWidth < 500
  const [states, setStates] = useState<Record<string, St>>(() => {
    const r: Record<string, St> = {}; for (const tt of TESTS) r[tt.id] = { status: 'idle', elapsed: null, summary: '' }; return r
  })
  const [log, setLog] = useState('')
  const [activeId, setActiveId] = useState<string | null>(null)
  const [connected, setConnected] = useState(false)
  const [consoleHeight, setConsoleHeight] = useState(DEFAULT_CONSOLE_H)
  const [consoleCollapsed, setConsoleCollapsed] = useState(false)
  // Failure history
  const [failures, setFailures] = useState<FailureRecord[]>([])
  const [failureIdx, setFailureIdx] = useState<number | null>(null)
  const [failuresOpen, setFailuresOpen] = useState(false)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const logScrollRef = useRef<ScrollView>(null)
  const statesRef = useRef(states)
  statesRef.current = states
  const isWeb = Platform.OS === 'web'
  const accent = theme.accent?.val || '#8b5cf6'
  const monoFamily = isWeb ? 'JetBrains Mono, SF Mono, Menlo, Consolas, monospace' : '$mono'

  const STATUS_CFG: Record<TestStatus, { color: string; bg: string; Icon: LucideIcon; label: string }> = {
    idle:    { color: '#6b7280', bg: 'transparent', Icon: Circle,       label: t('admin.testsReady') },
    running: { color: '#f59e0b', bg: '#f59e0b18',  Icon: Loader2,      label: t('admin.testsRunningStatus') },
    passed:  { color: '#22c55e', bg: '#22c55e18',  Icon: CheckCircle2, label: t('admin.testsPassedStatus') },
    failed:  { color: '#ef4444', bg: '#ef444418',  Icon: XCircle,      label: t('admin.testsFailedStatus') },
  }

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
              ns[id] = { status: s.status, elapsed: s.elapsed, summary: s.summary, passed: s.passed, failed: s.failed, total: s.total }
            setStates(p => ({ ...p, ...ns }))
          }
          setConnected(true)
          fetchFailures()
        } catch { /* ignore */ }
      })
      es.addEventListener('status', (e: any) => {
        try {
          const d = JSON.parse(e.data)
          setStates(p => ({
            ...p,
            [d.id]: {
              status: d.status,
              elapsed: d.elapsed || p[d.id]?.elapsed,
              summary: d.summary || p[d.id]?.summary || '',
              passed: d.passed ?? p[d.id]?.passed,
              failed: d.failed ?? p[d.id]?.failed,
              total: d.total ?? p[d.id]?.total,
            },
          }))
        } catch { /* ignore */ }
      })
      es.addEventListener('log', (e: any) => {
        try { const d = JSON.parse(e.data); setActiveId(d.id); setLog(p => p + d.text) } catch { /* ignore */ }
      })
      es.addEventListener('failure', () => { fetchFailures() })
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
                ns[id] = { status: s.status, elapsed: s.elapsed, summary: s.summary, passed: s.passed, failed: s.failed, total: s.total }
              // Detect test completion → fetch final log
              const prev = statesRef.current
              for (const [id, s] of Object.entries(ns)) {
                if (prev[id]?.status === 'running' && (s.status === 'passed' || s.status === 'failed')) {
                  fetch(`${devApi}/tests/log?id=${id}`)
                    .then(r => r.json())
                    .then(ld => { if (ld.log) setLog(ld.log) })
                    .catch(() => {})
                }
              }
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
      fetchFailures()
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

  // On native, poll for active test log via ref to avoid interval reset
  useEffect(() => {
    if (isWeb || !activeId) return
    // Fetch immediately, then poll
    fetchLog(activeId)
    const id = setInterval(() => {
      const st = statesRef.current[activeId]
      if (st?.status === 'running') fetchLog(activeId)
    }, 1500)
    return () => clearInterval(id)
  }, [isWeb, activeId, fetchLog])

  const handleHeightChange = useCallback((h: number) => {
    setConsoleHeight(h)
  }, [])

  // Fetch failure history list
  const fetchFailures = useCallback(() => {
    fetch(`${devApi}/tests/failures`)
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setFailures(data) })
      .catch(() => {})
  }, [devApi])

  // Load a specific failure log into console
  const viewFailure = useCallback((idx: number) => {
    setFailureIdx(idx)
    fetch(`${devApi}/tests/failures/log?index=${idx}`)
      .then(r => r.json())
      .then(d => { if (d.log) { setLog(d.log); setActiveId(d.id); setConsoleCollapsed(false) } })
      .catch(() => {})
  }, [devApi])

  // Back to live log
  const backToLive = useCallback(() => {
    setFailureIdx(null)
    if (activeId) fetchLog(activeId)
  }, [activeId, fetchLog])

  // Format failure details as copyable text
  const formatFailureText = useCallback((f: FailureRecord): string => {
    const lines: string[] = []
    lines.push(`${f.testName} — ${f.summary || 'FAILED'}`)
    if (f.failedTests && f.failedTests.length > 0) {
      for (const ft of f.failedTests) {
        const parts = []
        if (ft.file) parts.push(ft.file)
        parts.push(ft.name)
        lines.push(`  - ${parts.join(' > ')}`)
        if (ft.error) lines.push(`    ${ft.error}`)
      }
    }
    lines.push(`  ${new Date(f.timestamp).toLocaleString()} | ${f.elapsed ? f.elapsed + 's' : ''}`)
    return lines.join('\n')
  }, [])

  const passedCount = Object.values(states).filter(s => s.status === 'passed').length
  const failedCount = Object.values(states).filter(s => s.status === 'failed').length
  const runningCount = Object.values(states).filter(s => s.status === 'running').length
  const activeTest = activeId ? TESTS.find(tt => tt.id === activeId) : null

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
              {passedCount > 0 && (
                <XStack alignItems="center" gap={5} paddingHorizontal={10} paddingVertical={4} borderRadius={20} backgroundColor="#22c55e18">
                  <CheckCircle2 size={13} color="#22c55e" />
                  <Text fontSize={12} fontWeight="600" color="#22c55e">{t('admin.testsPassed', { count: passedCount })}</Text>
                </XStack>
              )}
              {failedCount > 0 && (
                <Pressable onPress={() => {
                  fetchFailures()
                  setFailuresOpen(true)
                  setConsoleCollapsed(false)
                  // Open console if not open — pick first failed test
                  if (!activeId) {
                    const firstFailed = Object.entries(states).find(([, s]) => s.status === 'failed')
                    if (firstFailed) { setActiveId(firstFailed[0]); fetchLog(firstFailed[0]) }
                  }
                }}>
                  <XStack alignItems="center" gap={5} paddingHorizontal={10} paddingVertical={4} borderRadius={20} backgroundColor="#ef444418">
                    <XCircle size={13} color="#ef4444" />
                    <Text fontSize={12} fontWeight="600" color="#ef4444">{t('admin.testsFailed', { count: failedCount })}</Text>
                  </XStack>
                </Pressable>
              )}
              {runningCount > 0 && (
                <XStack alignItems="center" gap={5} paddingHorizontal={10} paddingVertical={4} borderRadius={20} backgroundColor="#f59e0b18">
                  <Loader2 size={13} color="#f59e0b" />
                  <Text fontSize={12} fontWeight="600" color="#f59e0b">{t('admin.testsRunning', { count: runningCount })}</Text>
                </XStack>
              )}
              <Text fontSize={12} color="$mutedText">{t('admin.testsTotal', { count: TESTS.length })}</Text>
            </XStack>
            <XStack alignItems="center" gap={6}>
              <YStack width={7} height={7} borderRadius={4} backgroundColor={connected ? '#22c55e' : '#ef4444'} />
              <Text fontSize={11} color="$mutedText">{connected ? t('admin.testsConnected') : t('admin.testsDisconnected')}</Text>
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
              <Text fontSize={12} color="#f87171">{t('admin.testsNoConnection')}</Text>
            </XStack>
          </FadeIn>
        )}

        {GROUPS.map(group => {
          const tests = TESTS.filter(tt => tt.group === group)
          const GIcon = GROUP_ICONS[group] || FlaskConical
          return (
            <FadeIn key={group}>
              <YStack marginBottom="$5">
                <XStack alignItems="center" gap="$2" marginBottom="$2.5">
                  <GIcon size={14} color="#6b7280" />
                  <Text fontSize={11} fontWeight="700" textTransform="uppercase" letterSpacing={1.2} color="$mutedText">
                    {t(`admin.${GROUP_I18N[group]}`)}
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

                    // Build status label with counts
                    let statusLabel = cfg.label
                    if ((st.status === 'passed' || st.status === 'failed') && st.total && st.total > 0) {
                      statusLabel = `${st.passed ?? 0}/${st.total}`
                    }

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
                              <Text fontSize={10} fontWeight="600" color={cfg.color}>{statusLabel}</Text>
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
                                {isRun ? t('admin.testsStop') : t('admin.testsRun')}
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
                {t('admin.testsConsole')}
              </Text>
              {failureIdx !== null ? (
                <XStack alignItems="center" gap={6}>
                  <XStack backgroundColor="#ef444430" paddingHorizontal={8} paddingVertical={2} borderRadius={4} alignItems="center" gap={4}>
                    <History size={10} color="#f87171" />
                    <Text fontSize={10} fontWeight="600" color="#f87171">
                      {t('admin.testsFailure', { index: failureIdx + 1 })}
                    </Text>
                  </XStack>
                  {failures[failureIdx] && (
                    <Text fontSize={10} color="#8b949e">{failures[failureIdx].testName}</Text>
                  )}
                  <Pressable onPress={backToLive}>
                    <Text fontSize={10} color="#60a5fa" fontWeight="600">{t('admin.testsLive')}</Text>
                  </Pressable>
                </XStack>
              ) : (
                <>
                  {activeTest && (
                    <Text
                      fontSize={11} color="#8b949e"
                      backgroundColor="#1e293b" paddingHorizontal={8} paddingVertical={2} borderRadius={4}
                    >
                      {activeTest.name}
                    </Text>
                  )}
                  {runningCount > 0 && (
                    <YStack width={6} height={6} borderRadius={3} backgroundColor="#f59e0b" />
                  )}
                </>
              )}
            </XStack>
            <XStack alignItems="center" gap={4}>
              {/* Failures tab toggle + copy all */}
              {failuresOpen && failures.length > 0 && (
                <CopyButton
                  text={failures.map(f => formatFailureText(f)).join('\n\n')}
                  monoFamily={monoFamily}
                  label="Copy All"
                />
              )}
              <Pressable onPress={() => {
                fetchFailures()
                setFailuresOpen(f => !f)
                setConsoleCollapsed(false)
              }}>
                <XStack
                  alignItems="center" gap={3} paddingHorizontal={8} paddingVertical={4}
                  borderRadius={4}
                  backgroundColor={failuresOpen ? '#ef444420' : 'transparent'}
                >
                  <History size={12} color={failuresOpen ? '#f87171' : failures.length > 0 ? '#f87171' : '#8b949e'} />
                  {failures.length > 0 && (
                    <Text fontSize={10} fontWeight="600" color="#f87171">{failures.length}</Text>
                  )}
                </XStack>
              </Pressable>
              {/* Navigate failures */}
              {failureIdx !== null && (
                <XStack alignItems="center" gap={2}>
                  <Pressable onPress={() => { if (failureIdx < failures.length - 1) viewFailure(failureIdx + 1) }}>
                    <XStack paddingHorizontal={4} paddingVertical={4} opacity={failureIdx < failures.length - 1 ? 1 : 0.3}>
                      <ChevronLeft size={12} color="#8b949e" />
                    </XStack>
                  </Pressable>
                  <Text fontSize={10} color="#8b949e">{failureIdx + 1}/{failures.length}</Text>
                  <Pressable onPress={() => { if (failureIdx > 0) viewFailure(failureIdx - 1) }}>
                    <XStack paddingHorizontal={4} paddingVertical={4} opacity={failureIdx > 0 ? 1 : 0.3}>
                      <ChevronRight size={12} color="#8b949e" />
                    </XStack>
                  </Pressable>
                </XStack>
              )}
              <Pressable onPress={() => { backToLive(); fetchLog(activeId!) }}>
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
              <Pressable onPress={() => { setLog(''); setActiveId(null); setFailureIdx(null); setFailuresOpen(false) }}>
                <XStack alignItems="center" paddingHorizontal={6} paddingVertical={4}>
                  <X size={14} color="#8b949e" />
                </XStack>
              </Pressable>
            </XStack>
          </XStack>

          {/* Console content area — shows either failures tab or log */}
          {!consoleCollapsed && (
            failuresOpen ? (
              // ─── Failures tab ────────────────────────────────────────
              <ScrollView
                style={{ height: consoleHeight }}
                contentContainerStyle={{ padding: 8, paddingBottom: 16 }}
              >
                {failures.length === 0 ? (
                  <Text fontSize={11} color="#4b5563" fontStyle="italic" padding={8}>{t('admin.testsNoFailures')}</Text>
                ) : (
                  failures.map((f, idx) => (
                    <Pressable key={`${f.id}-${f.timestamp}`} onPress={() => { viewFailure(idx); setFailuresOpen(false) }}>
                      <YStack
                        padding={8} borderRadius={6} marginBottom={4}
                        backgroundColor={failureIdx === idx ? '#ef444418' : 'transparent'}
                        hoverStyle={{ backgroundColor: '#1e293b' }}
                      >
                        <XStack alignItems="center" gap={8}>
                          <XCircle size={12} color="#ef4444" />
                          <Text fontSize={11} fontWeight="600" color="#d1d5db" flex={1} numberOfLines={1}>
                            {f.testName}
                          </Text>
                          {f.summary ? (
                            <Text fontSize={10} fontWeight="600" color="#f87171">{f.summary}</Text>
                          ) : null}
                          {f.elapsed ? (
                            <Text fontSize={10} color="#4b5563">{f.elapsed}s</Text>
                          ) : null}
                          <Text fontSize={10} color="#4b5563">
                            {new Date(f.timestamp).toLocaleTimeString()}
                          </Text>
                          <CopyButton text={formatFailureText(f)} monoFamily={monoFamily} />
                        </XStack>
                        {/* Individual failed tests */}
                        {f.failedTests && f.failedTests.length > 0 && (
                          <YStack marginTop={6} marginLeft={20} gap={3}>
                            {f.failedTests.map((ft, ftIdx) => (
                              <YStack key={ftIdx} gap={2}>
                                <XStack alignItems="flex-start" gap={4}>
                                  <Text fontSize={10} color="#ef4444" marginTop={1}>-</Text>
                                  <YStack flex={1}>
                                    <Text
                                      fontSize={10} fontFamily={monoFamily} color="#d1d5db"
                                      numberOfLines={2}
                                      // @ts-ignore
                                      style={isWeb ? { wordBreak: 'break-all', userSelect: 'text' } : undefined}
                                    >
                                      {ft.file ? <Text fontSize={10} color="#60a5fa" fontFamily={monoFamily}>{ft.file} {'> '}</Text> : null}
                                      {ft.name}
                                    </Text>
                                    {ft.error && (
                                      <Text
                                        fontSize={9} fontFamily={monoFamily} color="#f87171" marginTop={2}
                                        numberOfLines={2}
                                        // @ts-ignore
                                        style={isWeb ? { wordBreak: 'break-all', userSelect: 'text' } : undefined}
                                      >
                                        {ft.error}
                                      </Text>
                                    )}
                                  </YStack>
                                </XStack>
                              </YStack>
                            ))}
                          </YStack>
                        )}
                      </YStack>
                    </Pressable>
                  ))
                )}
              </ScrollView>
            ) : (
              // ─── Log tab ─────────────────────────────────────────────
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
                    {t('admin.testsWaitingOutput')}
                  </Text>
                )}
              </ScrollView>
            )
          )}
        </YStack>
      )}
    </YStack>
  )
}
