import { useEffect, useState } from 'react'
import { Slot, SplashScreen } from 'expo-router'
import { TamaguiProvider } from 'tamagui'
import { PortalProvider } from '@tamagui/portal'
import { QueryClientProvider } from '@tanstack/react-query'
import { useFonts } from 'expo-font'
import { tamaguiConfig } from '@mvp/ui'
import { useThemeStore, useLanguageStore, useAuthStore } from '@mvp/store'
import { initI18n } from '@mvp/i18n'
import { queryClient } from '../src/services/query-client'
import { authApi } from '../src/features/auth/auth.service'

// Prevent splash screen from hiding before fonts load
SplashScreen.preventAutoHideAsync()

export default function RootLayout() {
  const resolvedTheme = useThemeStore((s) => s.resolvedTheme)
  const savedLanguage = useLanguageStore((s) => s.language)
  const isInitialized = useAuthStore((s) => s.isInitialized)
  const [i18nReady, setI18nReady] = useState(false)

  const [fontsLoaded, fontError] = useFonts({
    Inter: require('@tamagui/font-inter/otf/Inter-Medium.otf'),
    InterBold: require('@tamagui/font-inter/otf/Inter-Bold.otf'),
  })

  useEffect(() => {
    initI18n(savedLanguage)
    setI18nReady(true)
  }, [])

  useEffect(() => {
    authApi.initialize()
  }, [])

  const ready = (fontsLoaded || fontError) && i18nReady && isInitialized

  useEffect(() => {
    if (ready) {
      SplashScreen.hideAsync()
    }
  }, [ready])

  if (!ready) return null

  return (
    <QueryClientProvider client={queryClient}>
      <TamaguiProvider config={tamaguiConfig} defaultTheme={resolvedTheme}>
        <PortalProvider>
          <Slot />
        </PortalProvider>
      </TamaguiProvider>
    </QueryClientProvider>
  )
}
