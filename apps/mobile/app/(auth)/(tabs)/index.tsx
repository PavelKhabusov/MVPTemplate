import { YStack, Text, H1 } from 'tamagui'
import { useTranslation } from '@mvp/i18n'
import { FadeIn, SlideIn, ScalePress } from '@mvp/ui'

export default function HomeScreen() {
  const { t } = useTranslation()

  return (
    <YStack flex={1} alignItems="center" justifyContent="center" padding="$4" gap="$4">
      <FadeIn>
        <H1>{t('tabs.home')}</H1>
      </FadeIn>

      <SlideIn from="bottom" delay={200}>
        <Text color="$mutedText" textAlign="center">
          Expo + Tamagui + Reanimated + Moti
        </Text>
      </SlideIn>

      <SlideIn from="bottom" delay={400}>
        <ScalePress onPress={() => console.log('Pressed!')}>
          <YStack
            backgroundColor="$primary"
            paddingHorizontal="$6"
            paddingVertical="$3"
            borderRadius="$4"
          >
            <Text color="white" fontWeight="bold">
              Get Started
            </Text>
          </YStack>
        </ScalePress>
      </SlideIn>
    </YStack>
  )
}
