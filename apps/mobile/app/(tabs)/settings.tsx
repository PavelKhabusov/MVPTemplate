import { useState, useCallback, useEffect } from 'react'
import { Platform, RefreshControl, ScrollView, Modal } from 'react-native'
import { YStack, XStack, Text, H2, useTheme } from 'tamagui'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { useTranslation } from '@mvp/i18n'
import { SUPPORTED_LANGUAGES, LANGUAGE_LABELS } from '@mvp/i18n'
import type { SupportedLanguage } from '@mvp/i18n'
import { useAuthStore, useThemeStore, useLanguageStore, useCompanyStore, useAppStore } from '@mvp/store'
import type { ThemeMode } from '@mvp/store'
import {
  FadeIn,
  SlideIn,
  AppAvatar,
  AppButton,
  AppCard,
  ScalePress,
  CollapsibleHeader,
  HEADER_EXPANDED,
  StaggerGroup,
  SettingsGroup,
  SettingsGroupItem,
  AppModal,
} from '@mvp/ui'
import { X, Layers, Check } from 'lucide-react-native'
import { useTemplateFlag } from '@mvp/template-config'
import { AnimatePresence, MotiView } from 'moti'
import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
} from 'react-native-reanimated'
import { authApi } from '../../src/services/auth'
import { NotificationCenter } from '@mvp/notifications'
import { api } from '../../src/services/api'
import { APP_CONFIG } from '../../src/config/app'

const THEME_LABELS: Record<ThemeMode, string> = {
  system: 'settings.themeSystem',
  light: 'settings.themeLight',
  dark: 'settings.themeDark',
}

const THEME_CYCLE: ThemeMode[] = ['system', 'light', 'dark']

// ---------------------------------------------------------------------------
// Shared hook: common state & callbacks used by all 3 views
// ---------------------------------------------------------------------------

function useSettingsCommon() {
  const { t, i18n } = useTranslation()
  const theme = useTheme()
  const { mode, setMode } = useThemeStore()
  const setLanguage = useLanguageStore((s) => s.setLanguage)
  const docsEnabled = useTemplateFlag('docs', true)
  const pushEnabled = useTemplateFlag('pushNotifications', false)
  const onboardingEnabled = useTemplateFlag('onboarding', true)
  const resetOnboarding = useAppStore((s) => s.resetOnboarding)
  const [showLangPicker, setShowLangPicker] = useState(false)
  const [showAbout, setShowAbout] = useState(false)

  const cycleTheme = () => {
    const currentIdx = THEME_CYCLE.indexOf(mode)
    const next = THEME_CYCLE[(currentIdx + 1) % THEME_CYCLE.length]
    setMode(next)
  }

  const selectLanguage = (lang: SupportedLanguage) => {
    i18n.changeLanguage(lang)
    setLanguage(lang)
    setShowLangPicker(false)
  }

  const handleReplayTour = () => {
    resetOnboarding()
    router.push('/')
  }

  return {
    t,
    i18n,
    theme,
    mode,
    docsEnabled,
    pushEnabled,
    onboardingEnabled,
    showLangPicker,
    setShowLangPicker,
    showAbout,
    setShowAbout,
    cycleTheme,
    selectLanguage,
    handleReplayTour,
  }
}

// ---------------------------------------------------------------------------
// Shared sections
// ---------------------------------------------------------------------------

function AppearanceSection({
  mode,
  cycleTheme,
  currentLang,
  showLangPicker,
  toggleLangPicker,
  selectLanguage,
}: {
  mode: ThemeMode
  cycleTheme: () => void
  currentLang: SupportedLanguage
  showLangPicker: boolean
  toggleLangPicker: () => void
  selectLanguage: (lang: SupportedLanguage) => void
}) {
  const { t } = useTranslation()

  return (
    <>
      <SettingsGroup header={t('settings.theme')}>
        <SettingsGroupItem
          icon="color-palette-outline"
          label={t('settings.theme')}
          value={t(THEME_LABELS[mode])}
          onPress={cycleTheme}
        />
        <SettingsGroupItem
          icon="language-outline"
          label={t('settings.language')}
          value={LANGUAGE_LABELS[currentLang] ?? currentLang}
          onPress={toggleLangPicker}
        />
      </SettingsGroup>

      <AnimatePresence>
        {showLangPicker && (
          <MotiView
            from={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: 'timing', duration: 200 }}
          >
            <LanguagePicker
              currentLang={currentLang}
              onSelect={selectLanguage}
            />
          </MotiView>
        )}
      </AnimatePresence>
    </>
  )
}

