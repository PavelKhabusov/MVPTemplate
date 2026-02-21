import { Platform } from 'react-native'
import { YStack, XStack, Text, useTheme } from 'tamagui'
import { Ionicons } from '@expo/vector-icons'
import { useTranslation } from '@mvp/i18n'
import { SlideIn } from '../animations/SlideIn'

const FEATURES = [
  { icon: 'phone-portrait-outline', title: 'featureCrossPlatform', desc: 'featureCrossPlatformDesc' },
  { icon: 'color-palette-outline', title: 'featureTheming', desc: 'featureThemingDesc' },
  { icon: 'language-outline', title: 'featureI18n', desc: 'featureI18nDesc' },
  { icon: 'shield-checkmark-outline', title: 'featureAuth', desc: 'featureAuthDesc' },
  { icon: 'server-outline', title: 'featureBackend', desc: 'featureBackendDesc' },
  { icon: 'analytics-outline', title: 'featureAnalytics', desc: 'featureAnalyticsDesc' },
] as const

export function LandingFeatures() {
  const { t } = useTranslation()
  const theme = useTheme()

  if (Platform.OS !== 'web') return null

  return (
    <YStack
      id="features"
      paddingVertical="$10"
      paddingHorizontal="$5"
      alignItems="center"
    >
      <YStack maxWidth={1200} width="100%" gap="$8">
        {/* Section header */}
        <SlideIn from="bottom">
          <YStack alignItems="center" gap="$2">
            <Text fontWeight="bold" fontSize={36} color="$color" textAlign="center">
              {t('landing.featuresTitle')}
            </Text>
            <Text fontSize="$4" color="$mutedText" textAlign="center" maxWidth={500}>
              {t('landing.featuresSubtitle')}
            </Text>
          </YStack>
        </SlideIn>

        {/* Features grid — CSS grid for equal-height cards */}
        <YStack
          width="100%"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: 16,
          } as any}
        >
          {FEATURES.map((feature, i) => (
            <SlideIn key={feature.title} from="bottom" delay={i * 80} style={{ height: '100%' } as any}>
              <YStack
                backgroundColor="$cardBackground"
                borderRadius="$4"
                borderWidth={1}
                borderColor="$borderColor"
                padding="$5"
                gap="$3"
                flex={1}
                hoverStyle={{
                  borderColor: '$accent',
                  shadowColor: '$cardShadow',
                  shadowRadius: 12,
                  shadowOpacity: 1,
                } as any}
              >
                {/* Icon */}
                <YStack
                  width={48}
                  height={48}
                  borderRadius={12}
                  alignItems="center"
                  justifyContent="center"
                  style={{
                    background: `linear-gradient(135deg, ${theme.accentGradientStart.val}20, ${theme.accentGradientEnd.val}20)`,
                  } as any}
                >
                  <Ionicons name={feature.icon as any} size={24} color={theme.accent.val} />
                </YStack>

                <Text fontWeight="bold" fontSize="$5" color="$color">
                  {t(`landing.${feature.title}` as any)}
                </Text>
                <Text fontSize="$3" color="$mutedText" lineHeight={22}>
                  {t(`landing.${feature.desc}` as any)}
                </Text>
              </YStack>
            </SlideIn>
          ))}
        </YStack>
      </YStack>
    </YStack>
  )
}
