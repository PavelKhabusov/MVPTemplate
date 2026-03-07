import { useEffect } from 'react'
import { Platform, View } from 'react-native'
import { YStack, XStack, Text, H1, useTheme } from 'tamagui'
import { useTranslation } from '@mvp/i18n'
import { APP_BRAND } from '@mvp/template-config/src/brand'
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
        0%, 100% { box-shadow: 0 0 24px ${theme.accentGradientStart.val}50; }
        50% { box-shadow: 0 0 48px ${theme.accentGradientStart.val}70, 0 0 90px ${theme.accentGradientEnd.val}35; }
      }
      @keyframes heroBadgePulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.7; }
      }
      @keyframes heroBlobDrift1 {
        0%, 100% { transform: translate(0, 0) scale(1); }
        33% { transform: translate(50px, -70px) scale(1.06); }
        66% { transform: translate(-35px, 40px) scale(0.94); }
      }
      @keyframes heroBlobDrift2 {
        0%, 100% { transform: translate(0, 0) scale(1); }
        40% { transform: translate(-60px, 50px) scale(1.08); }
        80% { transform: translate(30px, -30px) scale(0.96); }
      }
      @keyframes heroBlobDrift3 {
        0%, 100% { transform: translate(0, 0) scale(1); }
        50% { transform: translate(40px, -50px) scale(1.05); }
      }
      .hero-gradient-text {
        background: linear-gradient(90deg,
          #38bdf8,
          ${theme.accentGradientStart.val},
          #a78bfa,
          #f472b6,
          ${theme.accentGradientEnd.val},
          #38bdf8
        ) !important;
        background-size: 300% auto !important;
        -webkit-background-clip: text !important;
        -webkit-text-fill-color: transparent !important;
        background-clip: text !important;
        animation: heroGradientShift 6s ease-in-out infinite;
        letter-spacing: -0.03em;
      }
      .hero-dot-grid {
        background-image: radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0);
        background-size: 44px 44px;
        opacity: 0.045;
        color: ${theme.color.val};
      }
      @media (max-width: 768px) {
        #hero-floats { display: none !important; }
        .hero-gradient-text { font-size: 36px !important; line-height: 42px !important; letter-spacing: -0.02em !important; }
        #hero-section { min-height: 60vh !important; padding-top: 40px !important; padding-bottom: 40px !important; }
      }
      @media (max-width: 480px) {
        .hero-gradient-text { font-size: 28px !important; line-height: 34px !important; }
      }
    `
    document.head.appendChild(style)
    return () => { document.head.removeChild(style) }
  }, [theme.accentGradientStart.val, theme.accentGradientEnd.val, theme.color.val])

  if (Platform.OS !== 'web') return null

  return (
    <YStack
      nativeID="hero-section"
      paddingVertical="$10"
      paddingHorizontal="$5"
      alignItems="center"
      style={{
        background: `
          radial-gradient(ellipse 75% 55% at 15% 15%, rgba(56,189,248,0.14) 0%, transparent 65%),
          radial-gradient(ellipse 65% 50% at 88% 8%, rgba(139,92,246,0.12) 0%, transparent 65%),
          radial-gradient(ellipse 55% 40% at 50% 100%, rgba(251,146,60,0.09) 0%, transparent 65%)
        `,
        minHeight: '88vh',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
      } as any}
    >
      {/* Dot grid background */}
      <View
        className="hero-dot-grid"
        style={{ position: 'absolute', inset: 0, pointerEvents: 'none' } as any}
      />

      {/* Large animated blobs (Dodo/OpenAI style) */}
      <View nativeID="hero-floats" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' } as any}>
        {/* Cyan blob - top left */}
        <View style={{
          position: 'absolute', top: '-15%', left: '-12%',
          width: 700, height: 700, borderRadius: 350,
          background: 'radial-gradient(circle, rgba(56,189,248,0.18) 0%, transparent 70%)',
          animation: 'heroBlobDrift1 18s ease-in-out infinite',
          pointerEvents: 'none',
        } as any} />
        {/* Purple blob - top right */}
        <View style={{
          position: 'absolute', top: '-10%', right: '-15%',
          width: 650, height: 650, borderRadius: 325,
          background: 'radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)',
          animation: 'heroBlobDrift2 22s ease-in-out infinite',
          pointerEvents: 'none',
        } as any} />
        {/* Amber blob - bottom center */}
        <View style={{
          position: 'absolute', bottom: '-25%', left: '25%',
          width: 550, height: 550, borderRadius: 275,
          background: 'radial-gradient(circle, rgba(251,146,60,0.11) 0%, transparent 70%)',
          animation: 'heroBlobDrift3 26s ease-in-out infinite',
          pointerEvents: 'none',
        } as any} />

        {/* Small floating accents */}
        <View style={{
          position: 'absolute', top: '22%', left: '12%',
          width: 56, height: 56, borderRadius: 14, opacity: 0.15,
          background: `linear-gradient(135deg, ${theme.accentGradientStart.val}, ${theme.accentGradientEnd.val})`,
          animation: 'heroFloat1 6s ease-in-out infinite',
          pointerEvents: 'none',
        } as any} />
        <View style={{
          position: 'absolute', top: '62%', right: '9%',
          width: 38, height: 38, borderRadius: 38, opacity: 0.13,
          background: `linear-gradient(135deg, ${theme.accentGradientEnd.val}, ${theme.accentGradientStart.val})`,
          animation: 'heroFloat2 8s ease-in-out infinite',
          pointerEvents: 'none',
        } as any} />
        <View style={{
          position: 'absolute', top: '32%', right: '22%',
          width: 22, height: 22, borderRadius: 6, opacity: 0.1,
          background: theme.accent.val,
          animation: 'heroFloat3 5s ease-in-out infinite',
          pointerEvents: 'none',
        } as any} />
        <View style={{
          position: 'absolute', bottom: '22%', left: '17%',
          width: 30, height: 30, borderRadius: 30, opacity: 0.12,
          background: theme.accentGradientEnd.val,
          animation: 'heroFloat2 7s ease-in-out infinite 1s',
          pointerEvents: 'none',
        } as any} />
      </View>

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
            fontSize={60}
            lineHeight={68}
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

            <ScalePress onPress={() => window.open(APP_BRAND.ctaUrl, '_blank')}>
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
