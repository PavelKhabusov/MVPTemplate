import { useState } from 'react'
import { YStack, Text } from 'tamagui'
import { useTranslation } from '@mvp/i18n'
import { AppButton, AppInput, FadeIn, SlideIn } from '@mvp/ui'
import { useAuth } from './AuthProvider'

interface ResetPasswordFormProps {
  token: string
}

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const { t } = useTranslation()
  const { authApi, onNavigateToSignIn } = useAuth()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const validate = () => {
    const errs: Record<string, string> = {}
    if (password.length < 8) errs.password = t('auth.validation.passwordMin')
    if (password !== confirmPassword) errs.confirmPassword = t('auth.validation.passwordsMismatch')
    return errs
  }

  const handleSubmit = async () => {
    const errs = validate()
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }
    setErrors({})
    setLoading(true)
    try {
      await authApi.resetPassword(token, password)
      setSuccess(true)
    } catch (err: any) {
      const message = err?.response?.data?.message
      if (err?.response?.status === 429) {
        setErrors({ form: t('auth.errorTooMany') })
      } else if (err?.response?.status === 400 || err?.response?.status === 410) {
        setErrors({ form: t('auth.invalidToken') })
      } else {
        setErrors({ form: message || t('common.error') })
      }
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <YStack gap="$4" width="100%" maxWidth={400} alignItems="center">
        <FadeIn>
          <Text color="$mutedText" textAlign="center" fontSize="$4">
            {t('auth.passwordResetSuccess')}
          </Text>
        </FadeIn>
        <SlideIn from="bottom" delay={100}>
          <AppButton onPress={onNavigateToSignIn}>
            {t('auth.backToSignIn')}
          </AppButton>
        </SlideIn>
      </YStack>
    )
  }

  return (
    <YStack gap="$3" width="100%" maxWidth={400}>
      <FadeIn>
        <AppInput
          label={t('auth.newPassword')}
          placeholder="********"
          value={password}
          onChangeText={(v) => { setPassword(v); setErrors((e) => { const { password: _, ...rest } = e; return rest }) }}
          secureTextEntry
          error={errors.password}
        />
      </FadeIn>

      <SlideIn from="bottom" delay={100}>
        <AppInput
          label={t('auth.confirmNewPassword')}
          placeholder="********"
          value={confirmPassword}
          onChangeText={(v) => { setConfirmPassword(v); setErrors((e) => { const { confirmPassword: _, ...rest } = e; return rest }) }}
          secureTextEntry
          error={errors.confirmPassword || errors.form}
        />
      </SlideIn>

      <SlideIn from="bottom" delay={200}>
        <AppButton loading={loading} onPress={handleSubmit} marginTop="$2">
          {t('auth.resetPassword')}
        </AppButton>
      </SlideIn>
    </YStack>
  )
}
