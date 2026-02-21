import { Platform } from 'react-native'
import { YStack, XStack, Text, useTheme } from 'tamagui'
import { Ionicons } from '@expo/vector-icons'
import { useTranslation } from '@mvp/i18n'
import { SlideIn } from '../animations/SlideIn'

const CHECKLIST = [
  { key: 'showcaseItem1', icon: 'search-outline' },
  { key: 'showcaseItem2', icon: 'notifications-outline' },
  { key: 'showcaseItem3', icon: 'sparkles-outline' },
  { key: 'showcaseItem4', icon: 'lock-closed-outline' },
  { key: 'showcaseItem5', icon: 'globe-outline' },
  { key: 'showcaseItem6', icon: 'terminal-outline' },
  { key: 'showcaseItem7', icon: 'rocket-outline' },
] as const

const TECH_STACK = [
  'Expo SDK 54', 'React Native 0.81', 'Tamagui v2', 'TypeScript',
  'Fastify v5', 'Drizzle ORM', 'PostgreSQL', 'Redis',
  'Zustand', 'TanStack Query', 'PostHog', 'Reanimated v4',
]

export function LandingShowcase() {
  const { t } = useTranslation()
  const theme = useTheme()

  if (Platform.OS !== 'web') return null

  return (
    <YStack
      id="showcase"
      paddingVertical="$10"
      paddingHorizontal="$5"
      alignItems="center"
      backgroundColor="$subtleBackground"
    >
      <YStack maxWidth={1200} width="100%" gap="$8">
        {/* Section header */}
        <SlideIn from="bottom">
          <YStack alignItems="center" gap="$2">
            <Text fontWeight="bold" fontSize={36} color="$color" textAlign="center">
              {t('landing.showcaseTitle')}
            </Text>
            <Text fontSize="$4" color="$mutedText" textAlign="center" maxWidth={500}>
              {t('landing.showcaseSubtitle')}
            </Text>
          </YStack>
        </SlideIn>

        {/* Two columns */}
        <XStack flexWrap="wrap" gap="$8" justifyContent="center">
          {/* Checklist */}
          <SlideIn from="left" delay={100}>
            <YStack gap="$3.5" style={{ minWidth: 340, flex: 1 } as any}>
              {CHECKLIST.map((item) => (
                <XStack key={item.key} gap="$3" alignItems="center">
                  <YStack
                    width={32}
                    height={32}
                    borderRadius={8}
                    alignItems="center"
                    justifyContent="center"
                    style={{
                      background: `linear-gradient(135deg, ${theme.accentGradientStart.val}20, ${theme.accentGradientEnd.val}20)`,
                    } as any}
                  >
                    <Ionicons name={item.icon as any} size={18} color={theme.accent.val} />
                  </YStack>
                  <Text fontSize="$4" color="$color">
                    {t(`landing.${item.key}` as any)}
                  </Text>
                </XStack>
              ))}
            </YStack>
          </SlideIn>

          {/* Tech stack badges */}
          <SlideIn from="right" delay={200}>
            <YStack gap="$4" style={{ minWidth: 340, flex: 1 } as any}>
              <Text fontWeight="bold" fontSize="$5" color="$color">Tech Stack</Text>
              <XStack flexWrap="wrap" gap="$2.5">
                {TECH_STACK.map((tech) => (
                  <XStack
                    key={tech}
                    backgroundColor="$cardBackground"
                    paddingHorizontal="$3"
                    paddingVertical="$2"
                    borderRadius="$3"
                    borderWidth={1}
                    borderColor="$borderColor"
                  >
                    <Text fontSize="$3" fontWeight="500" color="$color">{tech}</Text>
                  </XStack>
                ))}
              </XStack>
            </YStack>
          </SlideIn>
        </XStack>
      </YStack>
    </YStack>
  )
}