function GeneralSection({
  pushEnabled,
  docsEnabled,
  onboardingEnabled,
  onNotifications,
  onReplayTour,
  onShowAbout,
  showPricing,
}: {
  pushEnabled: boolean
  docsEnabled: boolean
  onboardingEnabled: boolean
  onNotifications: () => void
  onReplayTour: () => void
  onShowAbout: () => void
  showPricing?: boolean
}) {
  const { t } = useTranslation()

  return (
    <SettingsGroup header={t('settings.title')}>
      {showPricing && (
        <SettingsGroupItem
          icon="pricetags-outline"
          label={t('payments.title')}
          onPress={() => router.push('/pricing')}
        />
      )}
      {pushEnabled && (
        <SettingsGroupItem
          icon="notifications-outline"
          label={t('settings.notifications')}
          onPress={onNotifications}
        />
      )}
      {docsEnabled && (
        <SettingsGroupItem
          icon="book-outline"
          label={t('docs.title')}
          onPress={() => router.push('/docs')}
        />
      )}
      {onboardingEnabled && (
        <SettingsGroupItem
          icon="compass-outline"
          label={t('settings.replayTour')}
          onPress={onReplayTour}
        />
      )}
      <SettingsGroupItem
        icon="information-circle-outline"
        label={t('settings.about')}
        value={APP_CONFIG.version}
        onPress={onShowAbout}
      />
    </SettingsGroup>
  )
}

function DocumentsSection() {
  const { t } = useTranslation()

  return (
    <SettingsGroup header={t('settings.documents')}>
      <SettingsGroupItem
        icon="shield-outline"
        label={t('settings.privacy')}
        onPress={() => router.push('/privacy')}
      />
      <SettingsGroupItem
        icon="document-text-outline"
        label={t('settings.terms')}
        onPress={() => router.push('/terms')}
      />
      <SettingsGroupItem
        icon="newspaper-outline"
        label={t('settings.offer')}
        onPress={() => router.push('/offer')}
      />
    </SettingsGroup>
  )
}

function AccountSection({ user, showEditProfile }: { user: any; showEditProfile?: boolean }) {
  const { t } = useTranslation()

  const hasItems = showEditProfile || user?.phone || user?.bio || user?.location || user?.birthday
  if (!hasItems) return null

  return (
    <SettingsGroup header={t('profile.title')}>
      {showEditProfile && (
        <SettingsGroupItem
          icon="pencil-outline"
          label={t('profile.editProfile')}
          onPress={() => router.push('/edit-profile')}
        />
      )}
      {user?.phone ? (
        <SettingsGroupItem
          icon="call-outline"
          label={t('profile.phone')}
          value={user.phone}
        />
      ) : null}
      {user?.bio ? (
        <SettingsGroupItem
          icon="document-text-outline"
          label={t('profile.bio')}
          value={user.bio.length > 30 ? user.bio.slice(0, 30) + '...' : user.bio}
        />
      ) : null}
      {user?.location ? (
        <SettingsGroupItem
          icon="location-outline"
          label={t('profile.location')}
          value={user.location}
        />
      ) : null}
      {user?.birthday ? (
        <SettingsGroupItem
          icon="calendar-outline"
          label={t('profile.birthday')}
          value={new Date(user.birthday).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
        />
      ) : null}
    </SettingsGroup>
  )
}

function AdminSection() {
  const { t } = useTranslation()

  return (
    <SettingsGroup header={t('admin.title')}>
      <SettingsGroupItem
        icon="shield-checkmark-outline"
        label={t('admin.title')}
        onPress={() => router.push('/admin')}
      />
    </SettingsGroup>
  )
}

function SignOutSection({ onSignOut }: { onSignOut: () => void }) {
  const { t } = useTranslation()

  return (
    <SettingsGroup>
      <SettingsGroupItem
        icon="log-out-outline"
        label={t('settings.signOut')}
        onPress={onSignOut}
        danger
      />
    </SettingsGroup>
  )
}

function SignInPrompt() {
  const { t } = useTranslation()

  return (
    <YStack alignItems="center" gap="$3" paddingVertical="$2">
      <AppAvatar name="?" size={64} />
      <Text color="$mutedText" textAlign="center" maxWidth={300}>
        {t('profile.signInPrompt')}
      </Text>
      <XStack gap="$3">
        <AppButton onPress={() => router.push('/sign-in')} size="sm">
          {t('auth.signIn')}
        </AppButton>
        <AppButton variant="outline" onPress={() => router.push('/sign-up')} size="sm">
          {t('auth.createAccount')}
        </AppButton>
      </XStack>
    </YStack>
  )
}

// ---------------------------------------------------------------------------
// Root component
// ---------------------------------------------------------------------------

export default function SettingsScreen() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  if (Platform.OS === 'web') {
    return <WebSettingsView />
  }

  if (isAuthenticated) {
    return <AuthenticatedSettingsView />
  }

  return <UnauthenticatedSettingsView />
}

