import { Platform } from 'react-native'
import { YStack, XStack, Text, useTheme } from 'tamagui'
import { useTranslation } from '@mvp/i18n'
import { SlideIn } from '../animations/SlideIn'
import { ScalePress } from '../animations/ScalePress'

interface LandingCTAProps {
  onNavigate: (href: string) => void
}

export function LandingCTA({ onNavigate }: LandingCTAProps) {
  const { t } = useTranslation()
  const theme = useTheme()

  if (Platform.OS !== 'web') return null

  return (
    <YStack
      paddingVertical="$10"
      paddingHorizontal="$5"
      alignItems="center"
      style={{
        background: `linear-gradient(135deg, ${theme.accentGradientStart.val}, ${theme.accentGradientEnd.val})`,
      } as any}
    >
      <SlideIn from="bottom">
        <YStack maxWidth={600} alignItems="center" gap="$4">
          <Text fontWeight="bold" fontSize={36} color="white" textAlign="center">
            {t('landing.ctaTitle')}
          </Text>
          <Text fontSize="$4" color="white" textAlign="center" opacity={0.85}>
            {t('landing.ctaSubtitle')}
          </Text>

          <XStack gap="$3" marginTop="$3" flexWrap="wrap" justifyContent="center">
            <ScalePress onPress={() => onNavigate('/sign-up')}>
              <XStack
                backgroundColor="white"
                paddingHorizontal="$5"
                paddingVertical="$3"
                borderRadius="$4"
              >
                <Text fontWeight="bold" fontSize="$4" color={theme.accentGradientStart.val}>
                  {t('landing.ctaPrimary')}
                </Text>
              </XStack>
            </ScalePress>

            <ScalePress onPress={() => onNavigate('/privacy')}>
              <XStack
                paddingHorizontal="$5"
                paddingVertical="$3"
                borderRadius="$4"
                borderWidth={2}
                borderColor="rgba(255,255,255,0.4)"
              >
                <Text fontWeight="600" fontSize="$4" color="white">
                  {t('landing.ctaSecondary')}
                </Text>
              </XStack>
            </ScalePress>
          </XStack>
        </YStack>
      </SlideIn>
    </YStack>
  )
}
