import { Platform, ScrollView } from 'react-native'
import { router } from 'expo-router'
import { YStack, Text, useTheme } from 'tamagui'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTranslation } from '@mvp/i18n'
import { DocTreeView } from '@mvp/docs'

export default function DocsIndexScreen() {
  const { t } = useTranslation()
  const theme = useTheme()
  const insets = useSafeAreaInsets()

  const handlePageSelect = (pageId: string) => {
    router.push(`/docs/${pageId}` as any)
  }

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
        <DocTreeView
          onPageSelect={handlePageSelect}
        />
      </YStack>
    </ScrollView>
  )
}
