import { Platform } from 'react-native'
import { YStack, XStack, Text, Separator, useTheme } from 'tamagui'
import { useTranslation } from '@mvp/i18n'
import { ScalePress } from '../animations/ScalePress'

interface LandingFooterProps {
  onNavigate: (href: string) => void
}

export function LandingFooter({ onNavigate }: LandingFooterProps) {
  const { t } = useTranslation()
  const theme = useTheme()

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
          <YStack gap="$3" style={{ minWidth: 240, flex: 1 } as any}>
            <XStack alignItems="center" gap="$2">
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
              <Text fontWeight="bold" fontSize="$4" color="$color">MVPTemplate</Text>
            </XStack>
            <Text fontSize="$3" color="$mutedText" lineHeight={22} maxWidth={280}>
              {t('landing.footerDesc')}
            </Text>
          </YStack>

          {/* Product */}
          <YStack gap="$3" style={{ minWidth: 160 } as any}>
            <Text fontWeight="bold" fontSize="$3" color="$color">
              {t('landing.footerProduct')}
            </Text>
            <FooterLink label={t('landing.footerFeatures')} onPress={() => {
              document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })
            }} />
            <FooterLink label={t('landing.footerChangelog')} onPress={() => {}} />
          </YStack>

          {/* Resources */}
          <YStack gap="$3" style={{ minWidth: 160 } as any}>
            <Text fontWeight="bold" fontSize="$3" color="$color">
              {t('landing.footerResources')}
            </Text>
            <FooterLink label={t('landing.footerDocs')} onPress={() => {}} />
            <FooterLink label={t('landing.footerGitHub')} onPress={() => window.open('https://github.com', '_blank')} />
            <FooterLink label={t('landing.footerCommunity')} onPress={() => {}} />
          </YStack>

          {/* Legal */}
          <YStack gap="$3" style={{ minWidth: 160 } as any}>
            <Text fontWeight="bold" fontSize="$3" color="$color">
              {t('landing.footerLegal')}
            </Text>
            <FooterLink label={t('settings.privacy')} onPress={() => onNavigate('/privacy')} />
            <FooterLink label={t('settings.terms')} onPress={() => {}} />
          </YStack>
        </XStack>

        <Separator />

        {/* Copyright */}
        <Text fontSize="$2" color="$mutedText" textAlign="center">
          &copy; {new Date().getFullYear()} MVPTemplate. {t('landing.footerRights')}
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
