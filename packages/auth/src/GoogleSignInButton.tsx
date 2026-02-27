import { useState } from 'react'
import { XStack, Text, useTheme } from 'tamagui'
import { Pressable, ActivityIndicator } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useTranslation } from '@mvp/i18n'
import * as Google from 'expo-auth-session/providers/google'
import * as WebBrowser from 'expo-web-browser'
import { useAuth } from './AuthProvider'

WebBrowser.maybeCompleteAuthSession()

const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? ''

/** Returns true when Google sign-in is configured via env var */
export const isGoogleAuthEnabled = GOOGLE_WEB_CLIENT_ID.length > 0

export function GoogleSignInButton() {
  const { t } = useTranslation()
  const theme = useTheme()
  const { authApi, onAuthSuccess } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [, , promptAsync] = Google.useIdTokenAuthRequest({
    clientId: GOOGLE_WEB_CLIENT_ID,
  })

  if (!isGoogleAuthEnabled) return null

  const handlePress = async () => {
    setError('')
    setLoading(true)

    try {
      const result = await promptAsync()

      if (result?.type === 'success') {
        const idToken = result.params.id_token
        await authApi.googleLogin(idToken)
        onAuthSuccess()
      } else if (result?.type === 'error') {
        setError(result.error?.message ?? t('auth.errorGoogleSignIn'))
      }
    } catch (err: any) {
      const message = err?.response?.data?.message ?? t('auth.errorGoogleSignIn')
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Pressable onPress={handlePress} disabled={loading}>
        <XStack
          backgroundColor="$cardBackground"
          borderWidth={1}
          borderColor="$borderColor"
          borderRadius="$3"
          height={48}
          alignItems="center"
          justifyContent="center"
          gap="$2.5"
          opacity={loading ? 0.6 : 1}
        >
          {loading ? (
            <ActivityIndicator size="small" color={theme.color.val} />
          ) : (
            <>
              <Ionicons name="logo-google" size={20} color={theme.color.val} />
              <Text fontSize="$3" fontWeight="600" color="$color">
                {t('auth.continueWithGoogle')}
              </Text>
            </>
          )}
        </XStack>
      </Pressable>
      {error ? (
        <Text fontSize="$1" color="$error" textAlign="center">
          {error}
        </Text>
      ) : null}
    </>
  )
}
