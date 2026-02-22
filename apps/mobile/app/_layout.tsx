import { useEffect, useLayoutEffect, useState } from 'react'
import { Platform, LogBox, AppState } from 'react-native'
import { Stack, Slot, SplashScreen, usePathname, router } from 'expo-router'
import { TamaguiProvider, XStack, YStack, Text, useTheme } from 'tamagui'
import { Ionicons } from '@expo/vector-icons'
import { PortalProvider } from '@tamagui/portal'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { QueryClientProvider } from '@tanstack/react-query'
import { useFonts } from 'expo-font'
import { configureReanimatedLogger, ReanimatedLogLevel } from 'react-native-reanimated'
import { tamaguiConfig, WebSidebar, useIsMobileWeb, CookieBanner } from '@mvp/ui'
import { TemplateConfigSidebar, applyColorScheme, DEFAULT_SCHEME_KEY, useTemplateConfigStore, useTemplateFlag } from '@mvp/template-config'
import { useThemeStore, useLanguageStore, useAuthStore } from '@mvp/store'
import type { ThemeMode } from '@mvp/store'
import { initI18n } from '@mvp/i18n'
import { useTranslation } from '@mvp/i18n'
import { analytics, useScreenTracking } from '@mvp/analytics'
import { storage } from '@mvp/lib'
import { SEO } from '@mvp/ui'
import { getPageById } from '@mvp/docs'
import { queryClient } from '../src/services/query-client'
import { AuthProvider } from '@mvp/auth'
import { authApi } from '../src/services/auth'
import { api, getAccessToken } from '../src/services/api'
import { registerForPushNotifications } from '../src/services/push'
import { connectSSE, disconnectSSE } from '../src/services/sse'

// Moti's declarative API writes shared values during render by design — disable strict mode
configureReanimatedLogger({ level: ReanimatedLogLevel.warn, strict: false })

LogBox.ignoreLogs([
  "Must call import '@tamagui/native/setup-zeego'",
  'SafeAreaView has been deprecated',
])

// Prevent splash screen from hiding before fonts load
SplashScreen.preventAutoHideAsync()

// Static navigation colors matching tamagui.config.ts — used in screenOptions
// so colors are available on first render (no useTheme() delay)
const navColors = {
  light: { background: '#FAFAFA', tint: '#0891B2', text: '#0A0A0A' },
  dark: { background: '#09090B', tint: '#38E8FF', text: '#FAFAFA' },
}

const THEME_CYCLE: ThemeMode[] = ['system', 'light', 'dark']
const THEME_ICONS: Record<ThemeMode, keyof typeof Ionicons.glyphMap> = {
  system: 'contrast-outline',
  light: 'sunny-outline',
  dark: 'moon-outline',
}
const THEME_LABELS: Record<ThemeMode, string> = {
  system: 'settings.themeSystem',
  light: 'settings.themeLight',
  dark: 'settings.themeDark',
}

const PAGE_META: Record<string, { titleKey: string; descKey: string }> = {
  '/':               { titleKey: 'tabs.home',                descKey: 'meta.homeDesc' },
  '/explore':        { titleKey: 'explore.title',            descKey: 'meta.exploreDesc' },
  '/settings':       { titleKey: 'settings.title',           descKey: 'meta.settingsDesc' },
  '/sign-in':        { titleKey: 'auth.signIn',              descKey: 'meta.signInDesc' },
  '/sign-up':        { titleKey: 'auth.signUp',              descKey: 'meta.signUpDesc' },
  '/forgot-password': { titleKey: 'auth.forgotPasswordTitle', descKey: 'meta.forgotPasswordDesc' },
  '/reset-password': { titleKey: 'auth.resetPassword',       descKey: 'meta.resetPasswordDesc' },
  '/verify-email':   { titleKey: 'auth.verifyEmailTitle',    descKey: 'meta.verifyEmailDesc' },
  '/docs':           { titleKey: 'docs.title',               descKey: 'meta.docsDesc' },
  '/privacy':        { titleKey: 'settings.privacy',         descKey: 'meta.privacyDesc' },
  '/admin':          { titleKey: 'admin.title',              descKey: 'meta.adminDesc' },
  '/edit-profile':   { titleKey: 'profile.editProfile',      descKey: 'meta.editProfileDesc' },
  '/landing':        { titleKey: 'landing.heroTitle',        descKey: 'landing.heroSubtitle' },
}

function PageSEO() {
  const { t } = useTranslation()
  const pathname = usePathname()

  const meta = PAGE_META[pathname]
  if (meta) return <SEO title={t(meta.titleKey)} description={t(meta.descKey)} />

  // Dynamic docs routes: /docs/quick-start, /docs/auth, etc.
  if (pathname.startsWith('/docs/')) {
    const docPage = getPageById(pathname.replace('/docs/', ''))
    if (docPage) return <SEO title={t(docPage.titleKey)} description={t('meta.docsDesc')} />
  }

  return null
}

function RootNavigator() {
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
      <Stack.Screen name="admin" options={{ title: t('admin.title'), headerBackTitle: t('common.back') }} />
      <Stack.Screen name="landing" options={{ headerShown: false }} />
      <Stack.Screen name="+not-found" />
    </Stack>
  )
}

