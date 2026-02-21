import { Platform } from 'react-native'
import { YStack, XStack, Text, H1, useTheme } from 'tamagui'
import { useTranslation } from '@mvp/i18n'
import { FadeIn } from '../animations/FadeIn'
import { SlideIn } from '../animations/SlideIn'
import { ScalePress } from '../animations/ScalePress'

interface LandingHeroProps {
  onNavigate: (href: string) => void
}

export function LandingHero({ onNavigate }: LandingHeroProps) {
  const { t } = useTranslation()
  const theme = useTheme()

  if (Platform.OS !== 'web') return null

  return (
    <YStack
      paddingVertical="$10"
      paddingHorizontal="$5"
      alignItems="center"
      style={{
        background: `radial-gradient(ellipse at 50% 0%, ${theme.accentGradientStart.val}18 0%, transparent 70%)`,
        minHeight: '80vh',
        justifyContent: 'center',
      } as any}
    >
      <YStack maxWidth={800} alignItems="center" gap="$5">
        {/* Badge */}
        <FadeIn>
          <XStack
            backgroundColor={`${theme.accent.val}15`}
            paddingHorizontal="$3"
            paddingVertical="$1.5"
            borderRadius={20}
            borderWidth={1}
            borderColor={`${theme.accent.val}30`}
          >
            <Text color="$accent" fontSize="$2" fontWeight="600">
              {t('landing.heroBadge')}
            </Text>
          </XStack>
        </FadeIn>

        {/* Headline */}
        <SlideIn from="bottom" delay={100}>
          <H1
            textAlign="center"
            fontSize={52}
            lineHeight={60}
            fontWeight="bold"
            color="$color"
            style={{
              letterSpacing: '-0.02em',
            } as any}
          >
            {t('landing.heroTitle')}
          </H1>
        </SlideIn>

        {/* Subtitle */}
        <SlideIn from="bottom" delay={200}>
          <Text
            textAlign="center"
            fontSize="$5"
            lineHeight={28}
            color="$mutedText"
            maxWidth={600}
          >
            {t('landing.heroSubtitle')}
          </Text>
        </SlideIn>

        {/* CTA buttons */}
        <SlideIn from="bottom" delay={300}>
          <XStack gap="$3" flexWrap="wrap" justifyContent="center">
            <ScalePress onPress={() => onNavigate('/sign-up')}>
              <XStack
                paddingHorizontal="$5"
                paddingVertical="$3"
                borderRadius="$4"
                alignItems="center"
                gap="$2"
                style={{
                  background: `linear-gradient(135deg, ${theme.accentGradientStart.val}, ${theme.accentGradientEnd.val})`,
                } as any}
              >
                <Text color="white" fontWeight="bold" fontSize="$4">{t('landing.heroCTA')}</Text>
              </XStack>
            </ScalePress>

            <ScalePress onPress={() => window.open('https://github.com/PavelKhabusov/MVPTemplate', '_blank')}>
              <XStack
                paddingHorizontal="$5"
                paddingVertical="$3"
                borderRadius="$4"
                borderWidth={1}
                borderColor="$borderColor"
                alignItems="center"
                gap="$2"
                backgroundColor="$cardBackground"
              >
                <Text fontWeight="600" fontSize="$4" color="$color">{t('landing.heroSecondaryCTA')}</Text>
              </XStack>
            </ScalePress>
          </XStack>
        </SlideIn>


      </YStack>
    </YStack>
  )
}
