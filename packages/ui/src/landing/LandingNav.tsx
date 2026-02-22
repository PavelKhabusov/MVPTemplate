import { useState, useEffect } from 'react'
import { Image, Platform, TouchableOpacity } from 'react-native'
import { XStack, YStack, Text, useTheme } from 'tamagui'
import { Ionicons } from '@expo/vector-icons'
import { useTranslation } from '@mvp/i18n'
import { SUPPORTED_LANGUAGES, LANGUAGE_LABELS, type SupportedLanguage } from '@mvp/i18n'
import { useThemeStore, useLanguageStore, useAuthStore } from '@mvp/store'
import { useTemplateFlag } from '@mvp/template-config'
import { MotiView, AnimatePresence } from 'moti'
import { AppAvatar } from '../components/AppAvatar'
import { ScalePress } from '../animations/ScalePress'

interface LandingNavProps {
  onNavigate: (href: string) => void
  logo?: any
}

export function LandingNav({ onNavigate, logo }: LandingNavProps) {
  const { t, i18n } = useTranslation()
  const theme = useTheme()
  const { mode, setMode } = useThemeStore()
  const setLanguage = useLanguageStore((s) => s.setLanguage)
  const user = useAuthStore((s) => s.user)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const [showLangPicker, setShowLangPicker] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const paymentsEnabled = useTemplateFlag('payments', false)

  // Inject responsive CSS
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
    `
    document.head.appendChild(style)
    return () => { document.head.removeChild(style) }
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
      top={0}
      zIndex={100}
      backgroundColor="$background"
      borderBottomWidth={1}
      borderBottomColor="$borderColor"
      style={{
        position: 'sticky',
        backdropFilter: 'blur(12px)',
        backgroundColor: `${theme.background.val}ee`,
      } as any}
    >
      <XStack
        width="100%"
        maxWidth={1200}
        paddingHorizontal="$4"
        height={56}
        alignItems="center"
        justifyContent="space-between"
        style={{ margin: '0 auto' } as any}
      >
        {/* Logo */}
        <ScalePress onPress={() => onNavigate('/landing')}>
          <XStack alignItems="center" gap="$2">
            {logo ? (
              <Image source={logo} style={{ width: 32, height: 32, borderRadius: 8 }} />
            ) : (
              <YStack
                width={32}
                height={32}
                borderRadius={8}
                alignItems="center"
                justifyContent="center"
                style={{
                  background: `linear-gradient(135deg, ${theme.accentGradientStart.val}, ${theme.accentGradientEnd.val})`,
                } as any}
              >
                <Text color="white" fontWeight="bold" fontSize={16}>M</Text>
              </YStack>
            )}
            <Text fontWeight="bold" fontSize="$4" color="$color">MVP Template</Text>
          </XStack>
        </ScalePress>

        {/* Desktop right section */}
        <XStack alignItems="center" gap="$3" className="landing-nav-desktop">
          <Text
            color="$mutedText" fontSize="$3" cursor="pointer"
            hoverStyle={{ color: '$color' } as any}
            onPress={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
          >
            {t('landing.navFeatures')}
          </Text>
          <Text
            color="$mutedText" fontSize="$3" cursor="pointer"
            hoverStyle={{ color: '$color' } as any}
            onPress={() => document.getElementById('showcase')?.scrollIntoView({ behavior: 'smooth' })}
          >
            {t('landing.navShowcase')}
          </Text>
          {paymentsEnabled && (
            <Text
              color="$mutedText" fontSize="$3" cursor="pointer"
              hoverStyle={{ color: '$color' } as any}
              onPress={() => onNavigate('/pricing')}
            >
              {t('landing.navPricing')}
            </Text>
          )}

          <ScalePress onPress={cycleTheme}>
            <YStack width={36} height={36} borderRadius={18} alignItems="center" justifyContent="center" backgroundColor="$subtleBackground">
              <Ionicons name={themeIcon as any} size={18} color={theme.mutedText.val} />
            </YStack>
          </ScalePress>

          <YStack position="relative" zIndex={10}>
            <ScalePress onPress={() => setShowLangPicker((v) => !v)}>
              <XStack height={36} paddingHorizontal="$2.5" borderRadius={18} alignItems="center" gap="$1.5" backgroundColor="$subtleBackground">
                <Ionicons name="language-outline" size={16} color={theme.mutedText.val} />
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
                        <XStack paddingHorizontal="$3" paddingVertical="$2" borderRadius="$2" alignItems="center" justifyContent="space-between" hoverStyle={{ backgroundColor: '$subtleBackground' } as any}>
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
                <AppAvatar name={user.name} uri={user.avatarUrl} size={32} />
                <Text fontSize="$3" fontWeight="600" color="$accent">{t('landing.goToApp')}</Text>
              </XStack>
            </ScalePress>
          ) : (
            <XStack alignItems="center" gap="$3" paddingLeft="$2">
              <Text color="$mutedText" fontSize="$3" cursor="pointer" hoverStyle={{ color: '$color' } as any} onPress={() => onNavigate('/sign-in')}>
                {t('auth.signIn')}
              </Text>
              <ScalePress onPress={() => onNavigate('/sign-up')}>
                <XStack backgroundColor="$accent" paddingHorizontal="$3.5" paddingVertical="$2" borderRadius="$3">
                  <Text color="white" fontWeight="600" fontSize="$3">{t('landing.heroCTA')}</Text>
                </XStack>
              </ScalePress>
            </XStack>
          )}
        </XStack>

        {/* Mobile hamburger */}
        <XStack alignItems="center" gap="$2" className="landing-nav-burger">
          <ScalePress onPress={cycleTheme}>
            <YStack width={36} height={36} borderRadius={18} alignItems="center" justifyContent="center" backgroundColor="$subtleBackground">
              <Ionicons name={themeIcon as any} size={18} color={theme.mutedText.val} />
            </YStack>
          </ScalePress>
          <TouchableOpacity onPress={() => setMobileMenuOpen((v) => !v)}>
            <YStack width={36} height={36} borderRadius={18} alignItems="center" justifyContent="center" backgroundColor="$subtleBackground">
              <Ionicons name={mobileMenuOpen ? 'close' : 'menu'} size={20} color={theme.color.val} />
            </YStack>
          </TouchableOpacity>
        </XStack>
      </XStack>

      {/* Mobile dropdown menu */}
      {mobileMenuOpen && (
        <YStack
          className="landing-mobile-menu"
          paddingHorizontal="$4"
          paddingBottom="$4"
          gap="$3"
          borderBottomWidth={1}
          borderBottomColor="$borderColor"
          style={{ flexDirection: 'column' } as any}
        >
          <Text color="$mutedText" fontSize="$3" onPress={() => { document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' }); setMobileMenuOpen(false) }}>
            {t('landing.navFeatures')}
          </Text>
          <Text color="$mutedText" fontSize="$3" onPress={() => { document.getElementById('showcase')?.scrollIntoView({ behavior: 'smooth' }); setMobileMenuOpen(false) }}>
            {t('landing.navShowcase')}
          </Text>
          {paymentsEnabled && (
            <Text color="$mutedText" fontSize="$3" onPress={() => { onNavigate('/pricing'); setMobileMenuOpen(false) }}>
              {t('landing.navPricing')}
            </Text>
          )}

          <XStack gap="$2" flexWrap="wrap">
            {SUPPORTED_LANGUAGES.map((lang) => (
              <TouchableOpacity key={lang} onPress={() => { selectLanguage(lang); setMobileMenuOpen(false) }}>
                <XStack paddingHorizontal="$2.5" paddingVertical="$1.5" borderRadius="$2" borderWidth={1} borderColor={i18n.language === lang ? '$accent' : '$borderColor'} backgroundColor={i18n.language === lang ? `${theme.accent.val}15` : 'transparent'}>
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
              <Text color="$mutedText" fontSize="$3" onPress={() => { onNavigate('/sign-in'); setMobileMenuOpen(false) }}>
                {t('auth.signIn')}
              </Text>
              <TouchableOpacity onPress={() => { onNavigate('/sign-up'); setMobileMenuOpen(false) }}>
                <XStack backgroundColor="$accent" paddingHorizontal="$3" paddingVertical="$1.5" borderRadius="$3">
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
