import { useEffect, useState } from 'react'
import { ActivityIndicator, TouchableOpacity } from 'react-native'
import { YStack, Text, H1, useTheme } from 'tamagui'
import { router, useLocalSearchParams } from 'expo-router'
import { useTranslation } from '@mvp/i18n'
import { AppButton, FadeIn } from '@mvp/ui'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { authApi } from '../src/services/auth'

export default function VerifyEmailScreen() {
  const { t } = useTranslation()
  const theme = useTheme()
  const insets = useSafeAreaInsets()
  const { token } = useLocalSearchParams<{ token: string }>()
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'idle'>(
    token ? 'loading' : 'idle'
  )

  useEffect(() => {
    if (!token) return
    authApi.verifyEmail(token)
      .then(() => setStatus('success'))
      .catch(() => setStatus('error'))
  }, [token])

  return (
    <YStack flex={1} backgroundColor="$background">
      <TouchableOpacity
        onPress={() => router.back()}
        style={{ position: 'absolute', top: insets.top + 8, left: 8, padding: 8, zIndex: 1 }}
      >
        <Ionicons name="arrow-back" size={24} color={theme.color.val} />
      </TouchableOpacity>

      <YStack flex={1} justifyContent="center" alignItems="center" padding="$5" gap="$4">
        {status === 'loading' && (
          <ActivityIndicator size="large" color={theme.primary.val} />
        )}

        {status === 'success' && (
          <FadeIn>
            <YStack alignItems="center" gap="$4">
              <Ionicons name="checkmark-circle" size={64} color={theme.primary.val} />
              <H1 textAlign="center">{t('auth.emailVerified')}</H1>
              <AppButton onPress={() => router.replace('/')}>
                {t('common.done')}
              </AppButton>
            </YStack>
          </FadeIn>
        )}

        {status === 'error' && (
          <FadeIn>
            <YStack alignItems="center" gap="$4">
              <Ionicons name="close-circle" size={64} color="red" />
              <Text color="$mutedText" textAlign="center" fontSize="$4">
                {t('auth.invalidToken')}
              </Text>
              <AppButton onPress={() => router.replace('/sign-in')}>
                {t('auth.backToSignIn')}
              </AppButton>
            </YStack>
          </FadeIn>
        )}

        {status === 'idle' && (
          <FadeIn>
            <YStack alignItems="center" gap="$4">
              <Ionicons name="mail-outline" size={64} color={theme.primary.val} />
              <H1 textAlign="center">{t('auth.verifyEmailTitle')}</H1>
              <Text color="$mutedText" textAlign="center" maxWidth={300}>
                {t('auth.verifyEmailSubtitle')}
              </Text>
            </YStack>
          </FadeIn>
        )}
      </YStack>
    </YStack>
  )
}