function ThemeToggle({ collapsed }: { collapsed: boolean }) {
  const { t } = useTranslation()
  const theme = useTheme()
  const { mode, setMode } = useThemeStore()

  const cycleTheme = () => {
    const idx = THEME_CYCLE.indexOf(mode)
    setMode(THEME_CYCLE[(idx + 1) % THEME_CYCLE.length])
  }

  return (
    <XStack
      paddingVertical="$2.5"
      paddingHorizontal="$3"
      borderRadius="$3"
      alignItems="center"
      justifyContent={collapsed ? 'center' : 'flex-start'}
      gap="$3"
      hoverStyle={{ backgroundColor: '$backgroundHover' }}
      cursor="pointer"
      onPress={cycleTheme}
    >
      <Ionicons name={THEME_ICONS[mode]} size={20} color={theme.mutedText.val} />
      {!collapsed && (
        <Text color="$mutedText" fontSize="$3" numberOfLines={1}>
          {t(THEME_LABELS[mode])}
        </Text>
      )}
    </XStack>
  )
}

function WebRootLayout() {
  const { t } = useTranslation()
  const pathname = usePathname()
  const user = useAuthStore((s) => s.user)
  const isAdmin = user?.role === 'admin'
  const isMobile = useIsMobileWeb()

  // Landing page renders full-width without sidebar
  if (pathname === '/landing') {
    return (
      <XStack flex={1} style={{ height: '100vh' } as any}>
        <YStack flex={1} style={{ overflow: 'auto' } as any}>
          <Slot />
        </YStack>
        {isTemplateConfigEnabled && isAdmin && <TemplateConfigSidebar />}
      </XStack>
    )
  }

  const navItems = [
    { href: '/', label: t('tabs.home'), icon: 'home-outline' as const, iconFilled: 'home' as const, animation: 'bounce' as const },
    { href: '/explore', label: t('tabs.explore'), icon: 'compass-outline' as const, iconFilled: 'compass' as const, animation: 'rotate' as const },
    { href: '/settings', label: t('settings.title'), icon: 'settings-outline' as const, iconFilled: 'settings' as const, animation: 'wiggle' as const },
    ...(isAdmin ? [{ href: '/admin', label: t('admin.title'), icon: 'shield-outline' as const, iconFilled: 'shield' as const, animation: 'bell' as const }] : []),
  ]

  return (
    <XStack flex={1} backgroundColor="$background" style={{ height: '100vh' } as any}>
      <WebSidebar
        items={navItems}
        currentPath={pathname}
        onNavigate={(href) => router.push(href as any)}
        footer={(collapsed) => <ThemeToggle collapsed={collapsed} />}
        logo={require('../assets/icon.png')}
        title="MVP Template"
      />
      <YStack flex={1} style={{ overflow: 'auto', paddingBottom: isMobile ? 64 : 0 } as any}>
        <Slot />
      </YStack>
      <CookieBanner />
      {isTemplateConfigEnabled && isAdmin && <TemplateConfigSidebar />}
    </XStack>
  )
}

const isTemplateConfigEnabled = process.env.EXPO_PUBLIC_ENABLE_TEMPLATE_CONFIG === 'true'

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

  const { i18n } = useTranslation()

  useEffect(() => {
    initI18n(savedLanguage)
    setI18nReady(true)
  }, [])

  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      document.documentElement.lang = i18n.language
    }
  }, [i18n.language])

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

  // Sync backend feature flags to frontend on startup
  const setFlag = useTemplateConfigStore((s) => s.setFlag)

  useEffect(() => {
    api.get('/config/flags').then((res) => {
      const flags = res.data?.data
      if (flags && typeof flags === 'object') {
        for (const [key, value] of Object.entries(flags)) {
          if (typeof value === 'boolean') {
            setFlag(key, value)
          }
        }
      }
    }).catch(() => {})
  }, [])

  // Register push notifications and connect SSE when authenticated
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const pushEnabled = useTemplateFlag('pushNotifications', false)

  useEffect(() => {
    if (isAuthenticated) {
      if (pushEnabled) {
        registerForPushNotifications().catch(() => {})
      }
      connectSSE()
    }
    return () => disconnectSSE()
  }, [isAuthenticated, pushEnabled])

  // Apply persisted color scheme and force theme update when theme or color scheme changes.
  const templateColorScheme = useTemplateConfigStore((s) => s.colorScheme)

  useLayoutEffect(() => {
    if (Platform.OS === 'web') {
      applyColorScheme(templateColorScheme ?? DEFAULT_SCHEME_KEY)
    }
  }, [resolvedTheme, templateColorScheme])

  const ready = (fontsLoaded || fontError) && i18nReady && isInitialized && isThemeHydrated

  useEffect(() => {
    if (ready) {
      SplashScreen.hideAsync().catch(() => {})
    }
  }, [ready])

  if (!ready) return null

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <TamaguiProvider config={tamaguiConfig} defaultTheme={resolvedTheme}>
          <PortalProvider>
            <AuthProvider
              authApi={authApi}
              onAuthSuccess={() => router.replace('/')}
              onNavigateToSignIn={() => router.replace('/sign-in')}
              onNavigateToForgotPassword={() => router.push('/forgot-password')}
            >
              <PageSEO />
              <RootNavigator />
            </AuthProvider>
          </PortalProvider>
        </TamaguiProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  )
}
