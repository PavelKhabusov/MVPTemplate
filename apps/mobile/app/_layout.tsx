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
import { tamaguiConfig, WebSidebar, WebHeader, useIsMobileWeb, CookieBanner, ToastProvider, AppAvatar, ScalePress, SearchModal } from '@mvp/ui'
import { AnimatePresence, MotiView } from 'moti'
import { TemplateConfigSidebar, applyColorScheme, applyCustomColor, DEFAULT_SCHEME_KEY, useTemplateConfigStore, useTemplateFlag } from '@mvp/template-config'
import { useThemeStore, useLanguageStore, useAuthStore } from '@mvp/store'
import type { ThemeMode } from '@mvp/store'
import { initI18n, useTranslation, useAppTranslation, LANGUAGE_LABELS, SUPPORTED_LANGUAGES } from '@mvp/i18n'
import type { SupportedLanguage } from '@mvp/i18n'
import { analytics, useScreenTracking } from '@mvp/analytics'
import { storage } from '@mvp/lib'
import { SEO } from '@mvp/ui'
import { getPageById } from '@mvp/docs'
import { queryClient } from '../src/services/query-client'
import { AuthProvider } from '@mvp/auth'
import { authApi } from '../src/services/auth'
import { api, getAccessToken } from '../src/services/api'
import { registerForPushNotifications, configureSSE, connectSSE, disconnectSSE } from '@mvp/notifications'

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
      <Stack.Screen name="pricing" options={{ title: t('payments.title'), headerBackTitle: t('common.back') }} />
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

function LanguagePicker({ collapsed, dropdownDirection = 'up' }: { collapsed: boolean; dropdownDirection?: 'up' | 'down' }) {
  const { i18n, changeLanguage } = useAppTranslation()
  const theme = useTheme()
  const [open, setOpen] = useState(false)
  const currentLang = i18n.language as SupportedLanguage

  return (
    <YStack position="relative">
      <XStack
        paddingVertical="$2.5"
        paddingHorizontal="$3"
        borderRadius="$3"
        alignItems="center"
        justifyContent={collapsed ? 'center' : 'flex-start'}
        gap="$3"
        hoverStyle={{ backgroundColor: '$backgroundHover' }}
        cursor="pointer"
        onPress={() => setOpen(!open)}
      >
        <Ionicons name="language-outline" size={20} color={theme.mutedText.val} />
        {!collapsed && (
          <Text color="$mutedText" fontSize="$3" numberOfLines={1}>
            {LANGUAGE_LABELS[currentLang]}
          </Text>
        )}
      </XStack>
      <AnimatePresence>
        {open && (
          <MotiView
            from={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: 'timing', duration: 150 }}
            style={{
              position: 'absolute',
              ...(dropdownDirection === 'up' ? { bottom: '100%', marginBottom: 4 } : { top: '100%', marginTop: 4 }),
              left: 0, right: collapsed ? undefined : 0, minWidth: 160, zIndex: 101,
            }}
          >
            <YStack
              backgroundColor="$cardBackground"
              borderRadius="$3"
              borderWidth={1}
              borderColor="$borderColor"
              padding="$1"
              shadowColor="$cardShadow"
              shadowRadius={8}
              shadowOpacity={1}
              shadowOffset={{ width: 0, height: dropdownDirection === 'up' ? -4 : 4 }}
            >
              {SUPPORTED_LANGUAGES.map((lang) => (
                <ScalePress key={lang} onPress={() => { changeLanguage(lang); setOpen(false) }}>
                  <XStack
                    paddingHorizontal="$3"
                    paddingVertical="$1.5"
                    borderRadius="$2"
                    alignItems="center"
                    justifyContent="space-between"
                    hoverStyle={{ backgroundColor: '$subtleBackground' } as any}
                  >
                    <Text fontSize="$2" color={currentLang === lang ? '$color' : '$mutedText'}>
                      {LANGUAGE_LABELS[lang]}
                    </Text>
                    {currentLang === lang && <Ionicons name="checkmark" size={14} color={theme.accent.val} />}
                  </XStack>
                </ScalePress>
              ))}
            </YStack>
          </MotiView>
        )}
      </AnimatePresence>
    </YStack>
  )
}

