import { useState } from 'react'
import { YStack } from 'tamagui'
import { router } from 'expo-router'
import { useTranslation } from '@mvp/i18n'
import { AppButton, AppInput, FadeIn, SlideIn } from '@mvp/ui'
import { authApi } from './auth.service'

function getErrorMessage(err: any, t: (key: string) => string): string {
  if (!err?.response) return t('auth.errorNetwork')
  const status = err.response.status
  const message = err.response.data?.message
  if (status === 409) return t('auth.errorEmailExists')
  if (status === 429) return t('auth.errorTooMany')
  if (message) return message
  return t('common.error')
}

export function SignUpForm() {
  const { t } = useTranslation()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  const validate = () => {
    const errs: Record<string, string> = {}
    if (!name.trim()) errs.name = t('auth.validation.nameRequired')
    if (!email.trim()) errs.email = t('auth.validation.emailRequired')
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
      await authApi.register({ email, password, name })
      router.replace('/')
    } catch (err: any) {
      setErrors({ form: getErrorMessage(err, t) })
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
          onChangeText={(v) => { setName(v); setErrors((e) => { const { name: _, ...rest } = e; return rest }) }}
          error={errors.name}
        />
      </FadeIn>

      <SlideIn from="bottom" delay={100}>
        <AppInput
          label={t('auth.email')}
          placeholder="email@example.com"
          value={email}
          onChangeText={(v) => { setEmail(v); setErrors((e) => { const { email: _, ...rest } = e; return rest }) }}
          keyboardType="email-address"
          autoCapitalize="none"
          error={errors.email}
        />
      </SlideIn>

      <SlideIn from="bottom" delay={200}>
        <AppInput
          label={t('auth.password')}
          placeholder="********"
          value={password}
          onChangeText={(v) => { setPassword(v); setErrors((e) => { const { password: _, ...rest } = e; return rest }) }}
          secureTextEntry
          error={errors.password}
        />
      </SlideIn>

      <SlideIn from="bottom" delay={300}>
        <AppInput
          label={t('auth.confirmPassword')}
          placeholder="********"
          value={confirmPassword}
          onChangeText={(v) => { setConfirmPassword(v); setErrors((e) => { const { confirmPassword: _, ...rest } = e; return rest }) }}
          secureTextEntry
          error={errors.confirmPassword || errors.form}
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
