import { useEffect, useState } from 'react'
import { Stack, SplashScreen, usePathname } from 'expo-router'
import { TamaguiProvider, useTheme } from 'tamagui'
import { PortalProvider } from '@tamagui/portal'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { QueryClientProvider } from '@tanstack/react-query'
import { useFonts } from 'expo-font'
import { configureReanimatedLogger, ReanimatedLogLevel } from 'react-native-reanimated'
import { tamaguiConfig } from '@mvp/ui'
import { useThemeStore, useLanguageStore, useAuthStore } from '@mvp/store'
import { initI18n } from '@mvp/i18n'
import { useTranslation } from '@mvp/i18n'
import { analytics, useScreenTracking } from '@mvp/analytics'
import { queryClient } from '../src/services/query-client'
import { authApi } from '../src/features/auth/auth.service'

// Moti's declarative API writes shared values during render by design — disable strict mode
configureReanimatedLogger({ level: ReanimatedLogLevel.warn, strict: false })

// Prevent splash screen from hiding before fonts load
SplashScreen.preventAutoHideAsync()

function RootNavigator() {
  const theme = useTheme()
  const { t } = useTranslation()
  const pathname = usePathname()

  useScreenTracking(pathname)

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: theme.background.val },
        headerTintColor: theme.color.val,
        headerShadowVisible: false,
        contentStyle: { backgroundColor: theme.background.val },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false, title: t('common.back') }} />
      <Stack.Screen name="sign-in" options={{ title: t('auth.signIn'), presentation: 'modal' }} />
      <Stack.Screen name="sign-up" options={{ title: t('auth.signUp'), presentation: 'modal' }} />
      <Stack.Screen name="settings" options={{ title: t('settings.title'), headerBackTitle: t('common.back') }} />
      <Stack.Screen name="privacy" options={{ title: t('settings.privacy'), headerBackTitle: t('common.back') }} />
      <Stack.Screen name="+not-found" />
    </Stack>
  )
}

export default function RootLayout() {
  const resolvedTheme = useThemeStore((s) => s.resolvedTheme)
  const savedLanguage = useLanguageStore((s) => s.language)
  const isInitialized = useAuthStore((s) => s.isInitialized)
  const [i18nReady, setI18nReady] = useState(false)

  const [fontsLoaded, fontError] = useFonts({
    Inter: require('@tamagui/font-inter/otf/Inter-Medium.otf'),
    InterBold: require('@tamagui/font-inter/otf/Inter-Bold.otf'),
  })

  useEffect(() => {
    initI18n(savedLanguage)
    setI18nReady(true)
  }, [])

  useEffect(() => {
    // Initialize analytics — uses PostHog if posthog-react-native is installed and key provided
    const posthogKey = process.env.EXPO_PUBLIC_POSTHOG_KEY
    analytics.init(posthogKey)
  }, [])

  useEffect(() => {
    authApi.initialize()
  }, [])

  const ready = (fontsLoaded || fontError) && i18nReady && isInitialized

  useEffect(() => {
    if (ready) {
      SplashScreen.hideAsync()
    }
  }, [ready])

  if (!ready) return null

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <TamaguiProvider config={tamaguiConfig} defaultTheme={resolvedTheme}>
          <PortalProvider>
            <RootNavigator />
          </PortalProvider>
        </TamaguiProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  )
}
