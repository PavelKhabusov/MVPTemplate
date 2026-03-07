import { useEffect } from 'react'
import { Image, Platform } from 'react-native'
import { YStack, XStack, Text, Separator, useTheme } from 'tamagui'
import { useTranslation } from '@mvp/i18n'
import { ScalePress } from '../animations/ScalePress'
import { useCompanyStore } from '@mvp/store'
import { APP_BRAND } from '@mvp/template-config/src/brand'

interface LandingFooterProps {
  onNavigate: (href: string) => void
  logo?: any
}

export function LandingFooter({ onNavigate, logo }: LandingFooterProps) {
  const { t } = useTranslation()
  const theme = useTheme()
  const company = useCompanyStore((s) => s.info)
  const appName = company.appName || APP_BRAND.name

  useEffect(() => {
    if (Platform.OS !== 'web') return
    const style = document.createElement('style')
    style.textContent = `
      @media (max-width: 768px) {
        .footer-col { min-width: 0 !important; }
        .footer-brand { min-width: 100% !important; }
      }
    `
    document.head.appendChild(style)
    return () => { document.head.removeChild(style) }
  }, [])

  if (Platform.OS !== 'web') return null

  return (
    <YStack
      paddingVertical="$8"
      paddingHorizontal="$5"
      backgroundColor="$subtleBackground"
      borderTopWidth={1}
      borderTopColor="$borderColor"
      alignItems="center"
    >
      <YStack maxWidth={1200} width="100%" gap="$8">
        {/* Columns */}
        <XStack flexWrap="wrap" gap="$8">
          {/* Brand */}
          <YStack className="footer-brand" gap="$3" style={{ minWidth: 240, flex: 1 } as any}>
            <XStack alignItems="center" gap="$2">
              {logo ? (
                <Image source={logo} style={{ width: 28, height: 28, borderRadius: 7 }} />
              ) : (
                <YStack
                  width={28}
                  height={28}
                  borderRadius={7}
                  alignItems="center"
                  justifyContent="center"
                  style={{
                    background: `linear-gradient(135deg, ${theme.accentGradientStart.val}, ${theme.accentGradientEnd.val})`,
                  } as any}
                >
                  <Text color="white" fontWeight="bold" fontSize={14}>M</Text>
                </YStack>
              )}
              <Text fontWeight="bold" fontSize="$4" color="$color">{appName}</Text>
            </XStack>
            <Text fontSize="$3" color="$mutedText" lineHeight={22} maxWidth={280}>
              {t('landing.footerDesc')}
            </Text>
          </YStack>

          {/* Product */}
          <YStack className="footer-col" gap="$3" style={{ minWidth: 160 } as any}>
            <Text fontWeight="bold" fontSize="$3" color="$color">
              {t('landing.footerProduct')}
            </Text>
            <FooterLink label={t('landing.footerFeatures')} onPress={() => {
              document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })
            }} />
            <FooterLink label={t('landing.footerChangelog')} onPress={() => {}} />
          </YStack>

          {/* Resources */}
          <YStack className="footer-col" gap="$3" style={{ minWidth: 160 } as any}>
            <Text fontWeight="bold" fontSize="$3" color="$color">
              {t('landing.footerResources')}
            </Text>
            <FooterLink label={t('landing.footerDocs')} onPress={() => onNavigate('/docs')} />
            <FooterLink label={t('landing.footerGitHub')} onPress={() => window.open(APP_BRAND.ctaUrl, '_blank')} />
          </YStack>

          {/* Legal */}
          <YStack className="footer-col" gap="$3" style={{ minWidth: 160 } as any}>
            <Text fontWeight="bold" fontSize="$3" color="$color">
              {t('landing.footerLegal')}
            </Text>
            <FooterLink label={t('settings.privacy')} onPress={() => onNavigate('/privacy')} />
            <FooterLink label={t('settings.terms')} onPress={() => onNavigate('/terms')} />
            <FooterLink label={t('landing.footerOffer')} onPress={() => onNavigate('/offer')} />
          </YStack>
        </XStack>

        <Separator />

        {/* Copyright */}
        <Text fontSize="$2" color="$mutedText" textAlign="center">
          &copy; {new Date().getFullYear()} {appName}. {t('landing.footerRights')}
        </Text>
      </YStack>
    </YStack>
  )
}

function FooterLink({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <ScalePress onPress={onPress}>
      <Text
        fontSize="$3"
        color="$mutedText"
        cursor="pointer"
        hoverStyle={{ color: '$color' } as any}
      >
        {label}
      </Text>
    </ScalePress>
  )
}
