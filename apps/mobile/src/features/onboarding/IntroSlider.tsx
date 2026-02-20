import { useState, useCallback } from 'react'
import { Dimensions, FlatList } from 'react-native'
import { YStack, Text, H1 } from 'tamagui'
import { MotiView } from 'moti'
import { useTranslation } from '@mvp/i18n'
import { AppButton, FadeIn } from '@mvp/ui'
import { useAppStore } from '@mvp/store'

const { width: SCREEN_WIDTH } = Dimensions.get('window')

interface Slide {
  titleKey: string
  descriptionKey: string
  emoji: string
}

const SLIDES: Slide[] = [
  { titleKey: 'onboarding.slide1Title', descriptionKey: 'onboarding.slide1Description', emoji: '👋' },
  { titleKey: 'onboarding.slide2Title', descriptionKey: 'onboarding.slide2Description', emoji: '🔍' },
  { titleKey: 'onboarding.slide3Title', descriptionKey: 'onboarding.slide3Description', emoji: '🚀' },
]

export function IntroSlider({ onComplete }: { onComplete: () => void }) {
  const { t } = useTranslation()
  const [activeIndex, setActiveIndex] = useState(0)
  const setOnboardingComplete = useAppStore((s) => s.setOnboardingComplete)

  const handleComplete = useCallback(() => {
    setOnboardingComplete()
    onComplete()
  }, [setOnboardingComplete, onComplete])

  const renderSlide = ({ item, index }: { item: Slide; index: number }) => (
    <YStack
      width={SCREEN_WIDTH}
      flex={1}
      alignItems="center"
      justifyContent="center"
      padding="$6"
      gap="$4"
    >
      <MotiView
        from={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', damping: 15 }}
        key={`emoji-${index}`}
      >
        <Text fontSize={72}>{item.emoji}</Text>
      </MotiView>

      <FadeIn delay={200}>
        <H1 textAlign="center">{t(item.titleKey)}</H1>
      </FadeIn>

      <FadeIn delay={400}>
        <Text color="$mutedText" textAlign="center" fontSize="$4" lineHeight="$4">
          {t(item.descriptionKey)}
        </Text>
      </FadeIn>
    </YStack>
  )

  const isLast = activeIndex === SLIDES.length - 1

  return (
    <YStack flex={1} backgroundColor="$background">
      <FlatList
        data={SLIDES}
        renderItem={renderSlide}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => {
          const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH)
          setActiveIndex(idx)
        }}
      />

      {/* Dots */}
      <YStack alignItems="center" paddingBottom="$4">
        <YStack flexDirection="row" gap="$2" marginBottom="$4">
          {SLIDES.map((_, i) => (
            <MotiView
              key={i}
              animate={{
                width: i === activeIndex ? 24 : 8,
                backgroundColor: i === activeIndex ? '#6366F1' : '#d1d5db',
              }}
              transition={{ type: 'spring', damping: 20 }}
              style={{ height: 8, borderRadius: 4 }}
            />
          ))}
        </YStack>

        <YStack paddingHorizontal="$6" width="100%">
          {isLast ? (
            <AppButton onPress={handleComplete} size="lg">
              {t('onboarding.getStarted')}
            </AppButton>
          ) : (
            <AppButton variant="ghost" onPress={handleComplete}>
              {t('onboarding.skip')}
            </AppButton>
          )}
        </YStack>
      </YStack>
    </YStack>
  )
}
