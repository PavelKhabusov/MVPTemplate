import { useEffect } from 'react'
import { Platform, View } from 'react-native'
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

  // Inject CSS keyframes for hero animations
  useEffect(() => {
    if (Platform.OS !== 'web') return
    const style = document.createElement('style')
    style.textContent = `
      @keyframes heroGradientShift {
        0% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
        100% { background-position: 0% 50%; }
      }
      @keyframes heroFloat1 {
        0%, 100% { transform: translateY(0) rotate(0deg); }
        50% { transform: translateY(-20px) rotate(8deg); }
      }
      @keyframes heroFloat2 {
        0%, 100% { transform: translateY(0) rotate(0deg); }
        50% { transform: translateY(-30px) rotate(-6deg); }
      }
      @keyframes heroFloat3 {
        0%, 100% { transform: translateY(0) scale(1); }
        50% { transform: translateY(-15px) scale(1.1); }
      }
      @keyframes heroPulseGlow {
        0%, 100% { box-shadow: 0 0 20px ${theme.accentGradientStart.val}40; }
        50% { box-shadow: 0 0 40px ${theme.accentGradientStart.val}60, 0 0 80px ${theme.accentGradientEnd.val}30; }
      }
      @keyframes heroBadgePulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.7; }
      }
      .hero-gradient-text {
        background: linear-gradient(90deg, ${theme.accentGradientStart.val}, ${theme.accentGradientEnd.val}, ${theme.accent.val}, ${theme.accentGradientStart.val}) !important;
        background-size: 200% auto !important;
        -webkit-background-clip: text !important;
        -webkit-text-fill-color: transparent !important;
        background-clip: text !important;
        animation: heroGradientShift 4s ease-in-out infinite;
        letter-spacing: -0.02em;
      }
    `
    document.head.appendChild(style)
    return () => { document.head.removeChild(style) }
  }, [theme.accentGradientStart.val, theme.accentGradientEnd.val])

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
        position: 'relative',
        overflow: 'hidden',
      } as any}
    >
      {/* Floating decorative elements */}
      <View
        style={{
          position: 'absolute', top: '15%', left: '10%',
          width: 60, height: 60, borderRadius: 16, opacity: 0.12,
          background: `linear-gradient(135deg, ${theme.accentGradientStart.val}, ${theme.accentGradientEnd.val})`,
          animation: 'heroFloat1 6s ease-in-out infinite',
          pointerEvents: 'none',
        } as any}
      />
      <View
        style={{
          position: 'absolute', top: '60%', right: '8%',
          width: 40, height: 40, borderRadius: 40, opacity: 0.1,
          background: `linear-gradient(135deg, ${theme.accentGradientEnd.val}, ${theme.accentGradientStart.val})`,
          animation: 'heroFloat2 8s ease-in-out infinite',
          pointerEvents: 'none',
        } as any}
      />
      <View
        style={{
          position: 'absolute', top: '30%', right: '20%',
          width: 24, height: 24, borderRadius: 6, opacity: 0.08,
          background: theme.accent.val,
          animation: 'heroFloat3 5s ease-in-out infinite',
          pointerEvents: 'none',
        } as any}
      />
      <View
        style={{
          position: 'absolute', bottom: '20%', left: '15%',
          width: 32, height: 32, borderRadius: 32, opacity: 0.1,
          background: theme.accentGradientEnd.val,
          animation: 'heroFloat2 7s ease-in-out infinite 1s',
          pointerEvents: 'none',
        } as any}
      />
      <View
        style={{
          position: 'absolute', top: '45%', left: '5%',
          width: 18, height: 18, borderRadius: 4, opacity: 0.06,
          background: theme.accentGradientStart.val,
          animation: 'heroFloat1 9s ease-in-out infinite 2s',
          pointerEvents: 'none',
        } as any}
      />

      <YStack maxWidth={800} alignItems="center" gap="$5" zIndex={1}>
        {/* Badge */}
        <FadeIn>
          <XStack
            backgroundColor={`${theme.accent.val}15`}
            paddingHorizontal="$3"
            paddingVertical="$1.5"
            borderRadius={20}
            borderWidth={1}
            borderColor={`${theme.accent.val}30`}
            style={{ animation: 'heroBadgePulse 3s ease-in-out infinite' } as any}
          >
            <Text color="$accent" fontSize="$2" fontWeight="600">
              {t('landing.heroBadge')}
            </Text>
          </XStack>
        </FadeIn>

        {/* Headline with animated gradient */}
        <SlideIn from="bottom" delay={100}>
          <H1
            textAlign="center"
            fontSize={52}
            lineHeight={60}
            fontWeight="bold"
            className="hero-gradient-text"
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
                  animation: 'heroPulseGlow 3s ease-in-out infinite',
                  transition: 'transform 0.2s ease',
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
                style={{ transition: 'border-color 0.2s ease' } as any}
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
