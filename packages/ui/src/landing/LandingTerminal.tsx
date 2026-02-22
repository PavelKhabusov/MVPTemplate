import { useState, useEffect, useRef } from 'react'
import { Platform, View } from 'react-native'
import { YStack, XStack, Text } from 'tamagui'
import { useTranslation } from '@mvp/i18n'
import { SlideIn } from '../animations/SlideIn'

/* ── terminal command lines ── */
const TERMINAL_LINES = [
  { prompt: true, text: 'git clone <repo-url> && cd MVPTemplate' },
  { prompt: true, text: 'npm install' },
  { prompt: false, text: '✓ Dependencies installed' },
  { prompt: true, text: 'docker compose up -d' },
  { prompt: false, text: '✓ PostgreSQL + Redis started' },
  { prompt: true, text: 'npm run db:push' },
  { prompt: false, text: '✓ Database schema synced' },
  { prompt: true, text: 'npm run dev' },
  { prompt: false, text: '▸ Backend  → http://localhost:3000' },
  { prompt: false, text: '▸ Mobile   → press i / a / w' },
]

/* ── project tree ── */
const TREE_LINES: readonly { depth: number; name: string; comment?: string }[] = [
  { depth: 0, name: 'MVPTemplate/' },
  { depth: 1, name: 'apps/' },
  { depth: 2, name: 'mobile/', comment: 'Expo · iOS / Android / Web' },
  { depth: 3, name: 'app/', comment: 'file-based routes' },
  { depth: 3, name: 'src/', comment: 'features, services, config' },
  { depth: 2, name: 'backend/', comment: 'Fastify API' },
  { depth: 3, name: 'src/', comment: 'modules, database, config' },
  { depth: 3, name: 'docker/', comment: 'Dockerfile + compose' },
  { depth: 1, name: 'packages/' },
  { depth: 2, name: 'ui/', comment: 'components, animations, landing' },
  { depth: 2, name: 'auth/', comment: 'forms, providers, flows' },
  { depth: 2, name: 'store/', comment: 'Zustand + MMKV persist' },
  { depth: 2, name: 'i18n/', comment: 'en, ru, es, ja' },
  { depth: 2, name: 'docs/', comment: 'markdown documentation' },
  { depth: 2, name: 'analytics/', comment: 'PostHog + internal' },
  { depth: 1, name: 'scripts/', comment: 'setup, docker, admin' },
]

/* ── macOS window dots ── */
function WindowDots() {
  return (
    <XStack gap={6}>
      <YStack width={12} height={12} borderRadius={6} backgroundColor="#FF5F57" />
      <YStack width={12} height={12} borderRadius={6} backgroundColor="#FEBC2E" />
      <YStack width={12} height={12} borderRadius={6} backgroundColor="#28C840" />
    </XStack>
  )
}

