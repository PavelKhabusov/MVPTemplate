import { useState, useCallback, useEffect } from 'react'
import { Platform, RefreshControl, ScrollView, Modal } from 'react-native'
import { YStack, XStack, Text, H2, useTheme } from 'tamagui'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { useTranslation } from '@mvp/i18n'
import { SUPPORTED_LANGUAGES, LANGUAGE_LABELS } from '@mvp/i18n'
import type { SupportedLanguage } from '@mvp/i18n'
import { useAuthStore, useThemeStore, useLanguageStore } from '@mvp/store'
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
} from '@mvp/ui'
import { Ionicons } from '@expo/vector-icons'
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
            <Ionicons name="close" size={24} color={theme.color.val} />
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
            <Ionicons name="close" size={24} color={theme.color.val} />
          </ScalePress>
        </XStack>
        <NotificationCenter http={api} emailEnabled={emailEnabled} />
      </YStack>
    </Modal>
  )
}

function AboutModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { t } = useTranslation()
  const theme = useTheme()
  const insets = useSafeAreaInsets()

  const content = (
    <YStack alignItems="center" gap="$5" paddingHorizontal="$5" paddingVertical="$6">
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
          <Ionicons name="layers-outline" size={36} color={theme.accent.val} />
        </YStack>
        <Text fontSize="$6" fontWeight="700" color="$color">{APP_CONFIG.name}</Text>
        <Text fontSize="$2" color="$mutedText">v{APP_CONFIG.version}</Text>
      </YStack>

      <YStack width="100%" gap="$2">
        <XStack
          paddingVertical="$3"
          paddingHorizontal="$4"
          backgroundColor="$subtleBackground"
          borderRadius="$3"
          justifyContent="space-between"
          alignItems="center"
        >
          <Text fontSize="$3" color="$mutedText">{t('settings.version')}</Text>
          <Text fontSize="$3" color="$color" fontWeight="500">{APP_CONFIG.version}</Text>
        </XStack>
        <XStack
          paddingVertical="$3"
          paddingHorizontal="$4"
          backgroundColor="$subtleBackground"
          borderRadius="$3"
          justifyContent="space-between"
          alignItems="center"
        >
          <Text fontSize="$3" color="$mutedText">{t('settings.developer')}</Text>
          <Text fontSize="$3" color="$color" fontWeight="500">{APP_CONFIG.developer}</Text>
        </XStack>
      </YStack>

      <Text fontSize="$2" color="$mutedText" textAlign="center">
        {t('settings.madeWith')} · © {APP_CONFIG.year}
      </Text>
    </YStack>
  )

  if (!visible) return null

  if (Platform.OS === 'web') {
    return (
      <YStack
        // @ts-ignore
        style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' }}
        onPress={onClose}
      >
        <YStack
          backgroundColor="$background"
          borderRadius="$5"
          borderWidth={1}
          borderColor="$borderColor"
          maxWidth={400}
          width="90%"
          // @ts-ignore
          onPress={(e: any) => e.stopPropagation()}
        >
          <XStack justifyContent="flex-end" padding="$3">
            <ScalePress onPress={onClose}>
              <Ionicons name="close" size={22} color={theme.mutedText.val} />
            </ScalePress>
          </XStack>
          {content}
        </YStack>
      </YStack>
    )
  }

  return (
    <Modal visible animationType="slide" presentationStyle="formSheet" onRequestClose={onClose}>
      <YStack flex={1} backgroundColor="$background" paddingTop={insets.top}>
        <XStack justifyContent="flex-end" padding="$3">
          <ScalePress onPress={onClose}>
            <Ionicons name="close" size={24} color={theme.color.val} />
          </ScalePress>
        </XStack>
        {content}
      </YStack>
    </Modal>
  )
}

