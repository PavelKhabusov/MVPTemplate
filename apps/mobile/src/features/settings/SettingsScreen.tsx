import { ScrollView } from 'react-native'
import { YStack, Text, H2 } from 'tamagui'
import { router } from 'expo-router'
import { useTranslation } from '@mvp/i18n'
import { useThemeStore, useAuthStore } from '@mvp/store'
import type { ThemeMode } from '@mvp/store'
import { FadeIn, AnimatedListItem } from '@mvp/ui'
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
  const user = useAuthStore((s) => s.user)

  const cycleTheme = () => {
    const currentIdx = THEME_CYCLE.indexOf(mode)
    const next = THEME_CYCLE[(currentIdx + 1) % THEME_CYCLE.length]
    setMode(next)
  }

  const handleSignOut = async () => {
    await authApi.logout()
    router.replace('/sign-in')
  }

  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
      <YStack padding="$4" gap="$3">
        <FadeIn>
          <H2>{t('settings.title')}</H2>
        </FadeIn>

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
            value={i18n.language.toUpperCase()}
            onPress={() => {
              const next = i18n.language === 'en' ? 'ru' : 'en'
              i18n.changeLanguage(next)
            }}
          />
        </AnimatedListItem>

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
            onPress={() => router.push('/(auth)/privacy')}
          />
        </AnimatedListItem>

        <AnimatedListItem index={4}>
          <SettingRow
            icon="information-circle-outline"
            label={t('settings.about')}
            value="1.0.0"
          />
        </AnimatedListItem>

        <AnimatedListItem index={5}>
          <SettingRow
            icon="log-out-outline"
            label={t('settings.signOut')}
            onPress={handleSignOut}
            danger
          />
        </AnimatedListItem>
      </YStack>
    </ScrollView>
  )
}
