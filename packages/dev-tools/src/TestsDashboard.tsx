import React, { useState, useEffect, useRef, useCallback } from 'react'
import { ScrollView, Platform, Linking } from 'react-native'
import { YStack, XStack, Text, useTheme } from 'tamagui'
import { AppButton, FadeIn, ScalePress } from '@mvp/ui'
import {
  CheckCircle2, XCircle, Circle, Loader2, Play, Square,
  FlaskConical, Wrench, Globe, ShieldCheck,
  Terminal, RefreshCw, X, CloudOff,
  Server, Database, Library, Languages,
  BarChart3, FileCheck, Table2, Camera,
  Puzzle, Image, CheckSquare, ShieldAlert,
  Container, Rocket,
  type LucideIcon,
} from 'lucide-react'
import { TESTS, GROUP_LABELS, GROUPS, type TestStatus } from './tests'

// --- Lucide icon map (lucideIcon string → component) ----------------------------

const LUCIDE_ICONS: Record<string, LucideIcon> = {
  'flask-conical': FlaskConical,
  'server': Server,
  'database': Database,
  'library': Library,
  'languages': Languages,
  'bar-chart-3': BarChart3,
  'file-check': FileCheck,
  'table-2': Table2,
  'camera': Camera,
  'globe': Globe,
  'puzzle': Puzzle,
  'image': Image,
  'check-square': CheckSquare,
  'shield-alert': ShieldAlert,
  'container': Container,
  'rocket': Rocket,
}

// --- ANSI color conversion -------------------------------------------------------

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
      parts.push(
        <span key={lastIndex} style={{ color: currentColor || '#d1d5db', fontWeight: bold ? 700 : 400 }}>
          {chunk}
        </span>
      )
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
    parts.push(
      <span key={lastIndex} style={{ color: currentColor || '#d1d5db', fontWeight: bold ? 700 : 400 }}>
        {text.slice(lastIndex)}
      </span>
    )
  }
  return parts
}

// --- Helpers ---------------------------------------------------------------------

interface CardTestState {
  status: TestStatus
  elapsed: string | null
  summary: string
}

const STATUS_CONFIG: Record<TestStatus, { color: string; bg: string; Icon: React.FC<any>; label: string }> = {
  idle: { color: '#6b7280', bg: 'transparent', Icon: Circle, label: 'Ready' },
  running: { color: '#f59e0b', bg: '#f59e0b15', Icon: Loader2, label: 'Running...' },
  passed: { color: '#22c55e', bg: '#22c55e12', Icon: CheckCircle2, label: 'Passed' },
  failed: { color: '#ef4444', bg: '#ef444412', Icon: XCircle, label: 'Failed' },
}

const GROUP_ICONS: Record<string, React.FC<any>> = {
  unit: FlaskConical,
  specialized: Wrench,
  e2e: Globe,
  quality: ShieldCheck,
}

// --- Component -------------------------------------------------------------------

interface Props {
  apiBase?: string
}

