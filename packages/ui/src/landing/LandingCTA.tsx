import { useEffect } from 'react'
import { Platform, View } from 'react-native'
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

  useEffect(() => {
    if (Platform.OS !== 'web') return
    const style = document.createElement('style')
    style.textContent = `
      @keyframes ctaBlobDrift1 {
        0%, 100% { transform: translate(0, 0) scale(1); }
        50% { transform: translate(-40px, 30px) scale(1.08); }
      }
      @keyframes ctaBlobDrift2 {
        0%, 100% { transform: translate(0, 0) scale(1); }
        50% { transform: translate(30px, -40px) scale(1.06); }
      }
      @media (max-width: 768px) {
        #cta-title { font-size: 28px !important; line-height: 36px !important; }
        #cta-section { padding: 64px 24px !important; }
      }
    `
    document.head.appendChild(style)
    return () => { document.head.removeChild(style) }
  }, [])

  if (Platform.OS !== 'web') return null

  return (
    <YStack
      nativeID="cta-section"
      paddingVertical="$14"
      paddingHorizontal="$5"
      alignItems="center"
      style={{
        position: 'relative',
        overflow: 'hidden',
        background: `
          radial-gradient(ellipse 80% 60% at 10% 20%, rgba(56,189,248,0.22) 0%, transparent 60%),
          radial-gradient(ellipse 70% 50% at 90% 80%, rgba(139,92,246,0.20) 0%, transparent 60%),
          radial-gradient(ellipse 60% 50% at 50% 50%, rgba(${theme.accentGradientStart.val.replace('#', '').match(/.{2}/g)?.map(h => parseInt(h, 16)).join(',') || '99,102,241'},0.15) 0%, transparent 70%)
        `,
      } as any}
    >
      {/* Background orbs */}
      <View style={{ position: 'absolute', inset: 0, pointerEvents: 'none' } as any}>
        <View style={{
          position: 'absolute', top: '-20%', left: '-10%',
          width: 500, height: 500, borderRadius: 250,
          background: `radial-gradient(circle, ${theme.accentGradientStart.val}25 0%, transparent 70%)`,
          animation: 'ctaBlobDrift1 16s ease-in-out infinite',
        } as any} />
        <View style={{
          position: 'absolute', bottom: '-20%', right: '-10%',
          width: 450, height: 450, borderRadius: 225,
          background: `radial-gradient(circle, ${theme.accentGradientEnd.val}22 0%, transparent 70%)`,
          animation: 'ctaBlobDrift2 20s ease-in-out infinite',
        } as any} />
      </View>

      <SlideIn from="bottom">
        <YStack maxWidth={640} alignItems="center" gap="$5" zIndex={1}>
          {/* Badge */}
          <XStack
            paddingHorizontal="$3" paddingVertical="$1.5" borderRadius={20}
            borderWidth={1}
            style={{
              borderColor: `${theme.accentGradientStart.val}40`,
              backgroundColor: `${theme.accentGradientStart.val}12`,
            } as any}
          >
            <Text fontSize="$2" fontWeight="600" color="$accent">
              {t('landing.ctaBadge' as any) || 'Get started today'}
            </Text>
          </XStack>

          <Text
            nativeID="cta-title"
            fontWeight="bold" fontSize={50} color="$color"
            textAlign="center" lineHeight={58}
            style={{ letterSpacing: '-0.01em', fontFamily: "'Caveat', 'Yomogi', cursive" } as any}
          >
            {t('landing.ctaTitle')}
          </Text>
          <Text fontSize="$4" color="$mutedText" textAlign="center" lineHeight={28}>
            {t('landing.ctaSubtitle')}
          </Text>

          <XStack gap="$3" marginTop="$2" flexWrap="wrap" justifyContent="center">
            <ScalePress onPress={() => onNavigate('/sign-up')}>
              <XStack
                paddingHorizontal="$6" paddingVertical="$3.5" borderRadius={14}
                style={{
                  background: `linear-gradient(135deg, ${theme.accentGradientStart.val}, ${theme.accentGradientEnd.val})`,
                  boxShadow: `0 8px 32px ${theme.accentGradientStart.val}40`,
                } as any}
              >
                <Text fontWeight="bold" fontSize="$4" color="white">
                  {t('landing.ctaPrimary')}
                </Text>
              </XStack>
            </ScalePress>

            <ScalePress onPress={() => onNavigate('/docs')}>
              <XStack
                paddingHorizontal="$6" paddingVertical="$3.5" borderRadius={14}
                borderWidth={1} borderColor="$borderColor"
                backgroundColor="$cardBackground"
                style={{ backdropFilter: 'blur(8px)' } as any}
              >
                <Text fontWeight="600" fontSize="$4" color="$color">
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
