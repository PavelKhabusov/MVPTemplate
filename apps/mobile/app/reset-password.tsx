import { useEffect } from 'react'
import { YStack, Text, H1 } from 'tamagui'
import { router, useLocalSearchParams } from 'expo-router'
import { useTranslation } from '@mvp/i18n'
import { FadeIn } from '@mvp/ui'
import { useAuthStore } from '@mvp/store'
import { ResetPasswordForm, AuthScreenLayout } from '@mvp/auth'

export default function ResetPasswordScreen() {
  const { t } = useTranslation()
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const { token } = useLocalSearchParams<{ token: string }>()

  useEffect(() => {
    if (isAuthenticated) router.replace('/settings')
  }, [isAuthenticated])

  return (
    <AuthScreenLayout onGoBack={() => router.back()}>
      <FadeIn>
        <H1>{t('auth.resetPassword')}</H1>
      </FadeIn>

      {token ? (
        <ResetPasswordForm token={token} />
      ) : (
        <FadeIn>
          <Text color="$mutedText" textAlign="center">
            {t('auth.invalidToken')}
          </Text>
        </FadeIn>
      )}
    </AuthScreenLayout>
  )
}
