import { useState, useEffect } from 'react'
import { Image, Platform, TouchableOpacity } from 'react-native'
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

  // Inject responsive CSS + floating pill transitions
  useEffect(() => {
    if (Platform.OS !== 'web') return
    const style = document.createElement('style')
    style.textContent = `
      .landing-nav-desktop { display: flex; }
      .landing-nav-burger { display: none; }
      .landing-mobile-menu { display: none; }
      @media (max-width: 768px) {
        .landing-nav-desktop { display: none !important; }
        .landing-nav-burger { display: flex !important; }
        .landing-mobile-menu { display: flex !important; }
      }
      #landing-nav-root {
        transition: padding-top 0.4s cubic-bezier(0.4,0,0.2,1);
      }
      #landing-nav-pill {
        transition:
          height 0.4s cubic-bezier(0.4,0,0.2,1),
          box-shadow 0.4s ease,
          border-color 0.4s ease;
      }
      #landing-nav-root.nav-compact {
        padding-top: 6px !important;
      }
      #landing-nav-root.nav-compact #landing-nav-pill {
        height: 44px !important;
        box-shadow: 0 8px 40px rgba(0,0,0,0.16) !important;
        backdrop-filter: blur(32px) saturate(2.5) !important;
        -webkit-backdrop-filter: blur(32px) saturate(2.5) !important;
      }
    `
    document.head.appendChild(style)
    return () => { document.head.removeChild(style) }
  }, [])

  // Compact on scroll down, expand on scroll up
  useEffect(() => {
    if (Platform.OS !== 'web') return
    let lastY = 0
    const onScroll = () => {
      const y = window.scrollY
      const nav = document.getElementById('landing-nav-root')
      if (!nav) return
      if (y <= 20) nav.classList.remove('nav-compact')
      else if (y > lastY) nav.classList.add('nav-compact')
      else nav.classList.remove('nav-compact')
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

  return (
    <YStack
      nativeID="landing-nav-root"
      top={0}
      zIndex={100}
      paddingTop="$3"
      paddingHorizontal="$4"
      backgroundColor="transparent"
      style={{ position: 'sticky' } as any}
    >
      {/* Floating pill */}
      <XStack
        nativeID="landing-nav-pill"
        width="100%"
        maxWidth={1200}
        paddingHorizontal="$4"
        height={54}
        alignItems="center"
        justifyContent="space-between"
        borderRadius={20}
        borderWidth={1}
        borderColor="$borderColor"
        style={{
          margin: '0 auto',
          backdropFilter: 'blur(20px) saturate(1.8)',
          WebkitBackdropFilter: 'blur(20px) saturate(1.8)',
          backgroundColor: `${theme.background.val}d0`,
          boxShadow: '0 2px 16px rgba(0,0,0,0.06)',
        } as any}
      >
        {/* Logo */}
        <ScalePress onPress={() => onNavigate('/landing')}>
          <XStack alignItems="center" gap="$2">
            {logo ? (
              <Image source={logo} style={{ width: 30, height: 30, borderRadius: 8 }} />
            ) : (
              <YStack
                width={30} height={30} borderRadius={8}
                alignItems="center" justifyContent="center"
                style={{ background: `linear-gradient(135deg, ${theme.accentGradientStart.val}, ${theme.accentGradientEnd.val})` } as any}
              >
                <Text color="white" fontWeight="bold" fontSize={14}>M</Text>
              </YStack>
            )}
            <Text fontWeight="bold" fontSize="$4" color="$color">{appName}</Text>
          </XStack>
        </ScalePress>

        {/* Desktop right section */}
        <XStack alignItems="center" gap="$3" className="landing-nav-desktop">
          <Text color="$mutedText" fontSize="$3" cursor="pointer"
            hoverStyle={{ color: '$color' } as any}
            onPress={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}>
            {t('landing.navFeatures')}
          </Text>
          <Text color="$mutedText" fontSize="$3" cursor="pointer"
            hoverStyle={{ color: '$color' } as any}
            onPress={() => document.getElementById('showcase')?.scrollIntoView({ behavior: 'smooth' })}>
            {t('landing.navShowcase')}
          </Text>
          {paymentsEnabled && (
            <Text color="$mutedText" fontSize="$3" cursor="pointer"
              hoverStyle={{ color: '$color' } as any}
              onPress={() => onNavigate('/pricing')}>
              {t('landing.navPricing')}
            </Text>
          )}

          <ScalePress onPress={cycleTheme}>
            <YStack width={34} height={34} borderRadius={17} alignItems="center" justifyContent="center" backgroundColor="$subtleBackground">
              <Ionicons name={themeIcon as any} size={16} color={theme.mutedText.val} />
            </YStack>
          </ScalePress>

          <YStack position="relative" zIndex={10}>
            <ScalePress onPress={() => setShowLangPicker((v) => !v)}>
              <XStack height={34} paddingHorizontal="$2.5" borderRadius={17} alignItems="center" gap="$1.5" backgroundColor="$subtleBackground">
                <Ionicons name="language-outline" size={14} color={theme.mutedText.val} />
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
                  style={{ position: 'absolute', top: 42, right: 0, zIndex: 20 }}
                >
                  <YStack
                    backgroundColor="$cardBackground" borderRadius="$3" borderWidth={1}
                    borderColor="$borderColor" padding="$1" minWidth={140}
                    shadowColor="$cardShadow" shadowRadius={8} shadowOpacity={1} shadowOffset={{ width: 0, height: 4 }}
                  >
                    {SUPPORTED_LANGUAGES.map((lang) => (
                      <ScalePress key={lang} onPress={() => selectLanguage(lang)}>
                        <XStack paddingHorizontal="$3" paddingVertical="$2" borderRadius="$2" alignItems="center" justifyContent="space-between"
                          hoverStyle={{ backgroundColor: '$subtleBackground' } as any}>
                          <Text fontSize="$3" color="$color">{LANGUAGE_LABELS[lang]}</Text>
                          {i18n.language === lang && <Ionicons name="checkmark" size={16} color={theme.accent.val} />}
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
              <XStack alignItems="center" gap="$2" paddingLeft="$2">
                <AppAvatar name={user.name} uri={user.avatarUrl} size={30} />
                <Text fontSize="$3" fontWeight="600" color="$accent">{t('landing.goToApp')}</Text>
              </XStack>
            </ScalePress>
          ) : (
            <XStack alignItems="center" gap="$3" paddingLeft="$2">
              <Text color="$mutedText" fontSize="$3" cursor="pointer"
                hoverStyle={{ color: '$color' } as any}
                onPress={() => onNavigate('/sign-in')}>
                {t('auth.signIn')}
              </Text>
              <ScalePress onPress={() => onNavigate('/sign-up')}>
                <XStack
                  paddingHorizontal="$4" paddingVertical="$2" borderRadius={12}
                  style={{ background: `linear-gradient(135deg, ${theme.accentGradientStart.val}, ${theme.accentGradientEnd.val})` } as any}
                >
                  <Text color="white" fontWeight="600" fontSize="$3">{t('landing.heroCTA')}</Text>
                </XStack>
              </ScalePress>
            </XStack>
          )}
        </XStack>

        {/* Mobile hamburger */}
        <XStack alignItems="center" gap="$2" className="landing-nav-burger">
          <ScalePress onPress={cycleTheme}>
            <YStack width={34} height={34} borderRadius={17} alignItems="center" justifyContent="center" backgroundColor="$subtleBackground">
              <Ionicons name={themeIcon as any} size={16} color={theme.mutedText.val} />
            </YStack>
          </ScalePress>
          <TouchableOpacity onPress={() => setMobileMenuOpen((v) => !v)}>
            <YStack width={34} height={34} borderRadius={17} alignItems="center" justifyContent="center" backgroundColor="$subtleBackground">
              <Ionicons name={mobileMenuOpen ? 'close' : 'menu'} size={18} color={theme.color.val} />
            </YStack>
          </TouchableOpacity>
        </XStack>
      </XStack>

      {/* Mobile dropdown — separate card below pill */}
      {mobileMenuOpen && (
        <YStack
          className="landing-mobile-menu"
          maxWidth={1200}
          width="100%"
          paddingHorizontal="$4"
          paddingVertical="$4"
          gap="$3"
          borderRadius={16}
          borderWidth={1}
          borderColor="$borderColor"
          style={{
            margin: '8px auto 0',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            backgroundColor: `${theme.background.val}e8`,
            flexDirection: 'column',
          } as any}
        >
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
                <XStack paddingHorizontal="$3" paddingVertical="$1.5" borderRadius={10}
                  style={{ background: `linear-gradient(135deg, ${theme.accentGradientStart.val}, ${theme.accentGradientEnd.val})` } as any}>
                  <Text color="white" fontWeight="600" fontSize="$3">{t('landing.heroCTA')}</Text>
                </XStack>
              </TouchableOpacity>
            </XStack>
          )}
        </YStack>
      )}
    </YStack>
  )
}
