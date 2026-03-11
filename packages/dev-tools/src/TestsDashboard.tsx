import React, { useState, useEffect, useCallback, useRef } from 'react'
import { ScrollView, Platform, Pressable, useWindowDimensions } from 'react-native'
import { YStack, XStack, Text, useTheme } from 'tamagui'
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

function stripAnsi(text: string): string {
  return text.replace(/\x1b\[[0-9;]*m/g, '')
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
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const isWeb = Platform.OS === 'web'
  const accent = theme.accent?.val || '#8b5cf6'

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
    setLog(''); setActiveId(id)
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


  const passed = Object.values(states).filter(s => s.status === 'passed').length
  const failed = Object.values(states).filter(s => s.status === 'failed').length
  const running = Object.values(states).filter(s => s.status === 'running').length
  const activeTest = activeId ? TESTS.find(t => t.id === activeId) : null

  const cardWidth = isNarrow ? '100%' : 260

  return (
    <YStack flex={1}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
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
                            fontSize={10} fontFamily={isWeb ? 'JetBrains Mono, SF Mono, monospace' : '$mono'}
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

        {/* Log panel */}
        {activeId && (
          <FadeIn>
            <YStack marginTop="$2">
              <XStack alignItems="center" justifyContent="space-between" marginBottom="$2" paddingHorizontal={4}>
                <XStack alignItems="center" gap={8}>
                  <Terminal size={14} color="#6b7280" />
                  <Text fontSize={11} fontWeight="700" textTransform="uppercase" letterSpacing={1} color="$mutedText">
                    Output
                  </Text>
                  {activeTest && (
                    <Text fontSize={11} color="$mutedText" backgroundColor="$backgroundHover" paddingHorizontal={8} paddingVertical={2} borderRadius={4}>
                      {activeTest.name}
                    </Text>
                  )}
                </XStack>
                <XStack gap="$3">
                  <Pressable onPress={() => fetchLog(activeId)}>
                    <XStack alignItems="center" gap={4}>
                      <RefreshCw size={11} color="#6b7280" />
                      <Text fontSize={11} color="$mutedText">Refresh</Text>
                    </XStack>
                  </Pressable>
                  <Pressable onPress={() => { setLog(''); setActiveId(null) }}>
                    <XStack alignItems="center" gap={4}>
                      <X size={13} color="#6b7280" />
                      <Text fontSize={11} color="$mutedText">Close</Text>
                    </XStack>
                  </Pressable>
                </XStack>
              </XStack>

              <YStack
                borderRadius={10} borderWidth={1} borderColor="$borderColor"
                backgroundColor="#0d1117" maxHeight={450} overflow="hidden"
              >
                <ScrollView style={{ maxHeight: 450, padding: 16 }}>
                  <Text
                    fontFamily={isWeb ? 'JetBrains Mono, SF Mono, Menlo, Consolas, monospace' : '$mono'}
                    fontSize={12} lineHeight={20} color="#d1d5db"
                    // @ts-ignore web prop
                    style={isWeb ? { whiteSpace: 'pre-wrap', wordBreak: 'break-all' } : undefined}
                  >
                    {log ? stripAnsi(log) : 'Waiting for output...'}
                  </Text>
                </ScrollView>
              </YStack>
            </YStack>
          </FadeIn>
        )}
      </ScrollView>
    </YStack>
  )
}
