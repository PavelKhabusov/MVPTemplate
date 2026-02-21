import { Platform, View } from 'react-native'
import { YStack, XStack, Text, useTheme } from 'tamagui'
import { Ionicons } from '@expo/vector-icons'
import { useTranslation } from '@mvp/i18n'
import { SlideIn } from '../animations/SlideIn'

const STEPS = [
  { icon: 'copy-outline', key: 'step1' },
  { icon: 'settings-outline', key: 'step2' },
  { icon: 'rocket-outline', key: 'step3' },
] as const

export function LandingHowItWorks() {
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
              {t('landing.howItWorksTitle')}
            </Text>
            <Text fontSize="$4" color="$mutedText" textAlign="center" maxWidth={500}>
              {t('landing.howItWorksSubtitle')}
            </Text>
          </YStack>
        </SlideIn>

        {/* Steps — CSS grid for equal heights */}
        <View
          style={{
            display: 'grid' as any,
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 20,
            width: '100%',
          } as any}
        >
          {STEPS.map((step, i) => (
            <SlideIn key={step.key} from="bottom" delay={i * 120} style={{ display: 'flex' } as any}>
              <YStack
                backgroundColor="$cardBackground"
                borderRadius="$4"
                borderWidth={1}
                borderColor="$borderColor"
                padding="$5"
                gap="$3"
                flex={1}
                alignItems="center"
              >
                {/* Step number */}
                <YStack
                  width={56}
                  height={56}
                  borderRadius={28}
                  alignItems="center"
                  justifyContent="center"
                  style={{
                    background: `linear-gradient(135deg, ${theme.accentGradientStart.val}, ${theme.accentGradientEnd.val})`,
                  } as any}
                >
                  <Text color="white" fontWeight="bold" fontSize={22}>{i + 1}</Text>
                </YStack>

                <Ionicons name={step.icon as any} size={28} color={theme.accent.val} />

                <Text fontWeight="bold" fontSize="$5" color="$color" textAlign="center">
                  {t(`landing.${step.key}Title` as any)}
                </Text>
                <Text fontSize="$3" color="$mutedText" lineHeight={22} textAlign="center">
                  {t(`landing.${step.key}Desc` as any)}
                </Text>
              </YStack>
            </SlideIn>
          ))}
        </View>
      </YStack>
    </YStack>
  )
}
