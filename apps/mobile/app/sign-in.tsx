import { useEffect } from 'react'
import { YStack, XStack, Text, H1, Separator } from 'tamagui'
import { Link, router } from 'expo-router'
import { useTranslation } from '@mvp/i18n'
import { FadeIn, SlideIn } from '@mvp/ui'
import { useAuthStore } from '@mvp/store'
import { SignInForm, AuthScreenLayout, GoogleSignInButton, isGoogleAuthEnabled } from '@mvp/auth'
import { useTemplateFlag } from '@mvp/template-config'

export default function SignInScreen() {
  const { t } = useTranslation()
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const googleAuthVisible = useTemplateFlag('googleAuth', isGoogleAuthEnabled)

  useEffect(() => {
    if (isAuthenticated) router.replace('/settings')
  }, [isAuthenticated])

  return (
    <AuthScreenLayout onGoBack={() => router.back()}>
      <FadeIn>
        <H1>{t('auth.signIn')}</H1>
      </FadeIn>

      <SignInForm />

      {googleAuthVisible && (
        <SlideIn from="bottom" delay={300}>
          <YStack width="100%" maxWidth={400} gap="$3">
            <XStack alignItems="center" gap="$3">
              <Separator flex={1} />
              <Text color="$mutedText" fontSize="$2">{t('auth.or')}</Text>
              <Separator flex={1} />
            </XStack>
            <GoogleSignInButton />
          </YStack>
        </SlideIn>
      )}

      <SlideIn from="bottom" delay={googleAuthVisible ? 400 : 300}>
        <Text color="$mutedText" textAlign="center">
          {t('auth.noAccount')}{' '}
          <Link href="/sign-up">
            <Text color="$primary" fontWeight="bold">
              {t('auth.createAccount')}
            </Text>
          </Link>
        </Text>
      </SlideIn>
    </AuthScreenLayout>
  )
}
