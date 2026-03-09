import { useEffect, useState } from 'react'
import { Platform, Pressable } from 'react-native'
import { Slot, usePathname, router } from 'expo-router'
import { XStack, YStack, Text, useTheme } from 'tamagui'
import { Ionicons } from '@expo/vector-icons'
import { WebSidebar, WebHeader, useIsMobileWeb, CookieBanner, AppAvatar, ScalePress, SearchModal } from '@mvp/ui'
import { AnimatePresence, MotiView } from 'moti'
import { TemplateConfigSidebar, useTemplateConfigStore, useTemplateFlag, getFontZoom } from '@mvp/template-config'
import { APP_BRAND } from '@mvp/template-config/src/brand'
import { useThemeStore, useAuthStore, useCompanyStore } from '@mvp/store'
import type { ThemeMode } from '@mvp/store'
import { useTranslation, useAppTranslation, LANGUAGE_LABELS, SUPPORTED_LANGUAGES } from '@mvp/i18n'
import type { SupportedLanguage } from '@mvp/i18n'
import { getPageById, DOC_GROUPS } from '@mvp/docs'

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

const isTemplateConfigEnabled = process.env.EXPO_PUBLIC_ENABLE_TEMPLATE_CONFIG === 'true'

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
  const isMac = typeof navigator !== 'undefined' && /Mac/.test(navigator.platform)

  return (
    <XStack
      paddingVertical="$2"
      paddingHorizontal="$3"
      borderRadius="$3"
      alignItems="center"
      justifyContent={collapsed ? 'center' : 'flex-start'}
      gap="$3"
      backgroundColor="$subtleBackground"
      hoverStyle={{ backgroundColor: '$backgroundHover' }}
      cursor="pointer"
      onPress={onPress}
      borderWidth={1}
      borderColor="$borderColor"
    >
      <Ionicons name="search-outline" size={18} color={theme.mutedText.val} />
      {!collapsed && (
        <XStack flex={1} alignItems="center" justifyContent="space-between" gap="$3">
          <Text color="$mutedText" fontSize="$2" numberOfLines={1}>
            {t('common.search')}
          </Text>
          {!isMobile && (
            <XStack alignItems="center" gap="$1.5">
              <XStack
                backgroundColor="$background"
                borderRadius="$1.5"
                width={24}
                height={24}
                alignItems="center"
                justifyContent="center"
                borderWidth={1}
                borderColor="$borderColor"
              >
                <Text fontSize={11} color="$mutedText" fontWeight="500">{isMac ? '⌘' : '⌃'}</Text>
              </XStack>
              <XStack
                backgroundColor="$background"
                borderRadius="$1.5"
                width={24}
                height={24}
                alignItems="center"
                justifyContent="center"
                borderWidth={1}
                borderColor="$borderColor"
              >
                <Text fontSize={11} color="$mutedText" fontWeight="500">K</Text>
              </XStack>
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

export function WebRootLayout() {
  const { t } = useTranslation()
  const theme = useTheme()
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
  const fontScale = useTemplateConfigStore((s) => s.fontScale)
  const fontZoom = getFontZoom(fontScale)
  const appName = useCompanyStore((s) => s.info.appName) || APP_BRAND.name
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
  const cookieBannerEnabled = useTemplateFlag('cookieBanner', true)
  const docsEnabled = useTemplateFlag('docs', true)

  const [searchQuery, setSearchQuery] = useState('')

  const docMatches = docsEnabled && searchQuery.trim()
    ? DOC_GROUPS.flatMap((group) =>
        group.pages
          .filter((page) => t(page.titleKey).toLowerCase().includes(searchQuery.trim().toLowerCase()))
          .map((page) => ({ pageId: page.id, title: t(page.titleKey) }))
      )
    : []

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

  // When sidebar is visible, admin panel is already accessible there — no need to duplicate in header
  const headerNavItems = showSidebar ? navItems.filter((item) => item.href !== '/admin') : navItems

  return (
    <YStack flex={1} backgroundColor="$background" style={{ height: '100vh' } as any}>
      {showHeader && !isMobile && (
        <WebHeader
          items={headerNavItems}
          currentPath={pathname}
          onNavigate={(href) => router.push(href as any)}
          logo={require('../../assets/icon.png')}
          title={appName}
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
            topContent={showSearchInSidebar ? (collapsed: boolean) => (
              <SearchTrigger collapsed={collapsed} onPress={() => setSearchOpen(true)} />
            ) : undefined}
            footer={(collapsed) => (
              <>
                {showBadgeInSidebar && <UserBadge collapsed={collapsed} compact={compactProfile} />}
                {showLangInSidebar && <LanguagePicker collapsed={collapsed} />}
                {showThemeInSidebar && <ThemeToggle collapsed={collapsed} />}
              </>
            )}
            logo={require('../../assets/icon.png')}
            title={appName}
          />
        )}
        <YStack flex={1} style={{ overflow: 'auto', paddingBottom: isMobile ? 64 : 0 } as any}>
          <YStack width="100%" maxWidth={1200} marginHorizontal="auto" flex={1} style={fontZoom !== 1 ? { zoom: fontZoom } as any : undefined}>
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
      <SearchModal
        open={searchOpen}
        onClose={() => { setSearchOpen(false); setSearchQuery('') }}
        onSearch={setSearchQuery}
        results={searchQuery.trim() ? (
          <YStack width="100%" gap="$2">
            {docMatches.length > 0 && (
              <YStack gap="$1">
                <Text fontSize={11} fontWeight="700" color="$mutedText" textTransform="uppercase" letterSpacing={0.5} paddingBottom="$1">
                  {t('docs.title')}
                </Text>
                {docMatches.map((match) => (
                  <Pressable
                    key={match.pageId}
                    onPress={() => {
                      router.push(`/docs/${match.pageId}` as any)
                      setSearchOpen(false)
                      setSearchQuery('')
                    }}
                  >
                    <XStack
                      paddingHorizontal="$3"
                      paddingVertical="$2.5"
                      borderRadius="$3"
                      alignItems="center"
                      gap="$3"
                      hoverStyle={{ backgroundColor: '$subtleBackground' } as any}
                    >
                      <Ionicons name="document-text-outline" size={16} color={theme.mutedText.val} />
                      <Text fontSize="$3" color="$color">{match.title}</Text>
                    </XStack>
                  </Pressable>
                ))}
              </YStack>
            )}
            {docMatches.length === 0 && (
              <YStack alignItems="center" gap="$3" paddingVertical="$4">
                <Text color="$mutedText" fontSize="$3">{t('common.noResults')}</Text>
              </YStack>
            )}
          </YStack>
        ) : undefined}
      />
      <CookieBanner enabled={cookieBannerEnabled} />
    </YStack>
  )
}