function SearchTrigger({ collapsed, onPress }: { collapsed: boolean; onPress: () => void }) {
  const { t } = useTranslation()
  const theme = useTheme()
  const isMobile = useIsMobileWeb()

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
      onPress={onPress}
    >
      <Ionicons name="search-outline" size={20} color={theme.mutedText.val} />
      {!collapsed && (
        <XStack flex={1} alignItems="center" justifyContent="space-between">
          <Text color="$mutedText" fontSize="$3" numberOfLines={1}>
            {t('common.search')}
          </Text>
          {!isMobile && (
            <XStack
              backgroundColor="$subtleBackground"
              borderRadius="$1"
              paddingHorizontal="$1.5"
              paddingVertical={2}
              borderWidth={1}
              borderColor="$borderColor"
            >
              <Text fontSize={10} color="$mutedText" style={{ fontFamily: 'monospace' } as any}>
                {typeof navigator !== 'undefined' && /Mac/.test(navigator.platform) ? '⌘K' : 'Ctrl+K'}
              </Text>
            </XStack>
          )}
        </XStack>
      )}
    </XStack>
  )
}

function UserBadge({ collapsed, compact, dropdownDirection = 'up' }: { collapsed: boolean; compact: boolean; dropdownDirection?: 'up' | 'down' }) {
  const user = useAuthStore((s) => s.user)
  const [menuOpen, setMenuOpen] = useState(false)
  const [langExpanded, setLangExpanded] = useState(false)
  const theme = useTheme()
  const { t, i18n, changeLanguage } = useAppTranslation()
  const { mode, setMode } = useThemeStore()

  useEffect(() => {
    if (!menuOpen) setLangExpanded(false)
  }, [menuOpen])

  if (!user) return null

  if (!compact) {
    return (
      <XStack
        alignItems="center"
        justifyContent={collapsed ? 'center' : 'flex-start'}
        gap="$2"
        paddingVertical="$2"
        paddingHorizontal="$3"
        borderRadius="$3"
        hoverStyle={{ backgroundColor: '$backgroundHover' }}
        cursor="pointer"
        onPress={() => router.push('/settings' as any)}
      >
        <AppAvatar uri={user.avatarUrl} name={user.name} size={collapsed ? 28 : 32} />
        {!collapsed && (
          <YStack flex={1}>
            <Text color="$color" fontSize="$2" fontWeight="600" numberOfLines={1}>{user.name}</Text>
            <Text color="$mutedText" fontSize={11} numberOfLines={1}>{user.email}</Text>
          </YStack>
        )}
      </XStack>
    )
  }

  return (
    <YStack position="relative" zIndex={100}>
      <XStack
        alignItems="center"
        justifyContent={collapsed ? 'center' : 'flex-start'}
        gap="$2"
        paddingVertical="$2"
        paddingHorizontal="$3"
        borderRadius="$3"
        hoverStyle={{ backgroundColor: '$backgroundHover' }}
        cursor="pointer"
        onPress={() => setMenuOpen(!menuOpen)}
      >
        <AppAvatar uri={user.avatarUrl} name={user.name} size={collapsed ? 28 : 32} />
        {!collapsed && (
          <YStack flex={1}>
            <Text color="$color" fontSize="$2" fontWeight="600" numberOfLines={1}>{user.name}</Text>
            <Text color="$mutedText" fontSize={11} numberOfLines={1}>{user.email}</Text>
          </YStack>
        )}
      </XStack>
      <AnimatePresence>
        {menuOpen && (
          <MotiView
            from={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: 'timing', duration: 150 }}
            style={{ position: 'absolute', ...(dropdownDirection === 'up' ? { bottom: '100%', marginBottom: 4 } : { top: '100%', marginTop: 4 }), left: 0, right: collapsed ? undefined : 0, minWidth: 200, zIndex: 101 }}
          >
            <YStack
              backgroundColor="$cardBackground"
              borderRadius="$3"
              borderWidth={1}
              borderColor="$borderColor"
              padding="$1"
              shadowColor="$cardShadow"
              shadowRadius={8}
              shadowOpacity={1}
              shadowOffset={{ width: 0, height: dropdownDirection === 'up' ? -4 : 4 }}
            >
              {/* User info header */}
              <YStack paddingHorizontal="$3" paddingVertical="$2">
                <Text color="$color" fontSize="$2" fontWeight="600" numberOfLines={1}>{user.name}</Text>
                <Text color="$mutedText" fontSize={11} numberOfLines={1}>{user.email}</Text>
              </YStack>
              <YStack height={1} backgroundColor="$borderColor" marginVertical="$1" />

              {/* Language — expandable sub-dropdown */}
              <ScalePress onPress={() => setLangExpanded(!langExpanded)}>
                <XStack paddingHorizontal="$3" paddingVertical="$1.5" borderRadius="$2" alignItems="center" justifyContent="space-between" hoverStyle={{ backgroundColor: '$subtleBackground' } as any}>
                  <XStack alignItems="center" gap="$2">
                    <Ionicons name="language-outline" size={14} color={theme.mutedText.val} />
                    <Text fontSize="$2" color="$color">{t('profileMenu.language')}</Text>
                  </XStack>
                  <XStack alignItems="center" gap="$1">
                    <Text fontSize={11} color="$mutedText">{LANGUAGE_LABELS[i18n.language as SupportedLanguage]}</Text>
                    <Ionicons name={langExpanded ? 'chevron-up' : 'chevron-down'} size={12} color={theme.mutedText.val} />
                  </XStack>
                </XStack>
              </ScalePress>
              {langExpanded && (
                <YStack paddingLeft="$4">
                  {SUPPORTED_LANGUAGES.map((lang) => (
                    <ScalePress key={lang} onPress={() => { changeLanguage(lang); setMenuOpen(false) }}>
                      <XStack paddingHorizontal="$3" paddingVertical="$1.5" borderRadius="$2" alignItems="center" justifyContent="space-between" hoverStyle={{ backgroundColor: '$subtleBackground' } as any}>
                        <Text fontSize="$2" color="$color">{LANGUAGE_LABELS[lang]}</Text>
                        {i18n.language === lang && <Ionicons name="checkmark" size={14} color={theme.accent.val} />}
                      </XStack>
                    </ScalePress>
                  ))}
                </YStack>
              )}

              {/* Theme */}
              <Text color="$mutedText" fontSize={10} fontWeight="700" paddingHorizontal="$3" paddingTop="$2" textTransform="uppercase" letterSpacing={0.5}>
                {t('profileMenu.theme')}
              </Text>
              {THEME_CYCLE.map((m) => (
                <ScalePress key={m} onPress={() => { setMode(m); setMenuOpen(false) }}>
                  <XStack paddingHorizontal="$3" paddingVertical="$1.5" borderRadius="$2" alignItems="center" gap="$2" hoverStyle={{ backgroundColor: '$subtleBackground' } as any}>
                    <Ionicons name={THEME_ICONS[m]} size={14} color={mode === m ? theme.accent.val : theme.mutedText.val} />
                    <Text fontSize="$2" color={mode === m ? '$color' : '$mutedText'} flex={1}>{t(THEME_LABELS[m])}</Text>
                    {mode === m && <Ionicons name="checkmark" size={14} color={theme.accent.val} />}
                  </XStack>
                </ScalePress>
              ))}

              <YStack height={1} backgroundColor="$borderColor" marginVertical="$1" />

              {/* Profile link */}
              <ScalePress onPress={() => { router.push('/settings' as any); setMenuOpen(false) }}>
                <XStack paddingHorizontal="$3" paddingVertical="$2" borderRadius="$2" alignItems="center" gap="$2" hoverStyle={{ backgroundColor: '$subtleBackground' } as any}>
                  <Ionicons name="person-outline" size={14} color={theme.mutedText.val} />
                  <Text fontSize="$2" color="$color">{t('profileMenu.profile')}</Text>
                </XStack>
              </ScalePress>
            </YStack>
          </MotiView>
        )}
      </AnimatePresence>
    </YStack>
  )
}

