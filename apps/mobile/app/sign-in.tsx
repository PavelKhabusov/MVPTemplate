import { KeyboardAvoidingView, ScrollView, Platform, TouchableOpacity } from 'react-native'
import { YStack, Text, H1, useTheme } from 'tamagui'
import { Link, router } from 'expo-router'
import { useTranslation } from '@mvp/i18n'
import { FadeIn, SlideIn } from '@mvp/ui'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { SignInForm } from '../src/features/auth/SignInForm'

export default function SignInScreen() {
  const { t } = useTranslation()
  const theme = useTheme()
  const insets = useSafeAreaInsets()

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
            <H1>{t('auth.signIn')}</H1>
          </FadeIn>

          <SignInForm />

          <SlideIn from="bottom" delay={300}>
            <Text color="$mutedText" textAlign="center">
              {t('auth.noAccount')}{' '}
              <Link href="/sign-up">
                <Text color="$primary" fontWeight="bold">
                  {t('auth.createAccount')}
                </Text>
              </Link>
            </Text>
          </SlideIn>
        </YStack>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
