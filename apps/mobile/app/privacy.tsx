import { YStack } from 'tamagui'
import { useTranslation } from '@mvp/i18n'
import { FadeIn } from '@mvp/ui'
import { MarkdownView } from '../src/features/documentation/MarkdownView'
import { getPrivacyPolicy } from '../assets/content/privacy-policy'

export default function PrivacyScreen() {
  const { i18n } = useTranslation()

  return (
    <YStack flex={1} backgroundColor="$background">
      <FadeIn>
        <MarkdownView content={getPrivacyPolicy(i18n.language)} />
      </FadeIn>
    </YStack>
  )
}
