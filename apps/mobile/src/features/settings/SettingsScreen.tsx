import { useState } from 'react'
import { ScrollView } from 'react-native'
import { YStack, XStack, Text, useTheme } from 'tamagui'
import { router } from 'expo-router'
import { useTranslation, SUPPORTED_LANGUAGES, LANGUAGE_LABELS } from '@mvp/i18n'
import type { SupportedLanguage } from '@mvp/i18n'
import { useThemeStore, useAuthStore, useLanguageStore } from '@mvp/store'
import type { ThemeMode } from '@mvp/store'
import { ScalePress, AppCard, StaggerGroup, SettingsGroup, SettingsGroupItem } from '@mvp/ui'
import { Ionicons } from '@expo/vector-icons'
import { AnimatePresence, MotiView } from 'moti'
import { authApi } from '../auth/auth.service'

const THEME_LABELS: Record<ThemeMode, string> = {
  system: 'settings.themeSystem',
  light: 'settings.themeLight',
  dark: 'settings.themeDark',
}

const THEME_CYCLE: ThemeMode[] = ['system', 'light', 'dark']

export function SettingsContent() {
  const { t, i18n } = useTranslation()
  const { mode, setMode } = useThemeStore()
  const setLanguage = useLanguageStore((s) => s.setLanguage)
  const [showLangPicker, setShowLangPicker] = useState(false)
  const theme = useTheme()

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

  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const userRole = useAuthStore((s) => s.user?.role)

  const handleSignOut = async () => {
    await authApi.logout()
    router.replace('/')
  }

  let groupIndex = 0

  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40, gap: 20 }}>
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
              <AppCard padding="$2" gap="$1" marginTop="$2">
                {SUPPORTED_LANGUAGES.map((lang) => {
                  const isActive = i18n.language === lang
                  return (
                    <ScalePress key={lang} onPress={() => selectLanguage(lang)}>
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
            </MotiView>
          )}
        </AnimatePresence>
      </StaggerGroup>

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

      {isAuthenticated && (
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
      )}
    </ScrollView>
  )
}
