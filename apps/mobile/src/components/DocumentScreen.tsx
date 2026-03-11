import { Platform, Alert } from 'react-native'
import { YStack, XStack, Text } from 'tamagui'
import { useTranslation } from '@mvp/i18n'
import { FadeIn, AppButton } from '@mvp/ui'
import { MarkdownView } from '@mvp/docs'
import { Download } from 'lucide-react-native'
import { useTheme } from 'tamagui'

function markdownToHtml(markdown: string, title: string): string {
  let html = markdown
    // Escape existing HTML
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    // Headings
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    // Bold
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // Horizontal rule
    .replace(/^---$/gm, '<hr/>')
    // Unordered list items
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    // Wrap consecutive <li> in <ul>
    .replace(/(<li>.*<\/li>\n?)+/g, (match) => `<ul>${match}</ul>`)
    // Paragraphs: blank-line-separated blocks that aren't already HTML tags
    .replace(/\n\n(?!<)/g, '</p><p>')
    .replace(/^(?!<)/, '<p>')
    .replace(/(?<!>)$/, '</p>')
    // Clean up empty paragraphs
    .replace(/<p><\/p>/g, '')
    .replace(/<p>(<h[1-6]>)/g, '$1')
    .replace(/(<\/h[1-6]>)<\/p>/g, '$1')
    .replace(/<p>(<ul>)/g, '$1')
    .replace(/(<\/ul>)<\/p>/g, '$1')
    .replace(/<p>(<hr\/>)/g, '$1')
    .replace(/(<hr\/>)<\/p>/g, '$1')

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>${title}</title>
  <style>
    body { font-family: -apple-system, Helvetica, Arial, sans-serif; font-size: 14px; line-height: 1.6; color: #1a1a1a; max-width: 800px; margin: 0 auto; padding: 24px; }
    h1 { font-size: 22px; margin-top: 0; }
    h2 { font-size: 17px; margin-top: 24px; }
    h3 { font-size: 15px; margin-top: 16px; }
    ul { padding-left: 20px; }
    li { margin-bottom: 4px; }
    strong { font-weight: 600; }
    hr { border: none; border-top: 1px solid #e0e0e0; margin: 16px 0; }
    p { margin: 8px 0; }
  </style>
</head>
<body>${html}</body>
</html>`
}

async function downloadPDF(content: string, title: string) {
  if (Platform.OS === 'web') {
    const html = markdownToHtml(content, title)
    const iframe = document.createElement('iframe')
    Object.assign(iframe.style, { position: 'fixed', right: '0', bottom: '0', width: '0', height: '0', border: '0' })
    document.body.appendChild(iframe)
    iframe.contentDocument!.write(html)
    iframe.contentDocument!.close()
    iframe.contentWindow!.focus()
    iframe.contentWindow!.print()
    setTimeout(() => document.body.removeChild(iframe), 1000)
    return
  }

  try {
    const Print = await import('expo-print')
    const Sharing = await import('expo-sharing')
    const html = markdownToHtml(content, title)
    const { uri } = await Print.printToFileAsync({ html })
    const canShare = await Sharing.isAvailableAsync()
    if (canShare) {
      await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' })
    } else {
      await Print.printAsync({ html })
    }
  } catch {
    Alert.alert('Error', 'Could not generate PDF')
  }
}

interface DocumentScreenProps {
  content: string
  titleKey: string
}

export function DocumentScreen({ content, titleKey }: DocumentScreenProps) {
  const { t } = useTranslation()
  const theme = useTheme()
  const title = t(titleKey)

  return (
    <YStack flex={1} backgroundColor="$background">
      <FadeIn>
        <XStack
          justifyContent="flex-end"
          paddingHorizontal="$4"
          paddingVertical="$2"
          borderBottomWidth={1}
          borderBottomColor="$borderColor"
        >
          <XStack
            alignItems="center"
            gap="$1.5"
            paddingHorizontal="$3"
            paddingVertical="$1.5"
            borderRadius="$3"
            borderWidth={1}
            borderColor="$borderColor"
            hoverStyle={{ backgroundColor: '$backgroundHover' } as any}
            cursor="pointer"
            onPress={() => downloadPDF(content, title)}
          >
            <Download size={16} color={theme.accent.val} />
            <Text fontSize="$2" color="$accent">
              {t('settings.downloadPDF')}
            </Text>
          </XStack>
        </XStack>
        <MarkdownView content={content} />
      </FadeIn>
    </YStack>
  )
}
