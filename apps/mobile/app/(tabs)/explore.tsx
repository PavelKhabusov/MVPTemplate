import { ScrollView, Platform } from 'react-native'
import { YStack, XStack, Text, H2, useTheme } from 'tamagui'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTranslation } from '@mvp/i18n'
import { useBookmarksStore } from '@mvp/store'
import { FadeIn, SlideIn, AnimatedListItem, AppCard, ScalePress } from '@mvp/ui'
import { Ionicons } from '@expo/vector-icons'

const CATEGORIES = [
  { key: 'catDesign', icon: 'color-palette-outline' as const, gradient: ['#FF6B35', '#FF8F66'] },
  { key: 'catDev', icon: 'code-slash-outline' as const, gradient: ['#00D4FF', '#38E8FF'] },
  { key: 'catMarketing', icon: 'megaphone-outline' as const, gradient: ['#A855F7', '#C084FC'] },
  { key: 'catAnalytics', icon: 'bar-chart-outline' as const, gradient: ['#10B981', '#34D399'] },
]

const FEATURED = [
  { titleKey: 'item1Title', descKey: 'item1Desc', icon: 'layers-outline' as const, accent: '#00D4FF' },
  { titleKey: 'item2Title', descKey: 'item2Desc', icon: 'analytics-outline' as const, accent: '#A855F7' },
  { titleKey: 'item3Title', descKey: 'item3Desc', icon: 'lock-closed-outline' as const, accent: '#FF6B35' },
  { titleKey: 'item4Title', descKey: 'item4Desc', icon: 'server-outline' as const, accent: '#10B981' },
]

export default function ExploreScreen() {
  const { t } = useTranslation()
  const insets = useSafeAreaInsets()
  const theme = useTheme()
  const { bookmarkedIds, toggle: toggleBookmark } = useBookmarksStore()

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.background.val }}
      contentContainerStyle={{ paddingBottom: 40 }}
    >
      <YStack
        flex={1}
        padding="$4"
        paddingTop={Platform.OS === 'web' ? '$4' : insets.top + 16}
        gap="$5"
        backgroundColor="$background"
      >
        {/* Header */}
        <FadeIn>
          <YStack gap="$1">
            <H2 color="$color">{t('explore.title')}</H2>
            <Text color="$mutedText" fontSize="$3">{t('explore.subtitle')}</Text>
          </YStack>
        </FadeIn>

        {/* Categories */}
        <SlideIn from="bottom" delay={100}>
          <YStack gap="$3">
            <Text fontWeight="600" fontSize="$4" color="$color">{t('explore.categories')}</Text>
            <XStack gap="$3" flexWrap="wrap">
              {CATEGORIES.map((cat) => (
                <ScalePress key={cat.key} onPress={() => {}}>
                  <YStack
                    width={80}
                    alignItems="center"
                    gap="$2"
                  >
                    <YStack
                      width={56}
                      height={56}
                      borderRadius={16}
                      alignItems="center"
                      justifyContent="center"
                      style={{
                        background: Platform.OS === 'web'
                          ? `linear-gradient(135deg, ${cat.gradient[0]}, ${cat.gradient[1]})`
                          : undefined,
                        backgroundColor: Platform.OS !== 'web' ? cat.gradient[0] : undefined,
                      }}
                    >
                      <Ionicons name={cat.icon} size={24} color="white" />
                    </YStack>
                    <Text fontSize="$1" color="$mutedText" textAlign="center" numberOfLines={1}>
                      {t(`explore.${cat.key}`)}
                    </Text>
                  </YStack>
                </ScalePress>
              ))}
            </XStack>
          </YStack>
        </SlideIn>

        {/* Featured */}
        <SlideIn from="bottom" delay={200}>
          <YStack gap="$3">
            <XStack justifyContent="space-between" alignItems="center">
              <Text fontWeight="600" fontSize="$4" color="$color">{t('explore.featured')}</Text>
              <Text fontSize="$2" color="$accent">{t('common.viewAll')}</Text>
            </XStack>
            <YStack gap="$3">
              {FEATURED.map((item, idx) => {
                const isBookmarked = bookmarkedIds.includes(item.titleKey)
                return (
                  <AnimatedListItem key={item.titleKey} index={idx}>
                    <AppCard animated={false}>
                      <XStack gap="$3" alignItems="center">
                        <YStack
                          width={44}
                          height={44}
                          borderRadius={12}
                          backgroundColor="$subtleBackground"
                          alignItems="center"
                          justifyContent="center"
                        >
                          <Ionicons name={item.icon} size={22} color={item.accent} />
                        </YStack>
                        <YStack flex={1} gap="$1">
                          <Text fontWeight="600" fontSize="$3" color="$color">
                            {t(`explore.${item.titleKey}`)}
                          </Text>
                          <Text fontSize="$2" color="$mutedText" numberOfLines={1}>
                            {t(`explore.${item.descKey}`)}
                          </Text>
                        </YStack>
                        <ScalePress onPress={() => toggleBookmark(item.titleKey)}>
                          <Ionicons
                            name={isBookmarked ? 'bookmark' : 'bookmark-outline'}
                            size={20}
                            color={isBookmarked ? theme.accent.val : theme.mutedText.val}
                          />
                        </ScalePress>
                      </XStack>
                    </AppCard>
                  </AnimatedListItem>
                )
              })}
            </YStack>
          </YStack>
        </SlideIn>

        {/* Trending section */}
        <SlideIn from="bottom" delay={300}>
          <AppCard>
            <YStack gap="$3">
              <XStack gap="$2" alignItems="center">
                <Ionicons name="trending-up" size={20} color={theme.accent.val} />
                <Text fontWeight="600" fontSize="$4" color="$color">{t('explore.trending')}</Text>
              </XStack>
              <XStack gap="$2" flexWrap="wrap">
                {['React Native', 'TypeScript', 'Tamagui', 'Expo', 'Fastify', 'Drizzle'].map((tag) => (
                  <YStack
                    key={tag}
                    backgroundColor="$subtleBackground"
                    paddingHorizontal="$3"
                    paddingVertical="$1.5"
                    borderRadius="$2"
                    borderWidth={1}
                    borderColor="$borderColor"
                  >
                    <Text fontSize="$2" color="$color">{tag}</Text>
                  </YStack>
                ))}
              </XStack>
            </YStack>
          </AppCard>
        </SlideIn>
      </YStack>
    </ScrollView>
  )
}
