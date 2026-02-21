import { KeyboardAvoidingView, ScrollView, Platform, TouchableOpacity } from 'react-native'
import { YStack, XStack, Text, H1, Separator, useTheme } from 'tamagui'
import { Link, router } from 'expo-router'
import { useTranslation } from '@mvp/i18n'
import { FadeIn, SlideIn } from '@mvp/ui'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { SignUpForm } from '../src/features/auth/SignUpForm'
import { GoogleSignInButton, isGoogleAuthEnabled } from '../src/features/auth/GoogleSignInButton'

export default function SignUpScreen() {
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
            <H1>{t('auth.signUp')}</H1>
          </FadeIn>

          <SignUpForm />

          {isGoogleAuthEnabled && (
            <SlideIn from="bottom" delay={500}>
              <YStack width="100%" maxWidth={400} gap="$3">
                <XStack alignItems="center" gap="$3">
                  <Separator flex={1} />
                  <Text color="$mutedText" fontSize="$2">{t('auth.or')}</Text>
                  <Separator flex={1} />
                </XStack>
                <GoogleSignInButton />
              </YStack>
            </SlideIn>
          )}

          <SlideIn from="bottom" delay={isGoogleAuthEnabled ? 600 : 500}>
            <Text color="$mutedText" textAlign="center">
              {t('auth.hasAccount')}{' '}
              <Link href="/sign-in">
                <Text color="$primary" fontWeight="bold">
                  {t('auth.signIn')}
                </Text>
              </Link>
            </Text>
          </SlideIn>
        </YStack>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
