import { useState } from 'react'
import { Platform, ScrollView } from 'react-native'
import { YStack, useTheme } from 'tamagui'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTranslation } from '@mvp/i18n'
import { DocTreeView } from '@mvp/ui'
import { MarkdownView } from '../src/features/documentation/MarkdownView'

export default function DocsScreen() {
  const { t } = useTranslation()
  const theme = useTheme()
  const insets = useSafeAreaInsets()
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null)

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
          selectedPageId={selectedPageId}
          onPageSelect={(id) => setSelectedPageId(selectedPageId === id ? null : id)}
          renderContent={(contentKey) => (
            <MarkdownView content={t(contentKey)} embedded />
          )}
        />
      </YStack>
    </ScrollView>
  )
}
