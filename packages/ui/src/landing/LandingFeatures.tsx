import { Platform, View } from 'react-native'
import { YStack, Text, useTheme } from 'tamagui'
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

        {/* CSS grid via View — avoids Tamagui flex conflicts */}
        <View
          style={{
            display: 'grid' as any,
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: 16,
            width: '100%',
          } as any}
        >
          {FEATURES.map((feature, i) => (
            <SlideIn
              key={feature.title}
              from="bottom"
              delay={i * 80}
              style={{ display: 'flex' } as any}
            >
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
        </View>
      </YStack>
    </YStack>
  )
}
