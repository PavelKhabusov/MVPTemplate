import { YStack, Text, H1 } from 'tamagui'
import { useTranslation } from '@mvp/i18n'
import { FadeIn } from '@mvp/ui'

export default function ExploreScreen() {
  const { t } = useTranslation()

  return (
    <YStack flex={1} alignItems="center" justifyContent="center" padding="$4" gap="$4">
      <FadeIn>
        <H1>{t('tabs.explore')}</H1>
      </FadeIn>

      <Text color="$mutedText" textAlign="center">
        Explore content will go here
      </Text>
    </YStack>
  )
}
