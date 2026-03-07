import { useEffect } from 'react'
import { Platform, View } from 'react-native'
import { YStack, XStack, Text, H1, useTheme } from 'tamagui'
import { useTranslation } from '@mvp/i18n'
import { APP_BRAND } from '@mvp/template-config/src/brand'
import { trackLandingCTA } from '@mvp/analytics'
import { FadeIn } from '../animations/FadeIn'
import { SlideIn } from '../animations/SlideIn'
import { ScalePress } from '../animations/ScalePress'

// Unsplash Lake Tahoe sunset by c6SciRp2kaQ — free to use
const HERO_BG_URL = 'https://images.unsplash.com/photo-1513875528452-39400945934d?w=1920&q=80&auto=format'

interface LandingHeroProps {
  onNavigate: (href: string) => void
}

export function LandingHero({ onNavigate }: LandingHeroProps) {
  const { t } = useTranslation()
  const theme = useTheme()

  useEffect(() => {
    if (Platform.OS !== 'web') return
    const style = document.createElement('style')
    style.textContent = `
      @keyframes heroPulseGlow {
        0%, 100% { box-shadow: 0 0 24px ${theme.accentGradientStart.val}50; }
        50% { box-shadow: 0 0 48px ${theme.accentGradientStart.val}70, 0 0 90px ${theme.accentGradientEnd.val}35; }
      }
      @keyframes heroBadgePulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.85; }
      }
      @keyframes heroKenBurns {
        0% { transform: scale(1.0); }
        100% { transform: scale(1.08); }
      }
      .hero-gradient-text {
        font-weight: 700 !important;
        background: linear-gradient(135deg,
          #ffffff,
          rgba(255,255,255,0.85),
          ${theme.accentGradientStart.val},
          ${theme.accentGradientEnd.val}
        ) !important;
        background-size: 200% auto !important;
        -webkit-background-clip: text !important;
        -webkit-text-fill-color: transparent !important;
        background-clip: text !important;
        letter-spacing: -0.03em;
        display: inline-block !important;
        padding-bottom: 8px !important;
        line-height: 1.12 !important;
      }
      @media (max-width: 768px) {
        .hero-gradient-text { font-size: 36px !important; line-height: 42px !important; }
        #hero-section { min-height: 60vh !important; padding-top: 40px !important; padding-bottom: 40px !important; }
      }
      @media (max-width: 480px) {
        .hero-gradient-text { font-size: 28px !important; line-height: 34px !important; }
      }
    `
    document.head.appendChild(style)
    return () => { document.head.removeChild(style) }
  }, [theme.accentGradientStart.val, theme.accentGradientEnd.val])

  if (Platform.OS !== 'web') return null

  return (
    <YStack
      nativeID="hero-section"
      paddingHorizontal="$5"
      alignItems="center"
      style={{
        paddingTop: 96,
        paddingBottom: 80,
        minHeight: '82vh',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
      } as any}
    >
      {/* Background photo with Ken Burns effect */}
      <View
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 0,
          animation: 'heroKenBurns 25s ease-in-out alternate infinite',
          willChange: 'transform',
          backgroundImage: `url(${HERO_BG_URL})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center 40%',
          backgroundRepeat: 'no-repeat',
        } as any}
      />

      {/* Dark overlay for text readability */}
      <View
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 1,
          background: `linear-gradient(
            180deg,
            rgba(0, 0, 0, 0.55) 0%,
            rgba(0, 0, 0, 0.40) 40%,
            rgba(0, 0, 0, 0.55) 100%
          )`,
          backdropFilter: 'blur(1px)',
        } as any}
      />

      {/* Subtle gradient accent overlay */}
      <View
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 2,
          background: `radial-gradient(ellipse 80% 60% at 50% 80%, ${theme.accentGradientStart.val}18 0%, transparent 70%)`,
          pointerEvents: 'none',
        } as any}
      />

      <YStack maxWidth={800} alignItems="center" gap="$5" zIndex={3}>
        {/* Badge */}
        <FadeIn>
          <XStack
            paddingHorizontal="$3"
            paddingVertical="$1.5"
            borderRadius={20}
            borderWidth={1}
            style={{
              backgroundColor: 'rgba(255,255,255,0.10)',
              borderColor: 'rgba(255,255,255,0.20)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              animation: 'heroBadgePulse 3s ease-in-out infinite',
            } as any}
          >
            <Text color="white" fontSize="$2" fontWeight="600" style={{ opacity: 0.9 } as any}>
              {t('landing.heroBadge')}
            </Text>
          </XStack>
        </FadeIn>

        {/* Headline */}
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
            color="rgba(255, 255, 255, 0.75)"
            maxWidth={600}
            style={{ textShadow: '0 1px 3px rgba(0,0,0,0.3)' } as any}
          >
            {t('landing.heroSubtitle')}
          </Text>
        </SlideIn>

        {/* CTA buttons */}
        <SlideIn from="bottom" delay={300}>
          <XStack gap="$3" flexWrap="wrap" justifyContent="center">
            <ScalePress onPress={() => { trackLandingCTA('primary'); onNavigate('/sign-up') }}>
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

            <ScalePress onPress={() => { trackLandingCTA('secondary'); window.open(APP_BRAND.ctaUrl, '_blank') }}>
              <XStack
                paddingHorizontal="$5"
                paddingVertical="$3"
                borderRadius="$4"
                borderWidth={1}
                alignItems="center"
                gap="$2"
                style={{
                  borderColor: 'rgba(255,255,255,0.25)',
                  backgroundColor: 'rgba(255,255,255,0.08)',
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                  transition: 'border-color 0.2s ease, background-color 0.2s ease',
                } as any}
              >
                <Text fontWeight="600" fontSize="$4" color="white">{t('landing.heroSecondaryCTA')}</Text>
              </XStack>
            </ScalePress>
          </XStack>
        </SlideIn>

        {/* Social proof */}
        <SlideIn from="bottom" delay={400}>
          <XStack gap="$4" flexWrap="wrap" justifyContent="center" opacity={0.8}>
            {(['heroSocialProof1', 'heroSocialProof2', 'heroSocialProof3'] as const).map((key) => (
              <XStack key={key} alignItems="center" gap="$1.5">
                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: 'white' }} />
                <Text fontSize="$2" color="rgba(255, 255, 255, 0.85)" fontWeight="500"
                  style={{ textShadow: '0 1px 2px rgba(0,0,0,0.3)' } as any}
                >
                  {t(`landing.${key}`)}
                </Text>
              </XStack>
            ))}
          </XStack>
        </SlideIn>
      </YStack>
    </YStack>
  )
}
