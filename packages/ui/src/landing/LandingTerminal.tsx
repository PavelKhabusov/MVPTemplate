import { Platform } from 'react-native'
import { YStack, XStack, Text, useTheme } from 'tamagui'
import { useTranslation } from '@mvp/i18n'
import { SlideIn } from '../animations/SlideIn'

/* ── terminal command lines ── */
const TERMINAL_LINES = [
  { prompt: true, text: 'git clone https://github.com/PavelKhabusov/MVPTemplate.git' },
  { prompt: true, text: 'cd MVPTemplate && pwsh scripts/setup.ps1' },
  { prompt: false, text: '✓ Dependencies installed' },
  { prompt: false, text: '✓ Docker: PostgreSQL + Redis started' },
  { prompt: false, text: '✓ JWT secrets generated' },
  { prompt: false, text: '✓ Database schema pushed' },
  { prompt: true, text: 'npm run dev' },
  { prompt: false, text: '▸ Backend  → http://localhost:3000' },
  { prompt: false, text: '▸ Mobile   → press i / a / w' },
]

/* ── project tree ── */
const TREE_LINES: readonly { depth: number; name: string; comment?: string; color: string }[] = [
  { depth: 0, name: 'MVPTemplate/' , color: 'folder' },
  { depth: 1, name: 'apps/', color: 'folder' },
  { depth: 2, name: 'mobile/', comment: 'Expo · iOS / Android / Web', color: 'folder' },
  { depth: 3, name: 'app/', comment: 'file-based routes', color: 'folder' },
  { depth: 3, name: 'src/features/', comment: 'auth, search, onboarding', color: 'folder' },
  { depth: 2, name: 'backend/', comment: 'Fastify API', color: 'folder' },
  { depth: 3, name: 'src/modules/', comment: 'auth, users, admin, push, SSE', color: 'folder' },
  { depth: 3, name: 'src/database/', comment: 'Drizzle schema + migrations', color: 'folder' },
  { depth: 3, name: 'docker/', comment: 'Dockerfile + compose', color: 'folder' },
  { depth: 1, name: 'packages/', color: 'folder' },
  { depth: 2, name: 'ui/', comment: 'components, animations, landing', color: 'folder' },
  { depth: 2, name: 'store/', comment: 'Zustand stores', color: 'folder' },
  { depth: 2, name: 'i18n/', comment: '4 locales', color: 'folder' },
  { depth: 2, name: 'lib/', comment: 'MMKV, secure storage', color: 'folder' },
  { depth: 2, name: 'analytics/', comment: 'PostHog abstraction', color: 'folder' },
  { depth: 1, name: 'scripts/', comment: 'setup, docker, admin', color: 'folder' },
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
  const theme = useTheme()

  if (Platform.OS !== 'web') return null

  return (
    <YStack
      paddingVertical="$10"
      paddingHorizontal="$5"
      alignItems="center"
    >
      <YStack maxWidth={1200} width="100%" gap="$8">
        <SlideIn from="bottom">
          <YStack alignItems="center" gap="$2">
            <Text fontWeight="bold" fontSize={36} color="$color" textAlign="center">
              {t('landing.terminalTitle')}
            </Text>
            <Text fontSize="$4" color="$mutedText" textAlign="center" maxWidth={500}>
              {t('landing.terminalSubtitle')}
            </Text>
          </YStack>
        </SlideIn>

        <XStack flexWrap="wrap" gap="$4" justifyContent="center">
          {/* Terminal panel */}
          <SlideIn from="left" delay={100}>
            <YStack
              borderRadius="$4"
              overflow="hidden"
              borderWidth={1}
              borderColor="$borderColor"
              style={{ minWidth: 420, flex: 1, maxWidth: 600 } as any}
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
                <Text fontSize={12} color="#888" fontFamily="$mono" style={{ fontFamily: 'monospace' } as any}>
                  Terminal
                </Text>
              </XStack>

              {/* Content */}
              <YStack
                padding="$4"
                gap="$1.5"
                style={{ backgroundColor: '#0d1117', minHeight: 260 } as any}
              >
                {TERMINAL_LINES.map((line, i) => (
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
                          style={{ fontFamily: 'monospace', wordBreak: 'break-all' } as any}
                        >
                          {line.text}
                        </Text>
                      </>
                    ) : (
                      <Text
                        fontSize={13}
                        color="#8b949e"
                        style={{ fontFamily: 'monospace', paddingLeft: 16 } as any}
                      >
                        {line.text}
                      </Text>
                    )}
                  </XStack>
                ))}
              </YStack>
            </YStack>
          </SlideIn>

          {/* Project tree panel */}
          <SlideIn from="right" delay={200}>
            <YStack
              borderRadius="$4"
              overflow="hidden"
              borderWidth={1}
              borderColor="$borderColor"
              style={{ minWidth: 420, flex: 1, maxWidth: 600 } as any}
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
                <Text fontSize={12} color="#888" fontFamily="$mono" style={{ fontFamily: 'monospace' } as any}>
                  Project Structure
                </Text>
              </XStack>

              {/* Content */}
              <YStack
                padding="$4"
                gap="$1"
                style={{ backgroundColor: '#0d1117', minHeight: 260 } as any}
              >
                {TREE_LINES.map((line, i) => (
                  <XStack key={i} gap="$2" alignItems="center" style={{ paddingLeft: line.depth * 20 } as any}>
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
                ))}
              </YStack>
            </YStack>
          </SlideIn>
        </XStack>
      </YStack>
    </YStack>
  )
}
