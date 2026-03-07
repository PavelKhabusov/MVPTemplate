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
  const pillRef = useRef<any>(null)

  // Responsive CSS for className-based visibility
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

  // Compact on scroll down, expand on scroll up — direct DOM manipulation for 60fps
  useEffect(() => {
    if (Platform.OS !== 'web') return
    let lastY = 0
    const onScroll = () => {
      const y = window.scrollY
      const nav = navRef.current
      const pill = pillRef.current
      if (!nav || !pill) return
      if (y <= 20) {
        nav.style.paddingTop = '12px'
        pill.style.height = '56px'
        pill.style.boxShadow = '0 4px 24px rgba(0,0,0,0.10)'
      } else if (y > lastY) {
        nav.style.paddingTop = '4px'
        pill.style.height = '44px'
        pill.style.boxShadow = '0 8px 40px rgba(0,0,0,0.18)'
      } else {
        nav.style.paddingTop = '12px'
        pill.style.height = '56px'
        pill.style.boxShadow = '0 4px 24px rgba(0,0,0,0.10)'
      }
      lastY = y
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
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

  // Pill visual styles derived from theme — applied directly, no Tamagui override possible
  const pillStyle: any = {
    width: '100%',
    maxWidth: 1100,
    marginLeft: 'auto',
    marginRight: 'auto',
    paddingLeft: 20,
    paddingRight: 20,
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${theme.background.val}f0`,
    backdropFilter: 'blur(20px) saturate(1.8)',
    WebkitBackdropFilter: 'blur(20px) saturate(1.8)',
    borderRadius: 14,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: theme.borderColor.val,
    boxShadow: '0 4px 24px rgba(0,0,0,0.10)',
    transition: 'height 0.35s cubic-bezier(0.4,0,0.2,1), box-shadow 0.35s ease',
  }

  const mobileDropdownStyle: any = {
    maxWidth: 1100,
    width: '100%',
    marginLeft: 'auto',
    marginRight: 'auto',
    marginTop: 6,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: theme.borderColor.val,
    backgroundColor: `${theme.background.val}f2`,
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    flexDirection: 'column',
    gap: 12,
  }

  return (
    // Plain View — no Tamagui interference with background/styling
    <View
      ref={navRef}
      style={{
        position: 'sticky' as any,
        top: 0,
        zIndex: 100,
        paddingTop: 12,
        paddingLeft: 16,
        paddingRight: 16,
        backgroundColor: 'transparent',
        transition: 'padding-top 0.35s cubic-bezier(0.4,0,0.2,1)' as any,
      }}
    >
      {/* Floating nav card */}
      <View ref={pillRef} style={pillStyle}>

        {/* LEFT: Logo */}
        <XStack flex={1} alignItems="center">
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
              <Text fontWeight="700" fontSize="$4" color="$color">{appName}</Text>
            </XStack>
          </ScalePress>
        </XStack>

        {/* CENTER: Nav links (desktop) */}
        <XStack className="lnav-links" alignItems="center" gap="$5">
          <Text color="$mutedText" fontSize="$3" fontWeight="500"
            style={{ cursor: 'pointer' } as any}
            hoverStyle={{ color: '$color' } as any}
            onPress={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}>
            {t('landing.navFeatures')}
          </Text>
          <Text color="$mutedText" fontSize="$3" fontWeight="500"
            style={{ cursor: 'pointer' } as any}
            hoverStyle={{ color: '$color' } as any}
            onPress={() => document.getElementById('showcase')?.scrollIntoView({ behavior: 'smooth' })}>
            {t('landing.navShowcase')}
          </Text>
          {paymentsEnabled && (
            <Text color="$mutedText" fontSize="$3" fontWeight="500"
              style={{ cursor: 'pointer' } as any}
              hoverStyle={{ color: '$color' } as any}
              onPress={() => onNavigate('/pricing')}>
              {t('landing.navPricing')}
            </Text>
          )}
        </XStack>

        {/* RIGHT: Controls + Auth (desktop) */}
        <XStack className="lnav-auth" flex={1} justifyContent="flex-end" alignItems="center" gap="$2">
          <ScalePress onPress={cycleTheme}>
            <YStack width={32} height={32} borderRadius={8} alignItems="center" justifyContent="center" backgroundColor="$subtleBackground">
              <Ionicons name={themeIcon as any} size={15} color={theme.mutedText.val} />
            </YStack>
          </ScalePress>

          <YStack position="relative" zIndex={10}>
            <ScalePress onPress={() => setShowLangPicker((v) => !v)}>
              <XStack height={32} paddingHorizontal="$2" borderRadius={8} alignItems="center" gap="$1.5" backgroundColor="$subtleBackground">
                <Ionicons name="language-outline" size={13} color={theme.mutedText.val} />
                <Text fontSize="$2" color="$mutedText">
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
                  borderWidth={1} borderColor="$borderColor" backgroundColor="$subtleBackground">
                  <Text color="$color" fontSize="$3" fontWeight="500">{t('auth.signIn')}</Text>
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
            <YStack width={32} height={32} borderRadius={8} alignItems="center" justifyContent="center" backgroundColor="$subtleBackground">
              <Ionicons name={themeIcon as any} size={15} color={theme.mutedText.val} />
            </YStack>
          </ScalePress>
          <TouchableOpacity onPress={() => setMobileMenuOpen((v) => !v)}>
            <YStack width={32} height={32} borderRadius={8} alignItems="center" justifyContent="center" backgroundColor="$subtleBackground">
              <Ionicons name={mobileMenuOpen ? 'close' : 'menu'} size={17} color={theme.color.val} />
            </YStack>
          </TouchableOpacity>
        </XStack>
      </View>

      {/* Mobile dropdown */}
      {mobileMenuOpen && (
        <View className="lnav-mobile" style={mobileDropdownStyle}>
          <Text color="$mutedText" fontSize="$3"
            onPress={() => { document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' }); setMobileMenuOpen(false) }}>
            {t('landing.navFeatures')}
          </Text>
          <Text color="$mutedText" fontSize="$3"
            onPress={() => { document.getElementById('showcase')?.scrollIntoView({ behavior: 'smooth' }); setMobileMenuOpen(false) }}>
            {t('landing.navShowcase')}
          </Text>
          {paymentsEnabled && (
            <Text color="$mutedText" fontSize="$3"
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
                  <Text fontSize="$2" color={i18n.language === lang ? '$accent' : '$mutedText'}>{LANGUAGE_LABELS[lang]}</Text>
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
              <Text color="$mutedText" fontSize="$3"
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
