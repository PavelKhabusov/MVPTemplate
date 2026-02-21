import { useEffect, useState } from 'react'
import { Platform, ScrollView } from 'react-native'
import { Stack, Slot, usePathname, router } from 'expo-router'
import { XStack, YStack, useTheme } from 'tamagui'
import { useTranslation } from '@mvp/i18n'
import { DocTreeView } from '@mvp/docs'

function useIsWideScreen() {
  const [isWide, setIsWide] = useState(() => {
    if (Platform.OS !== 'web') return false
    return window.innerWidth >= 900
  })

  useEffect(() => {
    if (Platform.OS !== 'web') return
    const mql = window.matchMedia('(min-width: 900px)')
    const handler = (e: MediaQueryListEvent) => setIsWide(e.matches)
    setIsWide(mql.matches)
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [])

  return isWide
}

export default function DocsLayout() {
  const isWide = useIsWideScreen()
  const theme = useTheme()
  const { t } = useTranslation()
  const pathname = usePathname()

  const currentPageId = pathname.startsWith('/docs/')
    ? pathname.replace('/docs/', '')
    : null

  const handlePageSelect = (pageId: string) => {
    router.push(`/docs/${pageId}` as any)
  }

  // Mobile & narrow web: Stack navigator (tree -> page with back button)
  if (Platform.OS !== 'web' || !isWide) {
    return (
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="[page]" />
      </Stack>
    )
  }

  // Wide web: sidebar tree + content area
  return (
    <XStack flex={1} backgroundColor="$background">
      <YStack
        width={300}
        borderRightWidth={1}
        borderRightColor="$borderColor"
        backgroundColor="$background"
        style={{ height: '100%', flexShrink: 0 } as any}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        >
          <DocTreeView
            selectedPageId={currentPageId}
            onPageSelect={handlePageSelect}
          />
        </ScrollView>
      </YStack>

      <YStack flex={1} style={{ height: '100%', overflow: 'auto' } as any}>
        <Slot />
      </YStack>
    </XStack>
  )
}
