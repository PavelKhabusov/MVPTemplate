import { Platform } from 'react-native'
import { YStack, XStack, Text, useTheme } from 'tamagui'
import { Ionicons } from '@expo/vector-icons'
import { useTranslation } from '@mvp/i18n'
import { SlideIn } from '../animations/SlideIn'

const CHECKLIST = [
  'showcaseItem1', 'showcaseItem2', 'showcaseItem3',
  'showcaseItem4', 'showcaseItem5', 'showcaseItem6', 'showcaseItem7',
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
            <YStack gap="$3" style={{ minWidth: 340, flex: 1 } as any}>
              {CHECKLIST.map((key, i) => (
                <XStack key={key} gap="$3" alignItems="center">
                  <YStack
                    width={28}
                    height={28}
                    borderRadius={14}
                    alignItems="center"
                    justifyContent="center"
                    style={{
                      background: `linear-gradient(135deg, ${theme.accentGradientStart.val}, ${theme.accentGradientEnd.val})`,
                    } as any}
                  >
                    <Ionicons name="checkmark" size={16} color="white" />
                  </YStack>
                  <Text fontSize="$4" color="$color">
                    {t(`landing.${key}` as any)}
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
