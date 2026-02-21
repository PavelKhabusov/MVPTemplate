import { YStack } from 'tamagui'
import { useTranslation } from '@mvp/i18n'
import { FadeIn } from '@mvp/ui'
import { MarkdownView } from '@mvp/docs'
import { getTermsOfService } from '../assets/content/terms-of-service'

export default function TermsScreen() {
  const { i18n } = useTranslation()

  return (
    <YStack flex={1} backgroundColor="$background">
      <FadeIn>
        <MarkdownView content={getTermsOfService(i18n.language)} />
      </FadeIn>
    </YStack>
  )
}