function UnauthenticatedSettingsView() {
  const { t, i18n } = useTranslation()
  const insets = useSafeAreaInsets()
  const theme = useTheme()
  const { mode, setMode } = useThemeStore()
  const docsEnabled = useTemplateFlag('docs', true)
  const pushEnabled = useTemplateFlag('pushNotifications', false)
  const setLanguage = useLanguageStore((s) => s.setLanguage)
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

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.background.val }}
      contentContainerStyle={{
        paddingTop: insets.top + 16,
        paddingHorizontal: 16,
        paddingBottom: 40,
        gap: 20,
      }}
    >
      {/* Sign In prompt */}
      <FadeIn>
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
      </FadeIn>

      {/* Appearance */}
      <SlideIn from="bottom" delay={100}>
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
            value={LANGUAGE_LABELS[i18n.language as SupportedLanguage] ?? i18n.language}
            onPress={() => setShowLangPicker(!showLangPicker)}
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
                currentLang={i18n.language as SupportedLanguage}
                onSelect={selectLanguage}
              />
            </MotiView>
          )}
        </AnimatePresence>
      </SlideIn>

      {/* General */}
      <SlideIn from="bottom" delay={200}>
        <SettingsGroup header={t('settings.title')}>
          {pushEnabled && (
            <SettingsGroupItem
              icon="notifications-outline"
              label={t('settings.notifications')}
              onPress={() => router.push('/sign-in')}
            />
          )}
          {docsEnabled && (
            <SettingsGroupItem
              icon="book-outline"
              label={t('docs.title')}
              onPress={() => router.push('/docs')}
            />
          )}
          <SettingsGroupItem
            icon="information-circle-outline"
            label={t('settings.about')}
            value={APP_CONFIG.version}
            onPress={() => setShowAbout(true)}
          />
        </SettingsGroup>
      </SlideIn>

      {/* Documents */}
      <SlideIn from="bottom" delay={300}>
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
      </SlideIn>

      <AboutModal visible={showAbout} onClose={() => setShowAbout(false)} />
    </ScrollView>
  )
}

function AuthenticatedSettingsView() {
  const { t, i18n } = useTranslation()
  const theme = useTheme()
  const insets = useSafeAreaInsets()
  const user = useAuthStore((s) => s.user)
  const userRole = useAuthStore((s) => s.user?.role)
  const { mode, setMode } = useThemeStore()
  const setLanguage = useLanguageStore((s) => s.setLanguage)
  const docsEnabled = useTemplateFlag('docs', true)
  const pushEnabled = useTemplateFlag('pushNotifications', false)
  const paymentsEnabled = useTemplateFlag('payments', false)
  const [showLangPicker, setShowLangPicker] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [showAbout, setShowAbout] = useState(false)
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
        rightAction={{ label: t('common.edit'), onPress: () => router.push('/edit-profile') }}
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
            tintColor={theme.accent.val}
            colors={[theme.accent.val]}
            progressBackgroundColor={theme.cardBackground.val}
          />
        }
      >
        {/* Account */}
        <StaggerGroup index={groupIndex++}>
          <SettingsGroup header={t('profile.title')}>
            {user?.phone ? (
              <SettingsGroupItem
                icon="call-outline"
                label={t('profile.phone')}
                value={user.phone}
              />
            ) : null}
            <SettingsGroupItem
              icon="mail-outline"
              label={t('profile.email')}
              value={user?.email ?? '-'}
            />
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
        </StaggerGroup>

        {/* Appearance */}
        <StaggerGroup index={groupIndex++}>
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
              value={LANGUAGE_LABELS[i18n.language as SupportedLanguage] ?? i18n.language}
              onPress={() => setShowLangPicker(!showLangPicker)}
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
                  currentLang={i18n.language as SupportedLanguage}
                  onSelect={selectLanguage}
                />
              </MotiView>
            )}
          </AnimatePresence>
        </StaggerGroup>

        {/* General */}
        <StaggerGroup index={groupIndex++}>
          <SettingsGroup header={t('settings.title')}>
            {paymentsEnabled && (
              <SettingsGroupItem
                icon="card-outline"
                label={t('payments.managePlan')}
                onPress={() => router.push('/pricing')}
              />
            )}
            {pushEnabled && (
              <SettingsGroupItem
                icon="notifications-outline"
                label={t('settings.notifications')}
                onPress={() => setShowNotifications(true)}
              />
            )}
            {docsEnabled && (
              <SettingsGroupItem
                icon="book-outline"
                label={t('docs.title')}
                onPress={() => router.push('/docs')}
              />
            )}
            <SettingsGroupItem
              icon="information-circle-outline"
              label={t('settings.about')}
              value={APP_CONFIG.version}
              onPress={() => setShowAbout(true)}
            />
          </SettingsGroup>
        </StaggerGroup>

        {/* Documents */}
        <StaggerGroup index={groupIndex++}>
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
        </StaggerGroup>

        {pushEnabled && <NotificationModal visible={showNotifications} onClose={() => setShowNotifications(false)} />}
        <AboutModal visible={showAbout} onClose={() => setShowAbout(false)} />

        {/* Admin */}
        {userRole === 'admin' && (
          <StaggerGroup index={groupIndex++}>
            <SettingsGroup header={t('admin.title')}>
              <SettingsGroupItem
                icon="shield-checkmark-outline"
                label={t('admin.title')}
                onPress={() => router.push('/admin')}
              />
            </SettingsGroup>
          </StaggerGroup>
        )}

        {/* Sign Out */}
        <StaggerGroup index={groupIndex++}>
          <SettingsGroup>
            <SettingsGroupItem
              icon="log-out-outline"
              label={t('settings.signOut')}
              onPress={handleSignOut}
              danger
            />
          </SettingsGroup>
        </StaggerGroup>
      </Animated.ScrollView>
    </YStack>
  )
}

