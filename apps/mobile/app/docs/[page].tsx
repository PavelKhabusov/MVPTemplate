import { Platform, ScrollView } from 'react-native'
import { useLocalSearchParams, router, Stack } from 'expo-router'
import { YStack, useTheme } from 'tamagui'
import { useTranslation } from '@mvp/i18n'
import { MarkdownView, getPageById } from '@mvp/docs'

export default function DocsPageScreen() {
  const { page } = useLocalSearchParams<{ page: string }>()
  const { t } = useTranslation()
  const theme = useTheme()
  const docPage = getPageById(page ?? '')

  const pageTitle = docPage ? t(docPage.titleKey) : ''

  return (
    <>
      <Stack.Screen options={{ title: pageTitle, headerBackTitle: '' }} />
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
        </YStack>
      </ScrollView>
    </>
  )
}
