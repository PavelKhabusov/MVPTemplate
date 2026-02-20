import { useState } from 'react'
import { YStack } from 'tamagui'
import { useTranslation } from '@mvp/i18n'
import { AppButton, AppInput, FadeIn, SlideIn } from '@mvp/ui'
import { authApi } from './auth.service'

export function SignUpForm() {
  const { t } = useTranslation()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)
    try {
      await authApi.register({ email, password, name })
    } catch (err: any) {
      setError(err?.response?.data?.message ?? t('common.error'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <YStack gap="$3" width="100%" maxWidth={400}>
      <FadeIn>
        <AppInput
          label={t('auth.name')}
          placeholder="John Doe"
          value={name}
          onChangeText={setName}
        />
      </FadeIn>

      <SlideIn from="bottom" delay={100}>
        <AppInput
          label={t('auth.email')}
          placeholder="email@example.com"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </SlideIn>

      <SlideIn from="bottom" delay={200}>
        <AppInput
          label={t('auth.password')}
          placeholder="********"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
      </SlideIn>

      <SlideIn from="bottom" delay={300}>
        <AppInput
          label={t('auth.confirmPassword')}
          placeholder="********"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          error={error || undefined}
        />
      </SlideIn>

      <SlideIn from="bottom" delay={400}>
        <AppButton loading={loading} onPress={handleSubmit} marginTop="$2">
          {t('auth.createAccount')}
        </AppButton>
      </SlideIn>
    </YStack>
  )
}
