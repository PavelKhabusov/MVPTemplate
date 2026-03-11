import React, { useState, useEffect, useRef, useCallback } from 'react'
import { ScrollView, Platform, Linking } from 'react-native'
import { YStack, XStack, Text, useTheme } from 'tamagui'
import { useTranslation } from '@mvp/i18n'
import { AppButton, AppCard, FadeIn, ScalePress } from '@mvp/ui'
import { Ionicons } from '@expo/vector-icons'

const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000'
const DEV_API = `${API_BASE}/dev`

// ─── Test definitions (mirrored from backend) ────────────────────────────────

interface TestDef {
  id: string
  icon: string
  name: string
  desc: string
  group: 'unit' | 'specialized' | 'e2e' | 'quality'
}

const TESTS: TestDef[] = [
  { id: 'all', icon: '🧪', name: 'Все юнит-тесты', desc: 'Проверяет всю логику приложения', group: 'unit' },
  { id: 'backend', icon: '⚙️', name: 'Backend', desc: 'API, авторизация, платежи', group: 'unit' },
  { id: 'store', icon: '🗄️', name: 'Store', desc: 'Хранилище данных (Zustand)', group: 'unit' },
  { id: 'lib', icon: '📚', name: 'Библиотеки', desc: 'Утилиты и хелперы', group: 'unit' },
  { id: 'i18n', icon: '🌍', name: 'Переводы', desc: 'Проверка en, ru, es, ja', group: 'unit' },
  { id: 'coverage', icon: '📊', name: 'Покрытие кода', desc: 'Минимум: 70%', group: 'specialized' },
  { id: 'contracts', icon: '📝', name: 'API-контракты', desc: 'Формат ответов API', group: 'specialized' },
  { id: 'schema', icon: '🗃️', name: 'Схема БД', desc: 'Структура таблиц', group: 'specialized' },
  { id: 'snapshots', icon: '📸', name: 'Снапшоты', desc: 'Обновить эталоны', group: 'specialized' },
  { id: 'e2e', icon: '🌐', name: 'E2E Web', desc: 'Браузерные тесты', group: 'e2e' },
  { id: 'e2e-ext', icon: '🧩', name: 'E2E Расширение', desc: 'Chrome extension', group: 'e2e' },
  { id: 'e2e-visual', icon: '🎨', name: 'Визуальная регрессия', desc: 'Скриншоты UI', group: 'e2e' },
  { id: 'lint', icon: '✅', name: 'Lint + Типы', desc: 'ESLint + TypeScript', group: 'quality' },
  { id: 'audit', icon: '🔒', name: 'Аудит', desc: 'Уязвимости зависимостей', group: 'quality' },
  { id: 'docker', icon: '🐳', name: 'Docker', desc: 'Сборка образа backend', group: 'quality' },
  { id: 'ci', icon: '🚀', name: 'Полный CI', desc: 'Lint → Тесты → Docker', group: 'quality' },
]

const GROUP_LABELS: Record<string, string> = {
  unit: 'Юнит-тесты',
  specialized: 'Специализированные',
  e2e: 'E2E тесты',
  quality: 'Качество кода',
}

// ─── Types ────────────────────────────────────────────────────────────────────

type TestStatus = 'idle' | 'running' | 'passed' | 'failed'

interface TestState {
  status: TestStatus
  elapsed: string | null
  summary: string
}

// ─── ANSI color conversion ────────────────────────────────────────────────────