function WebRootLayout() {
  const { t } = useTranslation()
  const pathname = usePathname()
  const user = useAuthStore((s) => s.user)
  const isAdmin = user?.role === 'admin'
  const isMobile = useIsMobileWeb()
  const webLayout = useTemplateConfigStore((s) => s.webLayout)
  const userBadgePlacement = useTemplateConfigStore((s) => s.userBadgePlacement)
  const headerNavAlign = useTemplateConfigStore((s) => s.headerNavAlign)
  const compactProfile = useTemplateConfigStore((s) => s.compactProfile)
  const languagePlacement = useTemplateConfigStore((s) => s.languagePlacement)
  const themePlacement = useTemplateConfigStore((s) => s.themePlacement)
  const searchPlacement = useTemplateConfigStore((s) => s.searchPlacement)
  const [searchOpen, setSearchOpen] = useState(false)

  const showHeader = webLayout === 'header' || webLayout === 'both'
  const showSidebar = webLayout === 'sidebar' || webLayout === 'both'
  const showBadgeInSidebar = userBadgePlacement === 'sidebar' || userBadgePlacement === 'both'
  const showBadgeInHeader = userBadgePlacement === 'header' || userBadgePlacement === 'both'
  const showLangInSidebar = !compactProfile && (languagePlacement === 'sidebar' || languagePlacement === 'both')
  const showLangInHeader = !compactProfile && (languagePlacement === 'header' || languagePlacement === 'both')
  const showThemeInSidebar = !compactProfile && (themePlacement === 'sidebar' || themePlacement === 'both')
  const showThemeInHeader = !compactProfile && (themePlacement === 'header' || themePlacement === 'both')
  const showSearchInSidebar = searchPlacement === 'sidebar'
  const showSearchInHeader = searchPlacement === 'header'

  // Global Cmd+K / Ctrl+K hotkey
  useEffect(() => {
    if (searchPlacement === 'nowhere') return
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setSearchOpen((prev) => !prev)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [searchPlacement])

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
    <YStack flex={1} backgroundColor="$background" style={{ height: '100vh' } as any}>
      {showHeader && !isMobile && (
        <WebHeader
          items={navItems}
          currentPath={pathname}
          onNavigate={(href) => router.push(href as any)}
          logo={require('../assets/icon.png')}
          title="MVP Template"
          navAlign={headerNavAlign}
          rightContent={
            <>
              {showSearchInHeader && <SearchTrigger collapsed={false} onPress={() => setSearchOpen(true)} />}
              {showLangInHeader && <LanguagePicker collapsed={false} dropdownDirection="down" />}
              {showThemeInHeader && <ThemeToggle collapsed={false} />}
              {showBadgeInHeader && <UserBadge collapsed={false} compact={compactProfile} dropdownDirection="down" />}
            </>
          }
        />
      )}
      <XStack flex={1} style={{ overflow: 'hidden' } as any}>
        {showSidebar && (
          <WebSidebar
            items={navItems}
            currentPath={pathname}
            onNavigate={(href) => router.push(href as any)}
            hideLogo={showHeader}
            footer={(collapsed) => (
              <>
                {showSearchInSidebar && <SearchTrigger collapsed={collapsed} onPress={() => setSearchOpen(true)} />}
                {showBadgeInSidebar && <UserBadge collapsed={collapsed} compact={compactProfile} />}
                {showLangInSidebar && <LanguagePicker collapsed={collapsed} />}
                {showThemeInSidebar && <ThemeToggle collapsed={collapsed} />}
              </>
            )}
            logo={require('../assets/icon.png')}
            title="MVP Template"
          />
        )}
        <YStack flex={1} style={{ overflow: 'auto', paddingBottom: isMobile ? 64 : 0 } as any}>
          <YStack width="100%" maxWidth={1200} marginHorizontal="auto" flex={1}>
            <Slot />
          </YStack>
        </YStack>
        {/* Mobile bottom tabs when sidebar is off but header is on */}
        {!showSidebar && isMobile && (
          <WebSidebar
            items={navItems}
            currentPath={pathname}
            onNavigate={(href) => router.push(href as any)}
          />
        )}
        {isTemplateConfigEnabled && isAdmin && <TemplateConfigSidebar />}
      </XStack>
      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
      <CookieBanner />
    </YStack>
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

  useLayoutEffect(() => {
    if (Platform.OS === 'web') {
      if (templateCustomColor) {
        applyCustomColor(templateCustomColor)
      } else {
        applyColorScheme(templateColorScheme ?? DEFAULT_SCHEME_KEY)
      }
    }
  }, [resolvedTheme, templateColorScheme, templateCustomColor])

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
              <AuthProvider
                authApi={authApi}
                onAuthSuccess={() => router.replace('/')}
                onNavigateToSignIn={() => router.replace('/sign-in')}
                onNavigateToForgotPassword={() => router.push('/forgot-password')}
              >
                <PageSEO />
                <RootNavigator />
              </AuthProvider>
            </ToastProvider>
          </PortalProvider>
        </TamaguiProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  )
}