function WebSettingsView() {
  const { t, i18n } = useTranslation()
  const theme = useTheme()
  const user = useAuthStore((s) => s.user)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const userRole = useAuthStore((s) => s.user?.role)
  const { mode, setMode } = useThemeStore()
  const setLanguage = useLanguageStore((s) => s.setLanguage)
  const docsEnabled = useTemplateFlag('docs', true)
  const pushEnabled = useTemplateFlag('pushNotifications', false)
  const [showLangPicker, setShowLangPicker] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
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

  const handleSignOut = async () => {
    await authApi.logout()
    router.replace('/')
  }

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
          <YStack alignItems="center" gap="$3" paddingVertical="$4">
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
        )}

        {/* Account (auth only) */}
        {isAuthenticated && (
          <StaggerGroup index={0}>
            <SettingsGroup header={t('profile.title')}>
              <SettingsGroupItem
                icon="pencil-outline"
                label={t('profile.editProfile')}
                onPress={() => router.push('/edit-profile')}
              />
              {user?.phone ? (
                <SettingsGroupItem
                  icon="call-outline"
                  label={t('profile.phone')}
                  value={user.phone}
                />
              ) : null}
              <SettingsGroupItem
                icon="mail-outline"
                label={t('profile.email')}
                value={user?.email ?? '-'}
              />
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
          </StaggerGroup>
        )}

        {/* Appearance */}
        <StaggerGroup index={isAuthenticated ? 1 : 0}>
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
              value={LANGUAGE_LABELS[i18n.language as SupportedLanguage] ?? i18n.language}
              onPress={() => setShowLangPicker(!showLangPicker)}
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
                  currentLang={i18n.language as SupportedLanguage}
                  onSelect={selectLanguage}
                />
              </MotiView>
            )}
          </AnimatePresence>
        </StaggerGroup>

        {/* General */}
        <StaggerGroup index={isAuthenticated ? 2 : 1}>
          <SettingsGroup header={t('settings.title')}>
            {pushEnabled && (
              <SettingsGroupItem
                icon="notifications-outline"
                label={t('settings.notifications')}
                onPress={() => isAuthenticated ? setShowNotifications(true) : router.push('/sign-in')}
              />
            )}
            {docsEnabled && (
              <SettingsGroupItem
                icon="book-outline"
                label={t('docs.title')}
                onPress={() => router.push('/docs')}
              />
            )}
            <SettingsGroupItem
              icon="information-circle-outline"
              label={t('settings.about')}
              value={APP_CONFIG.version}
              onPress={() => setShowAbout(true)}
            />
          </SettingsGroup>
        </StaggerGroup>

        {/* Documents */}
        <StaggerGroup index={isAuthenticated ? 3 : 2}>
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
        </StaggerGroup>

        {pushEnabled && isAuthenticated && <NotificationModal visible={showNotifications} onClose={() => setShowNotifications(false)} />}
        <AboutModal visible={showAbout} onClose={() => setShowAbout(false)} />

        {/* Admin */}
        {userRole === 'admin' && (
          <StaggerGroup index={isAuthenticated ? 4 : 3}>
            <SettingsGroup header={t('admin.title')}>
              <SettingsGroupItem
                icon="shield-checkmark-outline"
                label={t('admin.title')}
                onPress={() => router.push('/admin')}
              />
            </SettingsGroup>
          </StaggerGroup>
        )}

        {/* Sign Out */}
        {isAuthenticated && (
          <StaggerGroup index={userRole === 'admin' ? 5 : 4}>
            <SettingsGroup>
              <SettingsGroupItem
                icon="log-out-outline"
                label={t('settings.signOut')}
                onPress={handleSignOut}
                danger
              />
            </SettingsGroup>
          </StaggerGroup>
        )}
      </ScrollView>
    </YStack>
  )
}

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
                <Ionicons name="checkmark" size={18} color={theme.accent.val} />
              )}
            </XStack>
          </ScalePress>
        )
      })}
    </AppCard>
  )
}
