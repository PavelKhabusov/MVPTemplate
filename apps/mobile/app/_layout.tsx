import { useEffect, useState } from 'react'
import { Platform, LogBox, AppState } from 'react-native'
import { Stack, Slot, SplashScreen, usePathname, router } from 'expo-router'
import { TamaguiProvider, Theme, XStack } from 'tamagui'
import { ThemeProvider, type Theme as NavTheme } from '@react-navigation/native'
import { PortalProvider } from '@tamagui/portal'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { QueryClientProvider } from '@tanstack/react-query'
import { useFonts } from 'expo-font'
import { configureReanimatedLogger, ReanimatedLogLevel } from 'react-native-reanimated'
import { tamaguiConfig, WebSidebar } from '@mvp/ui'
import { useThemeStore, useLanguageStore, useAuthStore } from '@mvp/store'
import { initI18n } from '@mvp/i18n'
import { useTranslation } from '@mvp/i18n'
import { analytics, useScreenTracking } from '@mvp/analytics'
import { storage } from '@mvp/lib'
import { queryClient } from '../src/services/query-client'
import { authApi } from '../src/features/auth/auth.service'
import { getAccessToken } from '../src/services/api'

// Moti's declarative API writes shared values during render by design — disable strict mode
configureReanimatedLogger({ level: ReanimatedLogLevel.warn, strict: false })

LogBox.ignoreLogs([
  "Must call import '@tamagui/native/setup-zeego'",
  'SafeAreaView has been deprecated',
])

// Prevent splash screen from hiding before fonts load
SplashScreen.preventAutoHideAsync()

const navFonts = {
  regular: { fontFamily: 'Inter', fontWeight: '400' as const },
  medium: { fontFamily: 'Inter', fontWeight: '500' as const },
  bold: { fontFamily: 'InterBold', fontWeight: '700' as const },
  heavy: { fontFamily: 'InterBold', fontWeight: '800' as const },
}

const lightNavTheme: NavTheme = {
  dark: false,
  colors: {
    primary: '#0891B2',
    background: '#FAFAFA',
    card: '#FAFAFA',
    text: '#0A0A0A',
    border: '#E5E5E5',
    notification: '#0891B2',
  },
  fonts: navFonts,
}

const darkNavTheme: NavTheme = {
  dark: true,
  colors: {
    primary: '#38E8FF',
    background: '#09090B',
    card: '#09090B',
    text: '#FAFAFA',
    border: '#27272A',
    notification: '#38E8FF',
  },
  fonts: navFonts,
}

function RootNavigator() {
  const { t } = useTranslation()
  const pathname = usePathname()

  useScreenTracking(pathname)

  if (Platform.OS === 'web') {
    return <WebRootLayout />
  }

  return (
    <Stack
      screenOptions={{
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false, title: t('common.back') }} />
      <Stack.Screen name="sign-in" options={{ headerShown: false, presentation: 'modal' }} />
      <Stack.Screen name="sign-up" options={{ headerShown: false, presentation: 'modal' }} />
      <Stack.Screen name="settings" options={{ title: t('settings.title'), headerBackTitle: t('common.back') }} />
      <Stack.Screen
        name="edit-profile"
        options={{
          title: '',
          headerBackVisible: false,
          headerShadowVisible: false,
        }}
      />
      <Stack.Screen name="privacy" options={{ title: t('settings.privacy'), headerBackTitle: t('common.back') }} />
      <Stack.Screen name="admin" options={{ title: t('admin.title'), headerBackTitle: t('common.back') }} />
      <Stack.Screen name="+not-found" />
    </Stack>
  )
}

function WebRootLayout() {
  const { t } = useTranslation()
  const pathname = usePathname()
  const user = useAuthStore((s) => s.user)
  const isAdmin = user?.role === 'admin'

  const navItems = [
    { href: '/', label: t('tabs.home'), icon: 'home-outline' as const, iconFilled: 'home' as const, animation: 'bounce' as const },
    { href: '/explore', label: t('tabs.explore'), icon: 'compass-outline' as const, iconFilled: 'compass' as const, animation: 'rotate' as const },
    { href: '/profile', label: t('tabs.profile'), icon: 'person-outline' as const, iconFilled: 'person' as const, animation: 'pop' as const },
    ...(isAdmin ? [{ href: '/admin', label: t('admin.title'), icon: 'shield-outline' as const, iconFilled: 'shield' as const, animation: 'bell' as const }] : []),
  ]

  return (
    <XStack flex={1} backgroundColor="$background" style={{ height: '100vh' } as any}>
      <WebSidebar
        items={navItems}
        currentPath={pathname}
        onNavigate={(href) => router.push(href as any)}
      />
      <Slot />
    </XStack>
  )
}

export default function RootLayout() {
  const resolvedTheme = useThemeStore((s) => s.resolvedTheme)
  const isThemeHydrated = useThemeStore((s) => s._hasHydrated)
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

    // Configure internal analytics backend
    const apiUrl = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000'
    let deviceId = storage.getString('analytics_device_id')
    if (!deviceId) {
      deviceId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0
        return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16)
      })
      storage.set('analytics_device_id', deviceId)
    }
    analytics.configureBackend({ apiUrl, deviceId, getToken: getAccessToken })
    analytics.startSession()
  }, [])

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        analytics.startSession()
      } else if (state === 'background' || state === 'inactive') {
        analytics.endSession()
        analytics.flush()
      }
    })
    return () => sub.remove()
  }, [])

  useEffect(() => {
    authApi.initialize()
  }, [])

  const ready = (fontsLoaded || fontError) && i18nReady && isInitialized && isThemeHydrated

  useEffect(() => {
    if (ready) {
      SplashScreen.hideAsync().catch(() => {})
    }
  }, [ready])

  if (!ready) return null

  const navTheme = resolvedTheme === 'dark' ? darkNavTheme : lightNavTheme

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider value={navTheme}>
          <TamaguiProvider config={tamaguiConfig} defaultTheme={resolvedTheme}>
            <Theme name={resolvedTheme}>
              <PortalProvider>
                <RootNavigator />
              </PortalProvider>
            </Theme>
          </TamaguiProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  )
}
