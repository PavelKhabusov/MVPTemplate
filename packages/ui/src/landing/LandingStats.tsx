import { Platform } from 'react-native'
import { YStack, XStack, Text, useTheme } from 'tamagui'
import { useTranslation } from '@mvp/i18n'
import { SlideIn } from '../animations/SlideIn'

const STATS = [
  { value: '3', key: 'statPlatforms' },
  { value: '18+', key: 'statEndpoints' },
  { value: '4', key: 'statLanguages' },
  { value: '7', key: 'statPackages' },
] as const

export function LandingStats() {
  const { t } = useTranslation()
  const theme = useTheme()

  if (Platform.OS !== 'web') return null

  return (
    <YStack
      paddingVertical="$8"
      paddingHorizontal="$5"
      alignItems="center"
      style={{
        background: `linear-gradient(180deg, transparent, ${theme.accentGradientStart.val}08 50%, transparent)`,
      } as any}
    >
      <XStack
        maxWidth={1000}
        width="100%"
        flexWrap="wrap"
        justifyContent="center"
        gap="$4"
      >
        {STATS.map((stat, i) => (
          <SlideIn key={stat.key} from="bottom" delay={i * 100}>
            <YStack
              alignItems="center"
              gap="$1"
              paddingHorizontal="$6"
              paddingVertical="$4"
              style={{ minWidth: 180 } as any}
            >
              <Text
                fontWeight="bold"
                fontSize={48}
                color="$accent"
                style={{ letterSpacing: '-0.03em' } as any}
              >
                {stat.value}
              </Text>
              <Text fontSize="$3" color="$mutedText" fontWeight="500" textAlign="center">
                {t(`landing.${stat.key}` as any)}
              </Text>
            </YStack>
          </SlideIn>
        ))}
      </XStack>
    </YStack>
  )
}