// ---------------------------------------------------------------------------
// Modals (unchanged)
// ---------------------------------------------------------------------------

function NotificationModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const theme = useTheme()
  const emailEnabled = useTemplateFlag('email', false)

  useEffect(() => {
    if (Platform.OS === 'web' && visible) {
      const prev = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => { document.body.style.overflow = prev }
    }
  }, [visible])

  if (!visible) return null

  if (Platform.OS === 'web') {
    return (
      <YStack
        // @ts-ignore — fixed position for web overlay
        style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, backgroundColor: theme.background.val, overflow: 'auto' }}
      >
        <XStack justifyContent="flex-end" padding="$3">
          <ScalePress onPress={onClose}>
            <X size={24} color={theme.color.val} />
          </ScalePress>
        </XStack>
        <NotificationCenter http={api} emailEnabled={emailEnabled} />
      </YStack>
    )
  }

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <YStack flex={1} backgroundColor="$background">
        <XStack justifyContent="flex-end" padding="$3" paddingTop={60}>
          <ScalePress onPress={onClose}>
            <X size={24} color={theme.color.val} />
          </ScalePress>
        </XStack>
        <NotificationCenter http={api} emailEnabled={emailEnabled} />
      </YStack>
    </Modal>
  )
}

function AboutInfoRow({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <XStack
      paddingVertical="$3"
      paddingHorizontal="$4"
      backgroundColor="$subtleBackground"
      borderRadius="$3"
      justifyContent="space-between"
      alignItems="center"
    >
      <Text fontSize="$3" color="$mutedText">{label}</Text>
      <Text fontSize="$3" color={accent ? '$accent' : '$color'} fontWeight="500">{value}</Text>
    </XStack>
  )
}

function AboutModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { t } = useTranslation()
  const theme = useTheme()
  const company = useCompanyStore((s) => s.info)

  const displayName = company.appName || APP_CONFIG.name
  const displayCompany = company.companyName || APP_CONFIG.developer

  return (
    <AppModal visible={visible} onClose={onClose} title={t('settings.about')} maxWidth={400}>
      <YStack alignItems="center" gap="$5" paddingVertical="$2">
        <YStack alignItems="center" gap="$2">
          <YStack
            width={72}
            height={72}
            borderRadius="$5"
            backgroundColor="$subtleBackground"
            borderWidth={1}
            borderColor="$borderColor"
            alignItems="center"
            justifyContent="center"
          >
            <Layers size={36} color={theme.accent.val} />
          </YStack>
          <Text fontSize="$6" fontWeight="700" color="$color">{displayName}</Text>
          {company.tagline ? (
            <Text fontSize="$2" color="$mutedText" textAlign="center">{company.tagline}</Text>
          ) : null}
          <Text fontSize="$2" color="$mutedText">v{APP_CONFIG.version}</Text>
        </YStack>

        <YStack width="100%" gap="$2">
          <AboutInfoRow label={t('settings.version')} value={APP_CONFIG.version} />
          <AboutInfoRow label={t('settings.developer')} value={displayCompany} />
          {company.website ? (
            <AboutInfoRow label={t('admin.companyWebsite')} value={company.website} accent />
          ) : null}
          {company.supportEmail ? (
            <AboutInfoRow label={t('admin.companySupportEmail')} value={company.supportEmail} accent />
          ) : null}
        </YStack>

        <Text fontSize="$2" color="$mutedText" textAlign="center">
          {t('settings.madeWith')} · © {APP_CONFIG.year}
        </Text>
      </YStack>
    </AppModal>
  )
}

