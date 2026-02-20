import { YStack, Text, H1 } from 'tamagui'
import { Link } from 'expo-router'
import { useTranslation } from '@mvp/i18n'
import { FadeIn, SlideIn } from '@mvp/ui'
import { SignInForm } from '../src/features/auth/SignInForm'

export default function SignInScreen() {
  const { t } = useTranslation()

  return (
    <YStack flex={1} alignItems="center" justifyContent="center" padding="$4" gap="$6" backgroundColor="$background">
      <FadeIn>
        <H1>{t('auth.signIn')}</H1>
      </FadeIn>

      <SignInForm />

      <SlideIn from="bottom" delay={300}>
        <Text color="$mutedText" textAlign="center">
          {t('auth.noAccount')}{' '}
          <Link href="/sign-up">
            <Text color="$primary" fontWeight="bold">
              {t('auth.createAccount')}
            </Text>
          </Link>
        </Text>
      </SlideIn>
    </YStack>
  )
}
