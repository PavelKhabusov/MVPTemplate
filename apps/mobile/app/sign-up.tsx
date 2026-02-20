import { YStack, Text, H1 } from 'tamagui'
import { Link } from 'expo-router'
import { useTranslation } from '@mvp/i18n'
import { FadeIn, SlideIn } from '@mvp/ui'
import { SignUpForm } from '../src/features/auth/SignUpForm'

export default function SignUpScreen() {
  const { t } = useTranslation()

  return (
    <YStack flex={1} alignItems="center" justifyContent="center" padding="$4" gap="$6">
      <FadeIn>
        <H1>{t('auth.signUp')}</H1>
      </FadeIn>

      <SignUpForm />

      <SlideIn from="bottom" delay={500}>
        <Text color="$mutedText" textAlign="center">
          {t('auth.hasAccount')}{' '}
          <Link href="/sign-in">
            <Text color="$primary" fontWeight="bold">
              {t('auth.signIn')}
            </Text>
          </Link>
        </Text>
      </SlideIn>
    </YStack>
  )
}