// ---------------------------------------------------------------------------
// View: Unauthenticated (native)
// ---------------------------------------------------------------------------

function UnauthenticatedSettingsView() {
  const insets = useSafeAreaInsets()
  const s = useSettingsCommon()

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: s.theme.background.val }}
      contentContainerStyle={{
        paddingTop: insets.top + 16,
        paddingHorizontal: 16,
        paddingBottom: 40,
        gap: 20,
      }}
    >
      <FadeIn>
        <SignInPrompt />
      </FadeIn>

      <SlideIn from="bottom" delay={100}>
        <AppearanceSection
          mode={s.mode}
          cycleTheme={s.cycleTheme}
          currentLang={s.i18n.language as SupportedLanguage}
          showLangPicker={s.showLangPicker}
          toggleLangPicker={() => s.setShowLangPicker(!s.showLangPicker)}
          selectLanguage={s.selectLanguage}
        />
      </SlideIn>

      <SlideIn from="bottom" delay={200}>
        <GeneralSection
          pushEnabled={s.pushEnabled}
          docsEnabled={s.docsEnabled}
          onboardingEnabled={s.onboardingEnabled}
          onNotifications={() => router.push('/sign-in')}
          onReplayTour={s.handleReplayTour}
          onShowAbout={() => s.setShowAbout(true)}
        />
      </SlideIn>

      <SlideIn from="bottom" delay={300}>
        <DocumentsSection />
      </SlideIn>

      <AboutModal visible={s.showAbout} onClose={() => s.setShowAbout(false)} />
    </ScrollView>
  )
}

// ---------------------------------------------------------------------------
// View: Authenticated (native)
// ---------------------------------------------------------------------------

function AuthenticatedSettingsView() {
  const insets = useSafeAreaInsets()
  const user = useAuthStore((s) => s.user)
  const userRole = useAuthStore((s) => s.user?.role)
  const s = useSettingsCommon()
  const [showNotifications, setShowNotifications] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  const scrollY = useSharedValue(0)
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y
    },
  })

  const onRefresh = useCallback(() => {
    setRefreshing(true)
    setTimeout(() => setRefreshing(false), 1200)
  }, [])

  const handleSignOut = async () => {
    await authApi.logout()
    router.replace('/')
  }

  const expandedHeight = HEADER_EXPANDED + insets.top
  let groupIndex = 0

  return (
    <YStack flex={1} backgroundColor="$background">
      <CollapsibleHeader
        scrollY={scrollY}
        avatarUri={user?.avatarUrl}
        avatarName={user?.name}
        userName={user?.name ?? 'Guest'}
        userStatus={user?.email}
        rightAction={{ label: s.t('common.edit'), onPress: () => router.push('/edit-profile') }}
      />

      <Animated.ScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        contentContainerStyle={{
          paddingTop: expandedHeight + 16,
          paddingHorizontal: 16,
          paddingBottom: 40,
          gap: 20,
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={s.theme.accent.val}
            colors={[s.theme.accent.val]}
            progressBackgroundColor={s.theme.cardBackground.val}
          />
        }
      >
        <StaggerGroup index={groupIndex++}>
          <AccountSection user={user} />
        </StaggerGroup>

        <StaggerGroup index={groupIndex++}>
          <AppearanceSection
            mode={s.mode}
            cycleTheme={s.cycleTheme}
            currentLang={s.i18n.language as SupportedLanguage}
            showLangPicker={s.showLangPicker}
            toggleLangPicker={() => s.setShowLangPicker(!s.showLangPicker)}
            selectLanguage={s.selectLanguage}
          />
        </StaggerGroup>

        <StaggerGroup index={groupIndex++}>
          <GeneralSection
            pushEnabled={s.pushEnabled}
            docsEnabled={s.docsEnabled}
            onboardingEnabled={s.onboardingEnabled}
            onNotifications={() => setShowNotifications(true)}
            onReplayTour={s.handleReplayTour}
            onShowAbout={() => s.setShowAbout(true)}
            showPricing
          />
        </StaggerGroup>

        <StaggerGroup index={groupIndex++}>
          <DocumentsSection />
        </StaggerGroup>

        {s.pushEnabled && <NotificationModal visible={showNotifications} onClose={() => setShowNotifications(false)} />}
        <AboutModal visible={s.showAbout} onClose={() => s.setShowAbout(false)} />

        {userRole === 'admin' && (
          <StaggerGroup index={groupIndex++}>
            <AdminSection />
          </StaggerGroup>
        )}

        <StaggerGroup index={groupIndex++}>
          <SignOutSection onSignOut={handleSignOut} />
        </StaggerGroup>
      </Animated.ScrollView>
    </YStack>
  )
}

