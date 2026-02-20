import { useState } from 'react'
import { ScrollView } from 'react-native'
import { YStack, XStack, Text, useTheme } from 'tamagui'
import { router } from 'expo-router'
import { useTranslation, SUPPORTED_LANGUAGES, LANGUAGE_LABELS } from '@mvp/i18n'
import type { SupportedLanguage } from '@mvp/i18n'
import { useThemeStore, useAuthStore, useLanguageStore } from '@mvp/store'
import type { ThemeMode } from '@mvp/store'
import { AnimatedListItem, ScalePress, AppCard } from '@mvp/ui'
import { Ionicons } from '@expo/vector-icons'
import { SettingRow } from './SettingRow'
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

  const handleSignOut = async () => {
    await authApi.logout()
    router.replace('/')
  }

  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
      <YStack padding="$4" gap="$3">
        <AnimatedListItem index={0}>
          <SettingRow
            icon="color-palette-outline"
            label={t('settings.theme')}
            value={t(THEME_LABELS[mode])}
            onPress={cycleTheme}
          />
        </AnimatedListItem>

        <AnimatedListItem index={1}>
          <SettingRow
            icon="language-outline"
            label={t('settings.language')}
            value={LANGUAGE_LABELS[i18n.language as SupportedLanguage] ?? i18n.language}
            onPress={() => setShowLangPicker(!showLangPicker)}
          />
        </AnimatedListItem>

        {showLangPicker && (
          <AppCard padding="$2" gap="$1">
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
        )}

        <AnimatedListItem index={2}>
          <SettingRow
            icon="notifications-outline"
            label={t('settings.notifications')}
            onPress={() => {}}
          />
        </AnimatedListItem>

        <AnimatedListItem index={3}>
          <SettingRow
            icon="shield-outline"
            label={t('settings.privacy')}
            onPress={() => router.push('/privacy')}
          />
        </AnimatedListItem>

        <AnimatedListItem index={4}>
          <SettingRow
            icon="information-circle-outline"
            label={t('settings.about')}
            value="1.0.0"
          />
        </AnimatedListItem>

        {isAuthenticated && (
          <AnimatedListItem index={5}>
            <SettingRow
              icon="log-out-outline"
              label={t('settings.signOut')}
              onPress={handleSignOut}
              danger
            />
          </AnimatedListItem>
        )}
      </YStack>
    </ScrollView>
  )
}
