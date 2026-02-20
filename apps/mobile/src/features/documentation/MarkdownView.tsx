import { ScrollView } from 'react-native'
import { YStack, useTheme } from 'tamagui'
import Markdown from 'react-native-marked'

interface MarkdownViewProps {
  content: string
}

export function MarkdownView({ content }: MarkdownViewProps) {
  const theme = useTheme()

  return (
    <ScrollView
      style={{ backgroundColor: theme.background.val }}
      contentContainerStyle={{ paddingBottom: 40 }}
    >
      <YStack padding="$4">
        <Markdown
          value={content}
          flatListProps={{
            scrollEnabled: false,
            style: { backgroundColor: theme.background.val },
          }}
          theme={{
            colors: {
              background: theme.background.val,
              text: theme.color.val,
              link: theme.primary.val,
              border: theme.borderColor.val,
              code: theme.subtleBackground.val,
            },
          }}
        />
      </YStack>
    </ScrollView>
  )
}