export function TestsDashboard({ apiBase }: Props) {
  const devApi = `${apiBase ?? (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000')}/dev`
  const theme = useTheme()
  const [states, setStates] = useState<Record<string, CardTestState>>(() => {
    const initial: Record<string, CardTestState> = {}
    for (const test of TESTS) initial[test.id] = { status: 'idle', elapsed: null, summary: '' }
    return initial
  })
  const [runningId, setRunningId] = useState<string | null>(null)
  const [log, setLog] = useState('')
  const [activeLogId, setActiveLogId] = useState<string | null>(null)
  const [connected, setConnected] = useState(false)
  const logRef = useRef<ScrollView>(null)

  // Native fallback
  if (Platform.OS !== 'web') {
    return (
      <YStack flex={1} padding="$4" alignItems="center" justifyContent="center" gap="$4">
        <FlaskConical size={48} color="#888" />
        <Text fontSize="$4" color="$mutedText" textAlign="center">
          Тест-дашборд доступен только в браузере
        </Text>
        <AppButton onPress={() => Linking.openURL(`${devApi}/tests`)}>
          Открыть в браузере
        </AppButton>
      </YStack>
    )
  }

  // SSE connection
  useEffect(() => {
    const es = new EventSource(`${devApi}/tests/stream`)

    es.addEventListener('init', (e: any) => {
      try {
        const data = JSON.parse(e.data)
        if (data.running) setRunningId(data.running)
        if (data.state) {
          const newStates: Record<string, CardTestState> = {}
          for (const [id, s] of Object.entries(data.state) as [string, any][]) {
            newStates[id] = { status: s.status, elapsed: s.elapsed, summary: s.summary }
          }
          setStates(prev => ({ ...prev, ...newStates }))
        }
        setConnected(true)
      } catch { /* ignore */ }
    })

    es.addEventListener('status', (e: any) => {
      try {
        const data = JSON.parse(e.data)
        setStates(prev => ({
          ...prev,
          [data.id]: {
            status: data.status,
            elapsed: data.elapsed || prev[data.id]?.elapsed || null,
            summary: data.summary || prev[data.id]?.summary || '',
          }
        }))
        if (data.status === 'running') {
          setRunningId(data.id)
        } else if (data.status === 'passed' || data.status === 'failed' || data.status === 'idle') {
          setRunningId(prev => prev === data.id ? null : prev)
        }
      } catch { /* ignore */ }
    })

    es.addEventListener('log', (e: any) => {
      try {
        const data = JSON.parse(e.data)
        setActiveLogId(data.id)
        setLog(prev => prev + data.text)
      } catch { /* ignore */ }
    })

    es.onerror = () => setConnected(false)

    return () => { es.close() }
  }, [devApi])

  const runTest = useCallback((id: string) => {
    setLog('')
    setActiveLogId(id)
    fetch(`${devApi}/tests/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    }).catch(() => {})
  }, [devApi])

  const stopTest = useCallback(() => {
    fetch(`${devApi}/tests/stop`, { method: 'POST' }).catch(() => {})
  }, [devApi])

  const fetchLog = useCallback((id: string) => {
    fetch(`${devApi}/tests/log?id=${id}`)
      .then(r => r.json())
      .then(data => {
        if (data.log) {
          setLog(data.log)
          setActiveLogId(id)
        }
      })
      .catch(() => {})
  }, [devApi])

  // Stats
  const passedCount = Object.values(states).filter(s => s.status === 'passed').length
  const failedCount = Object.values(states).filter(s => s.status === 'failed').length
  const totalCount = TESTS.length

  const activeTest = activeLogId ? TESTS.find(t => t.id === activeLogId) : null

  return (
    <YStack flex={1}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>

        {/* Header bar with stats + connection indicator */}
        <FadeIn>
          <XStack
            alignItems="center"
            justifyContent="space-between"
            marginBottom="$4"
            // @ts-ignore
            style={{ flexWrap: 'wrap', gap: 12 }}
          >
            {/* Stats pills */}
            <XStack gap="$2" alignItems="center" // @ts-ignore
              style={{ flexWrap: 'wrap' }}
            >
              <XStack
                backgroundColor="#22c55e12"
                paddingHorizontal="$2.5"
                paddingVertical="$1.5"
                borderRadius="$4"
                alignItems="center"
                gap="$1.5"
              >
                <CheckCircle2 size={13} color="#22c55e" />
                <Text fontSize={12} color="#22c55e" fontWeight="600">{passedCount} passed</Text>
              </XStack>
              {failedCount > 0 && (
                <XStack
                  backgroundColor="#ef444412"
                  paddingHorizontal="$2.5"
                  paddingVertical="$1.5"
                  borderRadius="$4"
                  alignItems="center"
                  gap="$1.5"
                >
                  <XCircle size={13} color="#ef4444" />
                  <Text fontSize={12} color="#ef4444" fontWeight="600">{failedCount} failed</Text>
                </XStack>
              )}
              <Text fontSize={12} color="$mutedText">{totalCount} tests</Text>
            </XStack>

            {/* Connection indicator */}
            <XStack alignItems="center" gap="$1.5">
              {/* @ts-ignore */}
              <div style={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                backgroundColor: connected ? '#22c55e' : '#ef4444',
                boxShadow: connected ? '0 0 6px #22c55e80' : '0 0 6px #ef444480',
              }} />
              <Text fontSize={11} color="$mutedText">
                {connected ? 'Connected' : 'Disconnected'}
              </Text>
            </XStack>
          </XStack>
        </FadeIn>

        {/* Disconnected banner */}
        {!connected && (
          <FadeIn>
            <XStack
              backgroundColor="#ef444410"
              borderWidth={1}
              borderColor="#ef444425"
              padding="$2.5"
              borderRadius="$3"
              marginBottom="$4"
              alignItems="center"
              gap="$2"
            >
              <CloudOff size={15} color="#ef4444" />
              <Text fontSize={12} color="#f87171" flex={1}>
                No connection to server. Run: npm run dev:backend
              </Text>
            </XStack>
          </FadeIn>
        )}

        {/* Test groups */}
        {GROUPS.map(group => {
          const groupTests = TESTS.filter(t => t.group === group)
          const GroupIcon = GROUP_ICONS[group] || FlaskConical
          return (
            <FadeIn key={group}>
              <YStack marginBottom="$5">
                {/* Group header */}
                <XStack alignItems="center" gap="$2" marginBottom="$3">
                  <GroupIcon size={15} color={theme.mutedText.val as string} />
                  <Text
                    fontSize={11}
                    color="$mutedText"
                    fontWeight="700"
                    textTransform="uppercase"
                    letterSpacing={1.2}
                  >
                    {GROUP_LABELS[group]}
                  </Text>
                  <YStack
                    flex={1}
                    height={1}
                    backgroundColor="$borderColor"
                    opacity={0.4}
                  />
                </XStack>

                {/* Cards grid */}
                {/* @ts-ignore */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                  gap: 10,
                }}>
                  {groupTests.map(test => {
                    const st = states[test.id] || { status: 'idle' as TestStatus, elapsed: null, summary: '' }
                    const cfg = STATUS_CONFIG[st.status]
                    const StatusIcon = cfg.Icon
                    const isRunning = st.status === 'running'
                    const isActive = activeLogId === test.id

                    return (
                      <ScalePress key={test.id} onPress={() => isRunning ? stopTest() : runTest(test.id)}>
                        <YStack
                          backgroundColor={isActive ? '$subtleBackground' : '$background'}
                          borderWidth={1}
                          borderColor={isActive ? '$accent' : '$borderColor'}
                          borderRadius="$4"
                          padding="$3"
                          gap="$2"
                          // @ts-ignore
                          style={{
                            minHeight: 130,
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                            position: 'relative',
                            overflow: 'hidden',
                          }}
                          hoverStyle={{
                            borderColor: '$accent',
                            backgroundColor: '$subtleBackground',
                          }}
                        >
                          {/* Status accent line at top */}
                          {st.status !== 'idle' && (
                            // @ts-ignore
                            <div style={{
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              right: 0,
                              height: 2,
                              backgroundColor: cfg.color,
                              opacity: 0.8,
                            }} />
                          )}

                          {/* Top row: icon + status badge */}
                          <XStack justifyContent="space-between" alignItems="center">
                            {(() => {
                              const TestIcon = LUCIDE_ICONS[test.lucideIcon] || FlaskConical
                              return <TestIcon size={20} color={theme.mutedText.val as string} />
                            })()}
                            <XStack
                              backgroundColor={cfg.bg}
                              paddingHorizontal="$2"
                              paddingVertical={3}
                              borderRadius="$4"
                              alignItems="center"
                              gap={4}
                            >
                              <StatusIcon
                                size={12}
                                color={cfg.color}
                                // @ts-ignore
                                style={isRunning ? { animation: 'spin 1s linear infinite' } : undefined}
                              />
                              {st.status !== 'idle' && (
                                <Text fontSize={10} color={cfg.color} fontWeight="600">
                                  {cfg.label}
                                </Text>
                              )}
                            </XStack>
                          </XStack>

                          {/* Name */}
                          <Text fontSize={14} fontWeight="700" color="$color" numberOfLines={1}>
                            {test.name}
                          </Text>

                          {/* Description */}
                          <Text fontSize={12} color="$mutedText" numberOfLines={2} lineHeight={16}>
                            {test.desc}
                          </Text>

                          {/* Bottom row: action + elapsed */}
                          <XStack marginTop="auto" justifyContent="space-between" alignItems="center">
                            <XStack
                              backgroundColor={isRunning ? '#f59e0b18' : '$accent'}
                              paddingHorizontal="$2"
                              paddingVertical={4}
                              borderRadius={6}
                              alignItems="center"
                              gap={4}
                              hoverStyle={{ opacity: 0.85 }}
                            >
                              {isRunning
                                ? <Square size={10} color="#f59e0b" />
                                : <Play size={10} color="white" fill="white" />
                              }
                              <Text
                                fontSize={11}
                                color={isRunning ? '#f59e0b' : 'white'}
                                fontWeight="600"
                              >
                                {isRunning ? 'Stop' : 'Run'}
                              </Text>
                            </XStack>
                            {st.elapsed && (
                              <Text fontSize={10} color="$mutedText" fontWeight="500">
                                {st.elapsed}s
                              </Text>
                            )}
                          </XStack>

                          {/* Summary line */}
                          {st.summary ? (
                            <Text
                              fontSize={10}
                              color={st.status === 'passed' ? '#22c55e' : st.status === 'failed' ? '#ef4444' : '$mutedText'}
                              numberOfLines={1}
                              fontWeight="500"
                            >
                              {st.summary}
                            </Text>
                          ) : null}
                        </YStack>
                      </ScalePress>
                    )
                  })}
                </div>
              </YStack>
            </FadeIn>
          )
        })}

        {/* Log panel */}
        {activeLogId && (
          <FadeIn>
            <YStack marginTop="$2">
              {/* Log header */}
              <XStack
                justifyContent="space-between"
                alignItems="center"
                marginBottom="$2"
                paddingHorizontal="$1"
              >
                <XStack alignItems="center" gap="$2">
                  <Terminal size={14} color={theme.mutedText.val as string} />
                  <Text fontSize={11} color="$mutedText" fontWeight="700" textTransform="uppercase" letterSpacing={1}>
                    Output
                  </Text>
                  {activeTest && (
                    <XStack
                      backgroundColor="$subtleBackground"
                      paddingHorizontal="$2"
                      paddingVertical={2}
                      borderRadius="$2"
                    >
                      <XStack alignItems="center" gap={6}>
                        {(() => {
                          const LogIcon = LUCIDE_ICONS[activeTest.lucideIcon] || FlaskConical
                          return <LogIcon size={12} color={theme.color.val as string} />
                        })()}
                        <Text fontSize={11} color="$color" fontWeight="500">
                          {activeTest.name}
                        </Text>
                      </XStack>
                    </XStack>
                  )}
                </XStack>
                <XStack gap="$3" alignItems="center">
                  <ScalePress onPress={() => fetchLog(activeLogId)}>
                    <XStack alignItems="center" gap="$1" opacity={0.7} hoverStyle={{ opacity: 1 }}>
                      <RefreshCw size={12} color={theme.mutedText.val as string} />
                      <Text fontSize={11} color="$mutedText" fontWeight="500">Refresh</Text>
                    </XStack>
                  </ScalePress>
                  <ScalePress onPress={() => { setLog(''); setActiveLogId(null) }}>
                    <XStack alignItems="center" gap="$1" opacity={0.7} hoverStyle={{ opacity: 1 }}>
                      <X size={14} color={theme.mutedText.val as string} />
                      <Text fontSize={11} color="$mutedText" fontWeight="500">Close</Text>
                    </XStack>
                  </ScalePress>
                </XStack>
              </XStack>

              {/* Log body */}
              <YStack
                borderRadius="$4"
                borderWidth={1}
                borderColor="$borderColor"
                // @ts-ignore
                style={{
                  maxHeight: 450,
                  overflow: 'hidden',
                  background: 'linear-gradient(180deg, #0d1117 0%, #161b22 100%)',
                }}
              >
                {/* @ts-ignore */}
                <div style={{
                  maxHeight: 450,
                  overflow: 'auto',
                  padding: 16,
                }}>
                  {/* @ts-ignore */}
                  <pre style={{
                    margin: 0,
                    fontFamily: 'JetBrains Mono, SF Mono, Menlo, Consolas, monospace',
                    fontSize: 12,
                    lineHeight: 1.7,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-all',
                    color: '#d1d5db',
                  }}>
                    {log ? ansiToReactNodes(log) : (
                      <span style={{ color: '#4b5563', fontStyle: 'italic' }}>
                        Waiting for output...
                      </span>
                    )}
                  </pre>
                </div>
              </YStack>
            </YStack>
          </FadeIn>
        )}
      </ScrollView>

      {/* @ts-ignore — inject spin keyframes for Loader2 */}
      <style dangerouslySetInnerHTML={{ __html: `@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }` }} />
    </YStack>
  )
}
