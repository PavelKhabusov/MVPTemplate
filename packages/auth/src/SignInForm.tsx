import { useState } from 'react'
import { YStack, Text } from 'tamagui'
import { useTranslation } from '@mvp/i18n'
import { useAuthStore } from '@mvp/store'
import { AppButton, AppInput, FadeIn, SlideIn } from '@mvp/ui'
import { trackSignIn, trackSignInError } from '@mvp/analytics'
import { useAuth } from './AuthProvider'

function getErrorMessage(err: any, t: (key: string) => string): string {
  if (!err?.response) return t('auth.errorNetwork')
  const status = err.response.status
  const message = err.response.data?.message
  if (status === 401) return t('auth.errorInvalidCredentials')
  if (status === 429) return t('auth.errorTooMany')
  if (message) return message
  return t('common.error')
}

export function SignInForm() {
  const { t } = useTranslation()
  const { authApi, onAuthSuccess, onNavigateToForgotPassword } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    setError('')
    setLoading(true)
    try {
      await authApi.login({ email, password })
      trackSignIn('email')
      onAuthSuccess()
    } catch (err: any) {
      const msg = getErrorMessage(err, t)
      trackSignInError('email', msg)
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <YStack gap="$3" width="100%" maxWidth={400}>
      <FadeIn>
        <AppInput
          label={t('auth.email')}
          placeholder="email@example.com"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          error={error ? ' ' : undefined}
        />
      </FadeIn>

      <SlideIn from="bottom" delay={100}>
        <YStack gap="$1.5">
          <AppInput
            label={t('auth.password')}
            placeholder="********"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            error={error || undefined}
          />
          {useAuthStore.getState().user?.emailEnabled !== false && (
            <Text
              color="$accent"
              fontSize="$2"
              textAlign="right"
              cursor="pointer"
              onPress={onNavigateToForgotPassword}
            >
              {t('auth.forgotPassword')}
            </Text>
          )}
        </YStack>
      </SlideIn>

      <SlideIn from="bottom" delay={200}>
        <AppButton loading={loading} onPress={handleSubmit} marginTop="$2">
          {t('auth.signIn')}
        </AppButton>
      </SlideIn>
    </YStack>
  )
}
