import { YStack, Text, H1 } from 'tamagui'
import { useTranslation } from '@mvp/i18n'
import { FadeIn } from '@mvp/ui'

export default function PrivacyScreen() {
  const { t } = useTranslation()

  return (
    <YStack flex={1} padding="$4" gap="$4">
      <FadeIn>
        <H1>{t('settings.privacy')}</H1>
      </FadeIn>

      <Text color="$mutedText">
        Privacy policy will be added in Phase 16
      </Text>
    </YStack>
  )
}
