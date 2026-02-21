import { useState } from 'react'
import { XStack, Text } from 'tamagui'
import { useTranslation } from '@mvp/i18n'
import { useAuthStore } from '@mvp/store'
import { Ionicons } from '@expo/vector-icons'
import { TouchableOpacity, ActivityIndicator } from 'react-native'
import { useAuth } from './AuthProvider'

export function EmailVerificationBanner() {
  const { t } = useTranslation()
  const { authApi } = useAuth()
  const user = useAuthStore((s) => s.user)
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  if (!user || !user.emailEnabled || user.emailVerified !== false) return null

  const handleResend = async () => {
    setLoading(true)
    try {
      await authApi.resendVerification()
      setSent(true)
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  return (
    <XStack
      backgroundColor="$yellow3"
      paddingHorizontal="$3"
      paddingVertical="$2.5"
      borderRadius="$3"
      alignItems="center"
      gap="$2"
    >
      <Ionicons name="mail-outline" size={18} color="#92400E" />
      <Text fontSize="$2" color="#92400E" flex={1}>
        {sent ? t('auth.verificationSent') : t('auth.emailNotVerified')}
      </Text>
      {!sent && (
        <TouchableOpacity onPress={handleResend} disabled={loading}>
          {loading ? (
            <ActivityIndicator size="small" color="#92400E" />
          ) : (
            <Text fontSize="$2" fontWeight="bold" color="#92400E">
              {t('auth.resendVerification')}
            </Text>
          )}
        </TouchableOpacity>
      )}
    </XStack>
  )
}
