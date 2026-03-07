import { useRef, useState, useEffect } from 'react'
import { Image, Platform, TouchableOpacity, View } from 'react-native'
import { XStack, YStack, Text, useTheme } from 'tamagui'
import { Ionicons } from '@expo/vector-icons'
import { useTranslation } from '@mvp/i18n'
import { SUPPORTED_LANGUAGES, LANGUAGE_LABELS, type SupportedLanguage } from '@mvp/i18n'
import { useThemeStore, useLanguageStore, useAuthStore, useCompanyStore } from '@mvp/store'
import { APP_BRAND } from '@mvp/template-config/src/brand'
import { MotiView, AnimatePresence } from 'moti'
import { AppAvatar } from '../components/AppAvatar'
import { ScalePress } from '../animations/ScalePress'

// Fixed colors for always-dark nav pill
const NAV_TEXT = 'rgba(240, 240, 252, 0.90)'
const NAV_MUTED = 'rgba(180, 180, 200, 0.65)'
const NAV_ICON = 'rgba(180, 180, 200, 0.70)'
const NAV_BTN_BG = 'rgba(255, 255, 255, 0.08)'
const NAV_BTN_BORDER = 'rgba(255, 255, 255, 0.14)'

interface LandingNavProps {
  onNavigate: (href: string) => void
  logo?: any
  paymentsEnabled?: boolean
}