export function LandingTerminal() {
  const { t } = useTranslation()
  const sectionRef = useRef<View>(null)
  const [isInView, setIsInView] = useState(false)

  // Terminal typing state
  const [currentLine, setCurrentLine] = useState(-1)
  const [charIndex, setCharIndex] = useState(0)
  const typingDone = currentLine >= TERMINAL_LINES.length

  // Tree reveal state
  const [visibleTreeLines, setVisibleTreeLines] = useState(0)

  // Intersection observer — start animations when scrolled into view
  useEffect(() => {
    if (Platform.OS !== 'web') return
    const el = sectionRef.current as unknown as HTMLElement
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true)
          observer.disconnect()
        }
      },
      { threshold: 0.2 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  // Inject CSS keyframes
  useEffect(() => {
    if (Platform.OS !== 'web') return
    const style = document.createElement('style')
    style.textContent = `
      @keyframes cursorBlink {
        0%, 100% { opacity: 1; }
        50% { opacity: 0; }
      }
      @keyframes treeLineIn {
        from { opacity: 0; transform: translateX(-12px); }
        to { opacity: 1; transform: translateX(0); }
      }
      @media (max-width: 768px) {
        #terminal-title { font-size: 26px !important; }
        .terminal-panel { min-width: 0 !important; max-width: 100% !important; width: 100% !important; }
      }
    `
    document.head.appendChild(style)
    return () => { document.head.removeChild(style) }
  }, [])

  // Start typing when section enters view
  useEffect(() => {
    if (!isInView) return
    const timer = setTimeout(() => setCurrentLine(0), 600)
    return () => clearTimeout(timer)
  }, [isInView])

  // Type characters one by one
  useEffect(() => {
    if (currentLine < 0 || currentLine >= TERMINAL_LINES.length) return
    const line = TERMINAL_LINES[currentLine]
    if (charIndex >= line.text.length) {
      // pause then advance to next line
      const delay = line.prompt ? 350 : 60
      const timer = setTimeout(() => {
        setCurrentLine((prev) => prev + 1)
        setCharIndex(0)
      }, delay)
      return () => clearTimeout(timer)
    }
    const speed = line.prompt ? 25 : 8
    const timer = setTimeout(() => setCharIndex((prev) => prev + 1), speed)
    return () => clearTimeout(timer)
  }, [currentLine, charIndex])

  // Reveal tree lines sequentially
  useEffect(() => {
    if (!isInView) return
    let intervalId: ReturnType<typeof setInterval> | undefined
    const timerId = setTimeout(() => {
      intervalId = setInterval(() => {
        setVisibleTreeLines((prev) => {
          if (prev >= TREE_LINES.length) {
            clearInterval(intervalId!)
            return prev
          }
          return prev + 1
        })
      }, 100)
    }, 400)
    return () => {
      clearTimeout(timerId)
      if (intervalId) clearInterval(intervalId)
    }
  }, [isInView])

  if (Platform.OS !== 'web') return null

  return (
    <YStack
      paddingVertical="$10"
      paddingHorizontal="$5"
      alignItems="center"
    >
      <View
        ref={sectionRef}
        style={{ maxWidth: 1200, width: '100%', gap: 32 } as any}
      >
        <SlideIn from="bottom">
          <YStack alignItems="center" gap="$2">
            <Text nativeID="terminal-title" fontWeight="bold" fontSize={36} color="$color" textAlign="center">
              {t('landing.terminalTitle')}
            </Text>
            <Text fontSize="$4" color="$mutedText" textAlign="center" maxWidth={500}>
              {t('landing.terminalSubtitle')}
            </Text>
          </YStack>
        </SlideIn>

        <XStack flexWrap="wrap" gap="$4" justifyContent="center">
          {/* ── Terminal panel ── */}
          <SlideIn from="left" delay={100}>
            <YStack
              className="terminal-panel"
              borderRadius="$4"
              overflow="hidden"
              borderWidth={1}
              borderColor="$borderColor"
              style={{ minWidth: 300, flex: 1, maxWidth: 600 } as any}
            >
              {/* Title bar */}
              <XStack
                paddingHorizontal="$4"
                paddingVertical="$3"
                alignItems="center"
                gap="$3"
                style={{ backgroundColor: '#1a1a2e' } as any}
              >
                <WindowDots />
                <Text fontSize={12} color="#888" style={{ fontFamily: 'monospace' } as any}>
                  Terminal
                </Text>
              </XStack>

              {/* Typed content */}
              <YStack
                padding="$4"
                gap="$1.5"
                style={{ backgroundColor: '#0d1117', minHeight: 280, height: '100%' } as any}
              >
                {TERMINAL_LINES.map((line, i) => {
                  if (i > currentLine) return null
                  const isActive = i === currentLine
                  const text = isActive ? line.text.slice(0, charIndex) : line.text

                  return (
                    <XStack key={i} gap="$2" alignItems="flex-start">
                      {line.prompt ? (
                        <>
                          <Text
                            fontSize={13}
                            color="#7ee787"
                            style={{ fontFamily: 'monospace', whiteSpace: 'nowrap', userSelect: 'none' } as any}
                          >
                            $
                          </Text>
                          <Text
                            fontSize={13}
                            color="#e6edf3"
                            style={{ fontFamily: 'monospace', wordBreak: 'break-word', overflowWrap: 'break-word', flex: 1 } as any}
                          >
                            {text}
                            {isActive && !typingDone && (
                              <Text
                                fontSize={13}
                                color="#7ee787"
                                style={{ fontFamily: 'monospace', animation: 'cursorBlink 1s step-end infinite' } as any}
                              >
                                ▋
                              </Text>
                            )}
                          </Text>
                        </>
                      ) : (
                        <Text
                          fontSize={13}
                          color="#8b949e"
                          style={{ fontFamily: 'monospace', paddingLeft: 16, wordBreak: 'break-word', overflowWrap: 'break-word' } as any}
                        >
                          {text}
                        </Text>
                      )}
                    </XStack>
                  )
                })}

                {/* Idle cursor after all lines typed */}
                {typingDone && (
                  <XStack gap="$2" alignItems="flex-start">
                    <Text
                      fontSize={13}
                      color="#7ee787"
                      style={{ fontFamily: 'monospace', whiteSpace: 'nowrap', userSelect: 'none' } as any}
                    >
                      $
                    </Text>
                    <Text
                      fontSize={13}
                      color="#7ee787"
                      style={{ fontFamily: 'monospace', animation: 'cursorBlink 1s step-end infinite' } as any}
                    >
                      ▋
                    </Text>
                  </XStack>
                )}
              </YStack>
            </YStack>
          </SlideIn>

          {/* ── Project tree panel ── */}
          <SlideIn from="right" delay={200}>
            <YStack
              className="terminal-panel"
              borderRadius="$4"
              overflow="hidden"
              borderWidth={1}
              borderColor="$borderColor"
              style={{ minWidth: 300, flex: 1, maxWidth: 600 } as any}
            >
              {/* Title bar */}
              <XStack
                paddingHorizontal="$4"
                paddingVertical="$3"
                alignItems="center"
                gap="$3"
                style={{ backgroundColor: '#1a1a2e' } as any}
              >
                <WindowDots />
                <Text fontSize={12} color="#888" style={{ fontFamily: 'monospace' } as any}>
                  Project Structure
                </Text>
              </XStack>

              {/* Animated tree */}
              <YStack
                padding="$4"
                gap="$1"
                style={{ backgroundColor: '#0d1117', minHeight: 280, height: '100%' } as any}
              >
                {TREE_LINES.map((line, i) => {
                  if (i >= visibleTreeLines) return null
                  return (
                    <XStack
                      key={i}
                      gap="$2"
                      alignItems="center"
                      style={{
                        paddingLeft: line.depth * 20,
                        animation: 'treeLineIn 0.3s ease-out both',
                      } as any}
                    >
                      <Text
                        fontSize={13}
                        color="#79c0ff"
                        fontWeight="600"
                        style={{ fontFamily: 'monospace' } as any}
                      >
                        {line.name}
                      </Text>
                      {line.comment && (
                        <Text
                          fontSize={12}
                          color="#484f58"
                          style={{ fontFamily: 'monospace' } as any}
                        >
                          {'// ' + line.comment}
                        </Text>
                      )}
                    </XStack>
                  )
                })}
              </YStack>
            </YStack>
          </SlideIn>
        </XStack>
      </View>
    </YStack>
  )
}