// ---------------------------------------------------------------------------
// View: Web (handles both auth & unauth)
// ---------------------------------------------------------------------------

function WebSettingsView() {
  const user = useAuthStore((s) => s.user)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const userRole = useAuthStore((s) => s.user?.role)
  const s = useSettingsCommon()
  const [showNotifications, setShowNotifications] = useState(false)

  const handleSignOut = async () => {
    await authApi.logout()
    router.replace('/')
  }

  let groupIndex = 0

  return (
    <YStack flex={1} backgroundColor="$background">
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40, gap: 20 }}>
        {/* Header */}
        {isAuthenticated ? (
          <YStack alignItems="center" gap="$3" paddingVertical="$4">
            <AppAvatar uri={user?.avatarUrl} name={user?.name} size={88} />
            <YStack alignItems="center" gap="$1">
              <H2 color="$color">{user?.name ?? 'Guest'}</H2>
              <Text color="$mutedText" fontSize="$3">{user?.email ?? ''}</Text>
            </YStack>
          </YStack>
        ) : (
          <SignInPrompt />
        )}

        {/* Account (auth only) */}
        {isAuthenticated && (
          <StaggerGroup index={groupIndex++}>
            <AccountSection user={user} showEditProfile />
          </StaggerGroup>
        )}

        <StaggerGroup index={groupIndex++}>
          <AppearanceSection
            mode={s.mode}
            cycleTheme={s.cycleTheme}
            currentLang={s.i18n.language as SupportedLanguage}
            showLangPicker={s.showLangPicker}
            toggleLangPicker={() => s.setShowLangPicker(!s.showLangPicker)}
            selectLanguage={s.selectLanguage}
          />
        </StaggerGroup>

        <StaggerGroup index={groupIndex++}>
          <GeneralSection
            pushEnabled={s.pushEnabled}
            docsEnabled={s.docsEnabled}
            onboardingEnabled={s.onboardingEnabled}
            onNotifications={() => isAuthenticated ? setShowNotifications(true) : router.push('/sign-in')}
            onReplayTour={s.handleReplayTour}
            onShowAbout={() => s.setShowAbout(true)}
            showPricing
          />
        </StaggerGroup>

        <StaggerGroup index={groupIndex++}>
          <DocumentsSection />
        </StaggerGroup>

        {s.pushEnabled && isAuthenticated && <NotificationModal visible={showNotifications} onClose={() => setShowNotifications(false)} />}
        <AboutModal visible={s.showAbout} onClose={() => s.setShowAbout(false)} />

        {userRole === 'admin' && (
          <StaggerGroup index={groupIndex++}>
            <AdminSection />
          </StaggerGroup>
        )}

        {isAuthenticated && (
          <StaggerGroup index={groupIndex++}>
            <SignOutSection onSignOut={handleSignOut} />
          </StaggerGroup>
        )}
      </ScrollView>
    </YStack>
  )
}

// ---------------------------------------------------------------------------
// LanguagePicker
// ---------------------------------------------------------------------------

function LanguagePicker({
  currentLang,
  onSelect,
}: {
  currentLang: SupportedLanguage
  onSelect: (lang: SupportedLanguage) => void
}) {
  const theme = useTheme()

  return (
    <AppCard padding="$2" gap="$1">
      {SUPPORTED_LANGUAGES.map((lang) => {
        const isActive = currentLang === lang
        return (
          <ScalePress key={lang} onPress={() => onSelect(lang)}>
            <XStack
              paddingVertical="$2.5"
              paddingHorizontal="$3"
              borderRadius="$3"
              backgroundColor={isActive ? '$subtleBackground' : 'transparent'}
              alignItems="center"
              justifyContent="space-between"
            >
              <Text
                color={isActive ? '$color' : '$mutedText'}
                fontWeight={isActive ? '600' : '400'}
                fontSize="$3"
              >
                {LANGUAGE_LABELS[lang]}
              </Text>
              {isActive && (
                <Check size={18} color={theme.accent.val} />
              )}
            </XStack>
          </ScalePress>
        )
      })}
    </AppCard>
  )
}
