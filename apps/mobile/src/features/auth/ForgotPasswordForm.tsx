import { useState } from 'react'
import { YStack, Text } from 'tamagui'
import { useTranslation } from '@mvp/i18n'
import { AppButton, AppInput, FadeIn, SlideIn } from '@mvp/ui'
import { authApi } from '../../services/auth'

export function ForgotPasswordForm() {
  const { t } = useTranslation()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async () => {
    if (!email.trim()) {
      setError(t('auth.validation.emailRequired'))
      return
    }
    setError('')
    setLoading(true)
    try {
      await authApi.requestPasswordReset(email)
      setSent(true)
    } catch (err: any) {
      const message = err?.response?.data?.message
      if (err?.response?.status === 429) {
        setError(t('auth.errorTooMany'))
      } else {
        setError(message || t('common.error'))
      }
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <YStack gap="$4" width="100%" maxWidth={400} alignItems="center">
        <FadeIn>
          <Text color="$mutedText" textAlign="center" fontSize="$4">
            {t('auth.resetLinkSent')}
          </Text>
        </FadeIn>
      </YStack>
    )
  }

  return (
    <YStack gap="$3" width="100%" maxWidth={400}>
      <FadeIn>
        <AppInput
          label={t('auth.email')}
          placeholder="email@example.com"
          value={email}
          onChangeText={(v) => { setEmail(v); setError('') }}
          keyboardType="email-address"
          autoCapitalize="none"
          error={error || undefined}
        />
      </FadeIn>

      <SlideIn from="bottom" delay={100}>
        <AppButton loading={loading} onPress={handleSubmit} marginTop="$2">
          {t('auth.sendResetLink')}
        </AppButton>
      </SlideIn>
    </YStack>
  )
}
