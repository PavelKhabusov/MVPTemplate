import { useEffect, useLayoutEffect, useState } from 'react'
import { Platform, LogBox, AppState } from 'react-native'
import { SplashScreen, router, usePathname } from 'expo-router'
import { TamaguiProvider } from 'tamagui'
import { PortalProvider } from '@tamagui/portal'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { QueryClientProvider } from '@tanstack/react-query'
import { useFonts } from 'expo-font'
import { configureReanimatedLogger, ReanimatedLogLevel } from 'react-native-reanimated'
import { tamaguiConfig, ToastProvider, CoachMarkProvider, CoachMarkOverlay } from '@mvp/ui'
import { applyColorScheme, applyCustomColor, DEFAULT_SCHEME_KEY, useTemplateConfigStore, useTemplateFlag, applyRadiusScale, applyCardStyle, applyFontFamily } from '@mvp/template-config'
import { useThemeStore, useLanguageStore, useAuthStore, useCompanyStore } from '@mvp/store'
import { initI18n, useTranslation } from '@mvp/i18n'
import { analytics } from '@mvp/analytics'
import { storage } from '@mvp/lib'
import { SEO } from '@mvp/ui'
import { getPageById } from '@mvp/docs'
import { queryClient } from '../src/services/query-client'
import { AuthProvider } from '@mvp/auth'
import { authApi } from '../src/services/auth'
import { api, getAccessToken } from '../src/services/api'
import { registerForPushNotifications, configureSSE, connectSSE, disconnectSSE } from '@mvp/notifications'
import { RootNavigator } from '../src/layout/RootNavigator'
import { OnboardingController } from '../src/layout/OnboardingController'

// Moti's declarative API writes shared values during render by design — disable strict mode
configureReanimatedLogger({ level: ReanimatedLogLevel.warn, strict: false })

LogBox.ignoreLogs([
  "Must call import '@tamagui/native/setup-zeego'",
  'SafeAreaView has been deprecated',
])

// Prevent splash screen from hiding before fonts load
SplashScreen.preventAutoHideAsync()

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
  '/terms':          { titleKey: 'settings.terms',           descKey: 'meta.termsDesc' },
  '/offer':          { titleKey: 'settings.offer',           descKey: 'meta.offerDesc' },
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

  // Fetch public company info on startup
  useEffect(() => {
    api.get('/config/company')
      .then((res) => useCompanyStore.getState().setInfo(res.data.data))
      .catch(() => {})
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

  // Configure SSE once
  useEffect(() => {
    const apiUrl = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000'
    configureSSE({ apiUrl, getAccessToken, queryClient })
  }, [])

  // Register push notifications and connect SSE when authenticated
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const pushEnabled = useTemplateFlag('pushNotifications', false)

  useEffect(() => {
    if (isAuthenticated) {
      if (pushEnabled) {
        registerForPushNotifications(api).catch(() => {})
      }
      connectSSE()
    }
    return () => disconnectSSE()
  }, [isAuthenticated, pushEnabled])

  // Apply persisted color scheme and force theme update when theme or color scheme changes.
  const templateColorScheme = useTemplateConfigStore((s) => s.colorScheme)
  const templateCustomColor = useTemplateConfigStore((s) => s.customColor)
  const templateRadiusScale = useTemplateConfigStore((s) => s.radiusScale)
  const templateCardStyle = useTemplateConfigStore((s) => s.cardStyle)
  const templateFontFamily = useTemplateConfigStore((s) => s.fontFamily)

  useLayoutEffect(() => {
    // Radius and card style work via Tamagui updateTheme on all platforms
    applyRadiusScale(templateRadiusScale)
    applyCardStyle(templateCardStyle)
    if (Platform.OS === 'web') {
      if (templateCustomColor) {
        applyCustomColor(templateCustomColor)
      } else {
        applyColorScheme(templateColorScheme ?? DEFAULT_SCHEME_KEY)
      }
      applyFontFamily(templateFontFamily).catch(() => {})
    }
  }, [resolvedTheme, templateColorScheme, templateCustomColor, templateRadiusScale, templateCardStyle, templateFontFamily])

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
            <ToastProvider>
              <CoachMarkProvider>
                <AuthProvider
                  authApi={authApi}
                  onAuthSuccess={() => router.replace('/')}
                  onNavigateToSignIn={() => router.replace('/sign-in')}
                  onNavigateToForgotPassword={() => router.push('/forgot-password')}
                >
                  <PageSEO />
                  <RootNavigator />
                  <OnboardingController />
                  <CoachMarkOverlay />
                </AuthProvider>
              </CoachMarkProvider>
            </ToastProvider>
          </PortalProvider>
        </TamaguiProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  )
}
