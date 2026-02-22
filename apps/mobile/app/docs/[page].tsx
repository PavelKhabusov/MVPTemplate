import { ScrollView } from 'react-native'
import { useLocalSearchParams, Stack } from 'expo-router'
import { YStack, useTheme } from 'tamagui'
import { useTranslation } from '@mvp/i18n'
import { MarkdownView, getPageById } from '@mvp/docs'
import { useTemplateFlag } from '@mvp/template-config'
import { DocFeedback } from '../../src/features/docs/DocFeedback'

export default function DocsPageScreen() {
  const { page } = useLocalSearchParams<{ page: string }>()
  const { t } = useTranslation()
  const theme = useTheme()
  const docPage = getPageById(page ?? '')
  const feedbackEnabled = useTemplateFlag('docFeedback', true)

  const pageTitle = docPage ? t(docPage.titleKey) : ''

  return (
    <>
      <Stack.Screen options={{ title: pageTitle }} />
      <ScrollView
        style={{ flex: 1, backgroundColor: theme.background.val }}
        contentContainerStyle={{
          paddingBottom: 40,
        }}
      >
        <YStack>
          {docPage && (
            <MarkdownView content={t(docPage.contentKey)} embedded />
          )}
          {docPage && feedbackEnabled && (
            <DocFeedback pageId={docPage.id} />
          )}
        </YStack>
      </ScrollView>
    </>
  )
}
