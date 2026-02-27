import { Platform } from 'react-native'
import { Stack, usePathname } from 'expo-router'
import { useTheme } from 'tamagui'
import { useThemeStore } from '@mvp/store'
import { useTranslation } from '@mvp/i18n'
import { useScreenTracking } from '@mvp/analytics'
import { WebRootLayout } from './WebRootLayout'

// Static navigation colors matching tamagui.config.ts — used in screenOptions
// so colors are available on first render (no useTheme() delay)
const navColors = {
  light: { background: '#FAFAFA', tint: '#0891B2', text: '#0A0A0A' },
  dark: { background: '#09090B', tint: '#38E8FF', text: '#FAFAFA' },
}

export function RootNavigator() {
  const resolvedTheme = useThemeStore((s) => s.resolvedTheme)
  const theme = useTheme()
  const { t } = useTranslation()
  const pathname = usePathname()

  useScreenTracking(pathname)

  if (Platform.OS === 'web') {
    return <WebRootLayout />
  }

  const colors = navColors[resolvedTheme]

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: theme.accent.val,
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false, title: t('common.back') }} />
      <Stack.Screen name="sign-in" options={{ headerShown: false, presentation: 'modal' }} />
      <Stack.Screen name="sign-up" options={{ headerShown: false, presentation: 'modal' }} />
      <Stack.Screen name="forgot-password" options={{ headerShown: false, presentation: 'modal' }} />
      <Stack.Screen name="reset-password" options={{ headerShown: false, presentation: 'modal' }} />
      <Stack.Screen name="verify-email" options={{ headerShown: false, presentation: 'modal' }} />
      <Stack.Screen name="settings" options={{ title: t('settings.title'), headerBackTitle: t('common.back') }} />
      <Stack.Screen
        name="edit-profile"
        options={{
          title: '',
          headerBackVisible: false,
          headerShadowVisible: false,
        }}
      />
      <Stack.Screen name="docs" options={{ headerShown: false }} />
      <Stack.Screen name="privacy" options={{ title: t('settings.privacy'), headerBackTitle: t('common.back') }} />
      <Stack.Screen name="terms" options={{ title: t('settings.terms'), headerBackTitle: t('common.back') }} />
      <Stack.Screen name="offer" options={{ title: t('settings.offer'), headerBackTitle: t('common.back') }} />
      <Stack.Screen name="admin" options={{ title: t('admin.title'), headerBackTitle: t('common.back') }} />
      <Stack.Screen name="pricing" options={{ title: t('payments.title'), headerBackTitle: t('common.back') }} />
      <Stack.Screen name="landing" options={{ headerShown: false }} />
      <Stack.Screen name="+not-found" />
    </Stack>
  )
}
