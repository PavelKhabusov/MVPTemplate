import { useEffect } from 'react'
import { YStack, Text, H1 } from 'tamagui'
import { Link, router } from 'expo-router'
import { useTranslation } from '@mvp/i18n'
import { FadeIn, SlideIn } from '@mvp/ui'
import { useAuthStore } from '@mvp/store'
import { ForgotPasswordForm, AuthScreenLayout } from '@mvp/auth'

export default function ForgotPasswordScreen() {
  const { t } = useTranslation()
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  useEffect(() => {
    if (isAuthenticated) router.replace('/settings')
  }, [isAuthenticated])

  return (
    <AuthScreenLayout onGoBack={() => router.back()}>
      <FadeIn>
        <YStack alignItems="center" gap="$2">
          <H1>{t('auth.forgotPasswordTitle')}</H1>
          <Text color="$mutedText" textAlign="center" maxWidth={300}>
            {t('auth.forgotPasswordSubtitle')}
          </Text>
        </YStack>
      </FadeIn>

      <ForgotPasswordForm />

      <SlideIn from="bottom" delay={200}>
        <Link href="/sign-in">
          <Text color="$primary" fontWeight="bold">
            {t('auth.backToSignIn')}
          </Text>
        </Link>
      </SlideIn>
    </AuthScreenLayout>
  )
}
