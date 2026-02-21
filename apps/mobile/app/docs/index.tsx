import { useEffect, useState } from 'react'
import { Platform, ScrollView } from 'react-native'
import { router } from 'expo-router'
import { YStack, Text, useTheme } from 'tamagui'
import { useTranslation } from '@mvp/i18n'
import { Ionicons } from '@expo/vector-icons'
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

export default function DocsIndexScreen() {
  const { t } = useTranslation()
  const theme = useTheme()
  const isWide = useIsWideScreen()

  const handlePageSelect = (pageId: string) => {
    router.push(`/docs/${pageId}` as any)
  }

  // Wide web: sidebar already shows tree, show placeholder here
  if (Platform.OS === 'web' && isWide) {
    return (
      <YStack flex={1} alignItems="center" justifyContent="center" padding="$6" gap="$3">
        <Ionicons name="book-outline" size={48} color={theme.mutedText.val} />
        <Text color="$mutedText" fontSize="$3" textAlign="center">
          {t('docs.selectPage')}
        </Text>
      </YStack>
    )
  }

  // Mobile / narrow: show tree navigation
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.background.val }}
      contentContainerStyle={{
        paddingTop: Platform.OS === 'web' ? 16 : 8,
        paddingHorizontal: 16,
        paddingBottom: 40,
      }}
    >
      <YStack gap="$3">
        <DocTreeView onPageSelect={handlePageSelect} />
      </YStack>
    </ScrollView>
  )
}