const ANSI_COLORS: Record<string, string> = {
  '30': '#555', '31': '#f87171', '32': '#4ade80', '33': '#fbbf24',
  '34': '#60a5fa', '35': '#c084fc', '36': '#22d3ee', '37': '#e5e7eb',
  '90': '#9ca3af', '91': '#fca5a5', '92': '#86efac', '93': '#fde68a',
  '1': '', // bold — handled via fontWeight
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

// ─── Component ────────────────────────────────────────────────────────────────

export function TestsAdminTab() {
  const { t } = useTranslation()
  const theme = useTheme()
  const [states, setStates] = useState<Record<string, TestState>>(() => {
    const initial: Record<string, TestState> = {}
    for (const test of TESTS) initial[test.id] = { status: 'idle', elapsed: null, summary: '' }
    return initial
  })
  const [runningId, setRunningId] = useState<string | null>(null)
  const [log, setLog] = useState('')
  const [activeLogId, setActiveLogId] = useState<string | null>(null)
  const [connected, setConnected] = useState(false)
  const [modules, setModules] = useState<string[]>([])
  const [selectedModule, setSelectedModule] = useState('')
  const logRef = useRef<ScrollView>(null)
  const eventSourceRef = useRef<EventSource | null>(null)

  // Native fallback
  if (Platform.OS !== 'web') {
    return (
      <YStack flex={1} padding="$4" alignItems="center" justifyContent="center" gap="$4">
        <Ionicons name="flask-outline" size={48} color="#888" />
        <Text fontSize="$4" color="$mutedText" textAlign="center">
          {t('admin.testsWebOnly')}
        </Text>
        <AppButton onPress={() => Linking.openURL(`${DEV_API}/tests`)}>
          {t('admin.openInBrowser')}
        </AppButton>
      </YStack>
    )
  }

  // SSE connection
  useEffect(() => {
    const es = new EventSource(`${DEV_API}/tests/stream`)
    eventSourceRef.current = es

    es.addEventListener('init', (e: any) => {
      try {
        const data = JSON.parse(e.data)
        if (data.running) setRunningId(data.running)
        if (data.state) {
          const newStates: Record<string, TestState> = {}
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
  }, [])

  // Fetch backend modules
  useEffect(() => {
    fetch(`${DEV_API}/tests/modules`)
      .then(r => r.json())
      .then(setModules)
      .catch(() => {})
  }, [])

  const runTest = useCallback((id: string) => {
    setLog('')
    setActiveLogId(id)
    fetch(`${DEV_API}/tests/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    }).catch(() => {})
  }, [])

  const stopTest = useCallback(() => {
    fetch(`${DEV_API}/tests/stop`, { method: 'POST' }).catch(() => {})
  }, [])

  const fetchLog = useCallback((id: string) => {
    fetch(`${DEV_API}/tests/log?id=${id}`)
      .then(r => r.json())
      .then(data => {
        if (data.log) {
          setLog(data.log)
          setActiveLogId(id)
        }
      })
      .catch(() => {})
  }, [])

  const statusColor = (status: TestStatus) => {
    switch (status) {
      case 'running': return '#fbbf24'
      case 'passed': return '#4ade80'
      case 'failed': return '#f87171'
      default: return theme.mutedText.val
    }
  }

  const statusIcon = (status: TestStatus): keyof typeof Ionicons.glyphMap => {
    switch (status) {
      case 'running': return 'sync-outline'
      case 'passed': return 'checkmark-circle'
      case 'failed': return 'close-circle'
      default: return 'ellipse-outline'
    }
  }

  const groups = ['unit', 'specialized', 'e2e', 'quality'] as const

  return (
    <YStack flex={1}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        {/* Connection status */}
        {!connected && (
          <FadeIn>
            <XStack
              backgroundColor="#fef3c7"
              padding="$3"
              borderRadius="$3"
              marginBottom="$3"
              alignItems="center"
              gap="$2"
            >
              <Ionicons name="warning-outline" size={16} color="#92400e" />
              <Text fontSize="$2" color="#92400e" flex={1}>
                Нет подключения к серверу. Запустите backend: npm run dev:backend
              </Text>
            </XStack>
          </FadeIn>
        )}

        {/* Module selector */}
        {modules.length > 0 && (
          <AppCard marginBottom="$3">
            <XStack alignItems="center" gap="$2" flexWrap="wrap">
              <Text fontSize="$2" color="$mutedText">Модуль:</Text>
              {/* @ts-ignore — web select */}
              <select
                value={selectedModule}
                onChange={(e: any) => setSelectedModule(e.target.value)}
                style={{
                  background: theme.subtleBackground.val,
                  color: theme.color.val,
                  border: `1px solid ${theme.borderColor.val}`,
                  borderRadius: 8,
                  padding: '6px 10px',
                  fontSize: 13,
                }}
              >
                <option value="">— Выбрать модуль —</option>
                {modules.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
              {selectedModule && (
                <ScalePress onPress={() => runTest(selectedModule)}>
                  <XStack
                    backgroundColor="$accent"
                    paddingHorizontal="$3"
                    paddingVertical="$1.5"
                    borderRadius="$2"
                    gap="$1"
                    alignItems="center"
                  >
                    <Ionicons name="play" size={14} color="white" />
                    <Text color="white" fontSize="$2" fontWeight="600">Запустить</Text>
                  </XStack>
                </ScalePress>
              )}
            </XStack>
          </AppCard>
        )}

        {/* Test cards by group */}
        {groups.map(group => (
          <YStack key={group} marginBottom="$4">
            <Text fontSize="$2" color="$mutedText" fontWeight="700" marginBottom="$2" textTransform="uppercase" letterSpacing={1}>
              {GROUP_LABELS[group]}
            </Text>
            <XStack flexWrap="wrap" gap="$2">
              {TESTS.filter(t => t.group === group).map(test => {
                const st = states[test.id] || { status: 'idle' as TestStatus, elapsed: null, summary: '' }
                const isRunning = st.status === 'running'
                const isActive = activeLogId === test.id

                return (
                  <ScalePress key={test.id} onPress={() => isRunning ? stopTest() : runTest(test.id)}>
                    <YStack
                      // @ts-ignore
                      style={{ width: 200, minHeight: 120 }}
                      backgroundColor={isActive ? '$subtleBackground' : '$background'}
                      borderWidth={1}
                      borderColor={isActive ? '$accent' : '$borderColor'}
                      borderRadius="$3"
                      padding="$3"
                      gap="$1.5"
                      hoverStyle={{ borderColor: '$accent' }}
                    >
                      <XStack justifyContent="space-between" alignItems="center">
                        <Text fontSize={20}>{test.icon}</Text>
                        <Ionicons
                          name={statusIcon(st.status)}
                          size={16}
                          color={statusColor(st.status) as string}
                        />
                      </XStack>
                      <Text fontSize="$3" fontWeight="700" color="$color" numberOfLines={1}>
                        {test.name}
                      </Text>
                      <Text fontSize="$1" color="$mutedText" numberOfLines={2}>
                        {test.desc}
                      </Text>
                      <XStack marginTop="auto" justifyContent="space-between" alignItems="center">
                        <XStack
                          backgroundColor={isRunning ? '#fbbf2420' : '$accent'}
                          paddingHorizontal="$2"
                          paddingVertical="$1"
                          borderRadius="$2"
                          alignItems="center"
                          gap="$1"
                        >
                          <Ionicons
                            name={isRunning ? 'stop' : 'play'}
                            size={11}
                            color={isRunning ? '#fbbf24' : 'white'}
                          />
                          <Text fontSize={11} color={isRunning ? '#fbbf24' : 'white'} fontWeight="600">
                            {isRunning ? 'Стоп' : 'Запустить'}
                          </Text>
                        </XStack>
                        {st.elapsed && (
                          <Text fontSize={10} color="$mutedText">{st.elapsed}s</Text>
                        )}
                      </XStack>
                      {st.summary ? (
                        <Text
                          fontSize={10}
                          color={st.status === 'passed' ? '#4ade80' : st.status === 'failed' ? '#f87171' : '$mutedText'}
                          numberOfLines={1}
                        >
                          {st.summary}
                        </Text>
                      ) : null}
                    </YStack>
                  </ScalePress>
                )
              })}
            </XStack>
          </YStack>
        ))}

        {/* Log panel */}
        {activeLogId && (
          <YStack marginTop="$2">
            <XStack justifyContent="space-between" alignItems="center" marginBottom="$2">
              <Text fontSize="$2" color="$mutedText" fontWeight="700" textTransform="uppercase" letterSpacing={1}>
                Лог: {activeLogId}
              </Text>
              <XStack gap="$2">
                <ScalePress onPress={() => fetchLog(activeLogId)}>
                  <Text fontSize="$1" color="$accent">Обновить</Text>
                </ScalePress>
                <ScalePress onPress={() => { setLog(''); setActiveLogId(null) }}>
                  <Text fontSize="$1" color="$mutedText">Очистить</Text>
                </ScalePress>
              </XStack>
            </XStack>
            <YStack
              backgroundColor="#1a1a2e"
              borderRadius="$3"
              padding="$3"
              // @ts-ignore
              style={{ maxHeight: 400, overflow: 'auto', minHeight: 120 }}
            >
              <ScrollView ref={logRef} style={{ flex: 1 }}>
                {/* @ts-ignore — web pre */}
                <pre style={{
                  margin: 0,
                  fontFamily: 'JetBrains Mono, Menlo, Consolas, monospace',
                  fontSize: 12,
                  lineHeight: 1.6,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-all',
                  color: '#d1d5db',
                }}>
                  {ansiToReactNodes(log)}
                </pre>
              </ScrollView>
            </YStack>
          </YStack>
        )}
      </ScrollView>
    </YStack>
  )
}
