import { useState, useCallback } from 'react'
import { Platform, RefreshControl, ScrollView } from 'react-native'
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
import { AnimatePresence, MotiView } from 'moti'
import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
} from 'react-native-reanimated'
import { authApi } from '../../src/services/auth'

const THEME_LABELS: Record<ThemeMode, string> = {
  system: 'settings.themeSystem',
  light: 'settings.themeLight',
  dark: 'settings.themeDark',
}

const THEME_CYCLE: ThemeMode[] = ['system', 'light', 'dark']

export default function ProfileScreen() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const [refreshing, setRefreshing] = useState(false)

  const onRefresh = useCallback(() => {
    setRefreshing(true)
    setTimeout(() => setRefreshing(false), 1200)
  }, [])

  if (!isAuthenticated) {
    return <UnauthenticatedView />
  }

  if (Platform.OS === 'web') {
    return <WebProfileView />
  }

  return (
    <AuthenticatedProfileView
      refreshing={refreshing}
      onRefresh={onRefresh}
    />
  )
}

function UnauthenticatedView() {
  const { t, i18n } = useTranslation()
  const insets = useSafeAreaInsets()
  const theme = useTheme()
  const { mode, setMode } = useThemeStore()
  const setLanguage = useLanguageStore((s) => s.setLanguage)
  const [showLangPicker, setShowLangPicker] = useState(false)

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
    <YStack
      flex={1}
      alignItems="center"
      justifyContent="center"
      padding="$4"
      paddingTop={Platform.OS === 'web' ? '$4' : insets.top}
      gap="$4"
      backgroundColor="$background"
    >
      <FadeIn>
        <YStack alignItems="center" gap="$3">
          <AppAvatar name="?" size={80} />
          <H2>{t('auth.signIn')}</H2>
          <Text color="$mutedText" textAlign="center" maxWidth={300}>
            {t('profile.signInPrompt')}
          </Text>
        </YStack>
      </FadeIn>

      <SlideIn from="bottom" delay={200}>
        <YStack gap="$3" width={250}>
          <AppButton onPress={() => router.push('/sign-in')}>
            {t('auth.signIn')}
          </AppButton>
          <AppButton variant="outline" onPress={() => router.push('/sign-up')}>
            {t('auth.createAccount')}
          </AppButton>
        </YStack>
      </SlideIn>

      <SlideIn from="bottom" delay={400}>
        <YStack gap="$3" width={280} paddingTop="$2">
          <SettingsGroup>
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
        </YStack>
      </SlideIn>
    </YStack>
  )
}

function AuthenticatedProfileView({
  refreshing,
  onRefresh,
}: {
  refreshing: boolean
  onRefresh: () => void
}) {
  const { t, i18n } = useTranslation()
  const theme = useTheme()
  const insets = useSafeAreaInsets()
  const user = useAuthStore((s) => s.user)
  const userRole = useAuthStore((s) => s.user?.role)
  const { mode, setMode } = useThemeStore()
  const setLanguage = useLanguageStore((s) => s.setLanguage)
  const [showLangPicker, setShowLangPicker] = useState(false)

  const scrollY = useSharedValue(0)
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y
    },
  })

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
            <SettingsGroupItem
              icon="notifications-outline"
              label={t('settings.notifications')}
              onPress={() => {}}
            />
            <SettingsGroupItem
              icon="shield-outline"
              label={t('settings.privacy')}
              onPress={() => router.push('/privacy')}
            />
            <SettingsGroupItem
              icon="information-circle-outline"
              label={t('settings.about')}
              value="1.0.0"
            />
          </SettingsGroup>
        </StaggerGroup>

        {/* Admin (conditional) */}
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

      </Animated.ScrollView>
    </YStack>
  )
}

function WebProfileView() {
  const { t, i18n } = useTranslation()
  const theme = useTheme()
  const user = useAuthStore((s) => s.user)
  const userRole = useAuthStore((s) => s.user?.role)
  const { mode, setMode } = useThemeStore()
  const setLanguage = useLanguageStore((s) => s.setLanguage)
  const [showLangPicker, setShowLangPicker] = useState(false)

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
        <YStack alignItems="center" gap="$3" paddingVertical="$4">
          <AppAvatar uri={user?.avatarUrl} name={user?.name} size={88} />
          <YStack alignItems="center" gap="$1">
            <H2 color="$color">{user?.name ?? 'Guest'}</H2>
            <Text color="$mutedText" fontSize="$3">{user?.email ?? ''}</Text>
          </YStack>
        </YStack>

        {/* Account */}
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

        {/* Appearance */}
        <StaggerGroup index={1}>
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
        <StaggerGroup index={2}>
          <SettingsGroup header={t('settings.title')}>
            <SettingsGroupItem
              icon="notifications-outline"
              label={t('settings.notifications')}
              onPress={() => {}}
            />
            <SettingsGroupItem
              icon="shield-outline"
              label={t('settings.privacy')}
              onPress={() => router.push('/privacy')}
            />
            <SettingsGroupItem
              icon="information-circle-outline"
              label={t('settings.about')}
              value="1.0.0"
            />
          </SettingsGroup>
        </StaggerGroup>

        {/* Admin */}
        {userRole === 'admin' && (
          <StaggerGroup index={3}>
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
        <StaggerGroup index={userRole === 'admin' ? 4 : 3}>
          <SettingsGroup>
            <SettingsGroupItem
              icon="log-out-outline"
              label={t('settings.signOut')}
              onPress={handleSignOut}
              danger
            />
          </SettingsGroup>
        </StaggerGroup>
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
