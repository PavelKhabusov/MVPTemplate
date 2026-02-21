import { KeyboardAvoidingView, ScrollView, Platform, TouchableOpacity } from 'react-native'
import { YStack, Text, H1, useTheme } from 'tamagui'
import { router, useLocalSearchParams } from 'expo-router'
import { useTranslation } from '@mvp/i18n'
import { FadeIn } from '@mvp/ui'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ResetPasswordForm } from '@mvp/auth'

export default function ResetPasswordScreen() {
  const { t } = useTranslation()
  const theme = useTheme()
  const insets = useSafeAreaInsets()
  const { token } = useLocalSearchParams<{ token: string }>()

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.background.val }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 16 }}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ position: 'absolute', top: insets.top + 8, left: 0, padding: 8, zIndex: 1 }}
        >
          <Ionicons name="arrow-back" size={24} color={theme.color.val} />
        </TouchableOpacity>

        <YStack alignItems="center" gap="$6">
          <FadeIn>
            <H1>{t('auth.resetPassword')}</H1>
          </FadeIn>

          {token ? (
            <ResetPasswordForm token={token} />
          ) : (
            <FadeIn>
              <Text color="$mutedText" textAlign="center">
                {t('auth.invalidToken')}
              </Text>
            </FadeIn>
          )}
        </YStack>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
