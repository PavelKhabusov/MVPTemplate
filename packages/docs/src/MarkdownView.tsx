import { useMemo } from 'react'
import { Platform, ScrollView } from 'react-native'
import { YStack, useTheme } from 'tamagui'
import Markdown from 'react-native-marked'
import type { MarkedStyles } from 'react-native-marked'
import { DocsRenderer } from './DocsRenderer'

interface MarkdownViewProps {
  content: string
  embedded?: boolean
}

export function MarkdownView({ content, embedded }: MarkdownViewProps) {
  const theme = useTheme()

  const renderer = useMemo(() => new DocsRenderer(), [])

  const styles = useMemo<MarkedStyles>(() => {
    const borderCol = theme.borderColor.val
    const monoFont = Platform.select({
      ios: 'Menlo',
      android: 'monospace',
      default: 'ui-monospace, Menlo, monospace',
    })

    return {
      code: {
        // Container style — overridden by custom renderer, but kept as fallback
        backgroundColor: '#0d1117',
        borderRadius: 10,
        padding: 16,
        minWidth: '100%' as any,
      },
      codespan: {
        backgroundColor: theme.subtleBackground.val,
        borderRadius: 4,
        fontFamily: monoFont,
        fontSize: 14,
        color: theme.color.val,
      } as any,
      table: {
        borderWidth: 1,
        borderColor: borderCol,
        borderRadius: 6,
        overflow: 'hidden',
      },
      tableRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: borderCol,
      },
      tableCell: {
        padding: 10,
        borderRightWidth: 1,
        borderRightColor: borderCol,
      },
      blockquote: {
        borderLeftColor: theme.accent.val,
        borderLeftWidth: 3,
        paddingLeft: 16,
        opacity: 0.85,
      },
      h2: {
        fontSize: 22,
        fontWeight: 'bold',
        color: theme.color.val,
        marginVertical: 12,
        paddingBottom: 6,
        borderBottomWidth: 1,
        borderBottomColor: borderCol,
      },
      h3: {
        fontSize: 18,
        fontWeight: '600',
        color: theme.color.val,
        marginVertical: 8,
      },
      link: {
        color: theme.accent.val,
        fontStyle: 'normal',
        textDecorationLine: 'underline',
      },
      strong: {
        fontWeight: 'bold',
        color: theme.color.val,
      },
    }
  }, [theme])

  const markdownElement = (
    <YStack padding="$4">
      <Markdown
        value={content}
        styles={styles}
        renderer={renderer}
        flatListProps={{
          scrollEnabled: false,
          style: { backgroundColor: theme.background.val },
        }}
        theme={{
          colors: {
            background: theme.background.val,
            text: theme.color.val,
            link: theme.accent.val,
            border: theme.borderColor.val,
            code: '#0d1117',
          },
        }}
      />
    </YStack>
  )

  if (embedded) {
    return markdownElement
  }

  return (
    <ScrollView
      style={{ backgroundColor: theme.background.val }}
      contentContainerStyle={{ paddingBottom: 40 }}
    >
      {markdownElement}
    </ScrollView>
  )
}
