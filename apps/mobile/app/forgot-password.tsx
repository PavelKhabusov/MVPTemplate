import { useEffect } from 'react'
import { KeyboardAvoidingView, ScrollView, Platform, TouchableOpacity } from 'react-native'
import { YStack, Text, H1, useTheme } from 'tamagui'
import { Link, router } from 'expo-router'
import { useTranslation } from '@mvp/i18n'
import { FadeIn, SlideIn } from '@mvp/ui'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAuthStore } from '@mvp/store'
import { ForgotPasswordForm } from '@mvp/auth'

export default function ForgotPasswordScreen() {
  const { t } = useTranslation()
  const theme = useTheme()
  const insets = useSafeAreaInsets()
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  useEffect(() => {
    if (isAuthenticated) router.replace('/settings')
  }, [isAuthenticated])

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
            <YStack alignItems="center" gap="$2">
              <H1>{t('auth.forgotPasswordTitle')}</H1>
              <Text color="$mutedText" textAlign="center" maxWidth={300}>
                {t('auth.forgotPasswordSubtitle')}
              </Text>
            </YStack>
          </FadeIn>

          <ForgotPasswordForm />

          <SlideIn from="bottom" delay={200}>
            <Link href="/sign-in">
              <Text color="$primary" fontWeight="bold">
                {t('auth.backToSignIn')}
              </Text>
            </Link>
          </SlideIn>
        </YStack>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