export function LandingNav({ onNavigate, logo, paymentsEnabled = false }: LandingNavProps) {
  const { t, i18n } = useTranslation()
  const theme = useTheme()
  const { mode, setMode } = useThemeStore()
  const setLanguage = useLanguageStore((s) => s.setLanguage)
  const user = useAuthStore((s) => s.user)
  const appName = useCompanyStore((s) => s.info.appName) || APP_BRAND.name
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const [showLangPicker, setShowLangPicker] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navRef = useRef<any>(null)

  // Static CSS: responsive breakpoints
  useEffect(() => {
    if (Platform.OS !== 'web') return
    const style = document.createElement('style')
    style.textContent = `
      .lnav-links  { display: flex; }
      .lnav-auth   { display: flex; }
      .lnav-burger { display: none; }
      .lnav-mobile { display: none; }
      @media (max-width: 768px) {
        .lnav-links  { display: none !important; }
        .lnav-auth   { display: none !important; }
        .lnav-burger { display: flex !important; }
        .lnav-mobile { display: flex !important; }
      }
    `
    document.head.appendChild(style)
    return () => { document.head.removeChild(style) }
  }, [])

  // Dark glass pill — always dark, floats over the hero
  useEffect(() => {
    if (Platform.OS !== 'web') return
    const prev = document.querySelector('[data-lnav-style]')
    if (prev) prev.remove()
    const style = document.createElement('style')
    style.setAttribute('data-lnav-style', '')
    style.textContent = `
      #lnav-pill {
        background-color: rgba(8, 8, 14, 0.40) !important;
        backdrop-filter: blur(24px) saturate(1.6) !important;
        -webkit-backdrop-filter: blur(24px) saturate(1.6) !important;
        border-radius: 40px !important;
        border: 1px solid rgba(255, 255, 255, 0.08) !important;
        box-shadow: 0 4px 32px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255,255,255,0.05) !important;
        transition: background-color 0.35s ease, box-shadow 0.35s ease, border-color 0.35s ease !important;
      }
      #lnav-pill.lnav-compact {
        background-color: rgba(8, 8, 14, 0.75) !important;
        box-shadow: 0 4px 24px rgba(0, 0, 0, 0.55), inset 0 1px 0 rgba(255,255,255,0.06) !important;
        border-color: rgba(255, 255, 255, 0.12) !important;
      }
      .lnav-appname {
        display: inline-block !important;
        overflow: hidden !important;
        white-space: nowrap !important;
        max-width: 200px;
        opacity: 1;
        transition: max-width 0.35s cubic-bezier(0.4,0,0.2,1), opacity 0.25s ease !important;
      }
      #lnav-pill.lnav-compact .lnav-appname {
        max-width: 0px !important;
        opacity: 0 !important;
      }
    `
    document.head.appendChild(style)
    return () => { style.remove() }
  }, [])

  // Scroll: compact pill on scroll down (shrink width, hide app name), expand on scroll up
  useEffect(() => {
    if (Platform.OS !== 'web') return
    let lastY = 0
    let compact = false
    const THRESHOLD = 8
    const onScroll = (e: Event) => {
      const target = e.target as Element | Window
      const y = 'scrollTop' in target ? (target as Element).scrollTop : window.scrollY
      const pill = document.getElementById('lnav-pill')
      if (!pill) return
      if (y <= 20 && compact) {
        pill.classList.remove('lnav-compact')
        compact = false
      } else if (y > 40 && y > lastY + THRESHOLD && !compact) {
        pill.classList.add('lnav-compact')
        compact = true
      } else if (y < lastY - THRESHOLD && compact) {
        pill.classList.remove('lnav-compact')
        compact = false
      }
      lastY = y
    }
    document.addEventListener('scroll', onScroll as any, { passive: true, capture: true })
    return () => document.removeEventListener('scroll', onScroll as any, { capture: true } as any)
  }, [])

  if (Platform.OS !== 'web') return null

  const cycleTheme = () => {
    const cycle = ['system', 'light', 'dark'] as const
    const next = cycle[(cycle.indexOf(mode) + 1) % cycle.length]
    setMode(next)
  }

  const themeIcon = mode === 'dark' ? 'sunny-outline' : mode === 'light' ? 'moon-outline' : 'phone-portrait-outline'

  const selectLanguage = (lang: SupportedLanguage) => {
    i18n.changeLanguage(lang)
    setLanguage(lang)
    setShowLangPicker(false)
  }

  return (
    <View
      ref={navRef}
      style={{
        position: 'fixed' as any,
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        paddingTop: 12,
        paddingLeft: 16,
        paddingRight: 16,
        backgroundColor: 'transparent',
        transition: 'padding 0.4s cubic-bezier(0.4,0,0.2,1)' as any,
      }}
    >
      {/* Floating dark glass pill */}
      <View
        nativeID="lnav-pill"
        style={{
          width: '100%' as any,
          maxWidth: 1100,
          marginLeft: 'auto' as any,
          marginRight: 'auto' as any,
          paddingLeft: 20,
          paddingRight: 20,
          height: 56,
          flexDirection: 'row',
          alignItems: 'center',
        }}
      >
        {/* LEFT: Logo (collapses in compact mode) */}
        <XStack flex={1} alignItems="center" className="lnav-logo">
          <ScalePress onPress={() => onNavigate('/landing')}>
            <XStack alignItems="center" gap="$2">
              {logo ? (
                <Image source={logo} style={{ width: 28, height: 28, borderRadius: 7 }} />
              ) : (
                <YStack
                  width={28} height={28} borderRadius={7}
                  alignItems="center" justifyContent="center"
                  style={{ background: `linear-gradient(135deg, ${theme.accentGradientStart.val}, ${theme.accentGradientEnd.val})` } as any}
                >
                  <Text color="white" fontWeight="bold" fontSize={13}>M</Text>
                </YStack>
              )}
              <XStack className="lnav-appname">
                <Text fontWeight="700" fontSize="$4" color={NAV_TEXT} style={{ whiteSpace: 'nowrap' } as any}>{appName}</Text>
              </XStack>
            </XStack>
          </ScalePress>
        </XStack>

        {/* CENTER: Nav links (desktop) */}
        <XStack className="lnav-links" alignItems="center" gap="$5">
          <Text color={NAV_MUTED} fontSize="$3" fontWeight="500"
            style={{ cursor: 'pointer' } as any}
            hoverStyle={{ color: NAV_TEXT } as any}
            onPress={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}>
            {t('landing.navFeatures')}
          </Text>
          <Text color={NAV_MUTED} fontSize="$3" fontWeight="500"
            style={{ cursor: 'pointer' } as any}
            hoverStyle={{ color: NAV_TEXT } as any}
            onPress={() => document.getElementById('showcase')?.scrollIntoView({ behavior: 'smooth' })}>
            {t('landing.navShowcase')}
          </Text>
          {paymentsEnabled && (
            <Text color={NAV_MUTED} fontSize="$3" fontWeight="500"
              style={{ cursor: 'pointer' } as any}
              hoverStyle={{ color: NAV_TEXT } as any}
              onPress={() => onNavigate('/pricing')}>
              {t('landing.navPricing')}
            </Text>
          )}
        </XStack>

        {/* RIGHT: Controls + Auth (desktop) */}
        <XStack className="lnav-auth" flex={1} justifyContent="flex-end" alignItems="center" gap="$2">
          <ScalePress onPress={cycleTheme}>
            <YStack width={32} height={32} borderRadius={8} alignItems="center" justifyContent="center"
              style={{ backgroundColor: NAV_BTN_BG } as any}>
              <Ionicons name={themeIcon as any} size={15} color={NAV_ICON} />
            </YStack>
          </ScalePress>

          <YStack position="relative" zIndex={10}>
            <ScalePress onPress={() => setShowLangPicker((v) => !v)}>
              <XStack height={32} paddingHorizontal="$2" borderRadius={8} alignItems="center" gap="$1.5"
                style={{ backgroundColor: NAV_BTN_BG } as any}>
                <Ionicons name="language-outline" size={13} color={NAV_ICON} />
                <Text fontSize="$2" color={NAV_MUTED}>
                  {LANGUAGE_LABELS[i18n.language as SupportedLanguage] ?? 'EN'}
                </Text>
              </XStack>
            </ScalePress>
            <AnimatePresence>
              {showLangPicker && (
                <MotiView
                  from={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ type: 'timing', duration: 150 }}
                  style={{ position: 'absolute', top: 38, right: 0, zIndex: 20 }}
                >
                  <YStack
                    backgroundColor="$cardBackground" borderRadius="$3" borderWidth={1}
                    borderColor="$borderColor" padding="$1" minWidth={130}
                    shadowColor="$cardShadow" shadowRadius={8} shadowOpacity={1} shadowOffset={{ width: 0, height: 4 }}
                  >
                    {SUPPORTED_LANGUAGES.map((lang) => (
                      <ScalePress key={lang} onPress={() => selectLanguage(lang)}>
                        <XStack paddingHorizontal="$3" paddingVertical="$2" borderRadius="$2" alignItems="center" justifyContent="space-between"
                          hoverStyle={{ backgroundColor: '$subtleBackground' } as any}>
                          <Text fontSize="$3" color="$color">{LANGUAGE_LABELS[lang]}</Text>
                          {i18n.language === lang && <Ionicons name="checkmark" size={14} color={theme.accent.val} />}
                        </XStack>
                      </ScalePress>
                    ))}
                  </YStack>
                </MotiView>
              )}
            </AnimatePresence>
          </YStack>

          {isAuthenticated && user ? (
            <ScalePress onPress={() => onNavigate('/')}>
              <XStack alignItems="center" gap="$2" paddingLeft="$1">
                <AppAvatar name={user.name} uri={user.avatarUrl} size={28} />
                <Text fontSize="$3" fontWeight="600" color="$accent">{t('landing.goToApp')}</Text>
              </XStack>
            </ScalePress>
          ) : (
            <XStack alignItems="center" gap="$2">
              <ScalePress onPress={() => onNavigate('/sign-in')}>
                <XStack height={32} paddingHorizontal="$3.5" borderRadius={8} alignItems="center"
                  style={{ borderWidth: 1, borderStyle: 'solid', borderColor: NAV_BTN_BORDER, backgroundColor: NAV_BTN_BG } as any}>
                  <Text color={NAV_TEXT} fontSize="$3" fontWeight="500">{t('auth.signIn')}</Text>
                </XStack>
              </ScalePress>
              <ScalePress onPress={() => onNavigate('/sign-up')}>
                <XStack height={32} paddingHorizontal="$3.5" borderRadius={8} alignItems="center"
                  style={{ background: `linear-gradient(135deg, ${theme.accentGradientStart.val}, ${theme.accentGradientEnd.val})` } as any}>
                  <Text color="white" fontWeight="600" fontSize="$3">{t('landing.heroCTA')}</Text>
                </XStack>
              </ScalePress>
            </XStack>
          )}
        </XStack>

        {/* Mobile: hamburger */}
        <XStack alignItems="center" gap="$2" className="lnav-burger">
          <ScalePress onPress={cycleTheme}>
            <YStack width={32} height={32} borderRadius={8} alignItems="center" justifyContent="center"
              style={{ backgroundColor: NAV_BTN_BG } as any}>
              <Ionicons name={themeIcon as any} size={15} color={NAV_ICON} />
            </YStack>
          </ScalePress>
          <TouchableOpacity onPress={() => setMobileMenuOpen((v) => !v)}>
            <YStack width={32} height={32} borderRadius={8} alignItems="center" justifyContent="center"
              style={{ backgroundColor: NAV_BTN_BG } as any}>
              <Ionicons name={mobileMenuOpen ? 'close' : 'menu'} size={17} color={NAV_TEXT} />
            </YStack>
          </TouchableOpacity>
        </XStack>
      </View>

      {/* Mobile dropdown */}
      {mobileMenuOpen && (
        <View className="lnav-mobile" style={{
          maxWidth: 1100,
          width: '100%' as any,
          marginLeft: 'auto' as any,
          marginRight: 'auto' as any,
          marginTop: 6,
          padding: 16,
          borderRadius: 20,
          borderWidth: 1,
          borderStyle: 'solid' as any,
          borderColor: 'rgba(255,255,255,0.08)',
          backgroundColor: 'rgba(8, 8, 14, 0.92)',
          backdropFilter: 'blur(24px)' as any,
          WebkitBackdropFilter: 'blur(24px)' as any,
          flexDirection: 'column' as any,
          gap: 12,
        }}>
          <Text color={NAV_MUTED} fontSize="$3"
            onPress={() => { document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' }); setMobileMenuOpen(false) }}>
            {t('landing.navFeatures')}
          </Text>
          <Text color={NAV_MUTED} fontSize="$3"
            onPress={() => { document.getElementById('showcase')?.scrollIntoView({ behavior: 'smooth' }); setMobileMenuOpen(false) }}>
            {t('landing.navShowcase')}
          </Text>
          {paymentsEnabled && (
            <Text color={NAV_MUTED} fontSize="$3"
              onPress={() => { onNavigate('/pricing'); setMobileMenuOpen(false) }}>
              {t('landing.navPricing')}
            </Text>
          )}
          <XStack gap="$2" flexWrap="wrap">
            {SUPPORTED_LANGUAGES.map((lang) => (
              <TouchableOpacity key={lang} onPress={() => { selectLanguage(lang); setMobileMenuOpen(false) }}>
                <XStack paddingHorizontal="$2.5" paddingVertical="$1.5" borderRadius="$2" borderWidth={1}
                  borderColor={i18n.language === lang ? '$accent' : '$borderColor'}
                  backgroundColor={i18n.language === lang ? `${theme.accent.val}15` : 'transparent'}>
                  <Text fontSize="$2" color={i18n.language === lang ? '$accent' : NAV_MUTED}>{LANGUAGE_LABELS[lang]}</Text>
                </XStack>
              </TouchableOpacity>
            ))}
          </XStack>
          {isAuthenticated && user ? (
            <TouchableOpacity onPress={() => { onNavigate('/'); setMobileMenuOpen(false) }}>
              <XStack alignItems="center" gap="$2">
                <AppAvatar name={user.name} uri={user.avatarUrl} size={28} />
                <Text fontSize="$3" fontWeight="600" color="$accent">{t('landing.goToApp')}</Text>
              </XStack>
            </TouchableOpacity>
          ) : (
            <XStack gap="$3" alignItems="center">
              <Text color={NAV_MUTED} fontSize="$3"
                onPress={() => { onNavigate('/sign-in'); setMobileMenuOpen(false) }}>
                {t('auth.signIn')}
              </Text>
              <TouchableOpacity onPress={() => { onNavigate('/sign-up'); setMobileMenuOpen(false) }}>
                <XStack paddingHorizontal="$3" paddingVertical="$1.5" borderRadius={8}
                  style={{ background: `linear-gradient(135deg, ${theme.accentGradientStart.val}, ${theme.accentGradientEnd.val})` } as any}>
                  <Text color="white" fontWeight="600" fontSize="$3">{t('landing.heroCTA')}</Text>
                </XStack>
              </TouchableOpacity>
            </XStack>
          )}
        </View>
      )}
    </View>
  )
}
