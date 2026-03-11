import { useState, useCallback } from 'react'
import { ScrollView, Platform, ActivityIndicator, RefreshControl } from 'react-native'
import { YStack, XStack, Text, H2, Input, useTheme } from 'tamagui'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTranslation } from '@mvp/i18n'
import { useBookmarksStore } from '@mvp/store'
import { FadeIn, SlideIn, AnimatedListItem, AppCard, ScalePress, AppAvatar } from '@mvp/ui'
import {
  Search,
  XCircle,
  TrendingUp,
  Palette,
  Code,
  Megaphone,
  BarChart3,
  Layers,
  LineChart,
  Lock,
  Server,
  Bookmark,
  HelpCircle,
} from 'lucide-react-native'
import type { LucideIcon } from 'lucide-react-native'
import { useSearch } from '@mvp/lib'
import { api } from '../../src/services/api'

const CATEGORY_ICON_MAP: Record<string, LucideIcon> = {
  'color-palette-outline': Palette,
  'code-slash-outline': Code,
  'megaphone-outline': Megaphone,
  'bar-chart-outline': BarChart3,
}

const FEATURED_ICON_MAP: Record<string, LucideIcon> = {
  'layers-outline': Layers,
  'analytics-outline': LineChart,
  'lock-closed-outline': Lock,
  'server-outline': Server,
}

const CATEGORIES = [
  { key: 'catDesign', icon: 'color-palette-outline', colorKey: 'accent' as const },
  { key: 'catDev', icon: 'code-slash-outline', colorKey: 'secondary' as const },
  { key: 'catMarketing', icon: 'megaphone-outline', colorKey: 'accent' as const },
  { key: 'catAnalytics', icon: 'bar-chart-outline', colorKey: 'secondary' as const },
]

const FEATURED = [
  { titleKey: 'item1Title', descKey: 'item1Desc', icon: 'layers-outline', colorKey: 'accent' as const },
  { titleKey: 'item2Title', descKey: 'item2Desc', icon: 'analytics-outline', colorKey: 'secondary' as const },
  { titleKey: 'item3Title', descKey: 'item3Desc', icon: 'lock-closed-outline', colorKey: 'accent' as const },
  { titleKey: 'item4Title', descKey: 'item4Desc', icon: 'server-outline', colorKey: 'secondary' as const },
]

export default function ExploreScreen() {
  const { t } = useTranslation()
  const insets = useSafeAreaInsets()
  const theme = useTheme()
  const { bookmarkedIds, toggle: toggleBookmark } = useBookmarksStore()
  const { query, setQuery, results, isLoading, addRecentSearch } = useSearch(
    async (q) => {
      const { data } = await api.get('/search', { params: { q } })
      return data.data
    }
  )
  const [refreshing, setRefreshing] = useState(false)

  const onRefresh = useCallback(() => {
    setRefreshing(true)
    setTimeout(() => setRefreshing(false), 1200)
  }, [])

  const hasSearchResults = query.length >= 2

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.background.val }}
      contentContainerStyle={{ paddingBottom: 40 }}
      refreshControl={
        Platform.OS !== 'web' ? (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.accent.val}
            colors={[theme.accent.val]}
            progressBackgroundColor={theme.cardBackground.val}
          />
        ) : undefined
      }
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

        {/* Search Bar */}
        <FadeIn>
          <XStack
            backgroundColor="$subtleBackground"
            borderRadius="$3"
            borderWidth={1}
            borderColor="$borderColor"
            paddingHorizontal="$3"
            alignItems="center"
            gap="$2"
          >
            <Search size={18} color={theme.mutedText.val} />
            <Input
              flex={1}
              placeholder={t('explore.searchPlaceholder')}
              value={query}
              onChangeText={setQuery}
              onSubmitEditing={() => { if (query.length >= 2) addRecentSearch(query) }}
              backgroundColor="transparent"
              borderWidth={0}
              height={42}
              fontSize="$2"
              color="$color"
              placeholderTextColor="$placeholderColor"
            />
            {isLoading && <ActivityIndicator size="small" />}
            {query.length > 0 && (
              <ScalePress onPress={() => setQuery('')}>
                <XCircle size={18} color={theme.mutedText.val} />
              </ScalePress>
            )}
          </XStack>
        </FadeIn>

        {/* Search Results */}
        {hasSearchResults && (
          <SlideIn from="bottom">
            <YStack gap="$3">
              <Text fontWeight="600" fontSize="$4" color="$color">
                {t('explore.searchResults')} ({results.length})
              </Text>
              {results.length === 0 && !isLoading ? (
                <Text color="$mutedText" fontSize="$2" textAlign="center" paddingVertical="$4">
                  {t('explore.noResults')}
                </Text>
              ) : (
                <YStack gap="$2">
                  {results.map((user: any, idx: number) => (
                    <AnimatedListItem key={user.id} index={idx}>
                      <AppCard animated={false}>
                        <XStack gap="$3" alignItems="center">
                          <AppAvatar name={user.name} uri={user.avatar_url} size={40} />
                          <Text fontWeight="600" fontSize="$3" color="$color">{user.name}</Text>
                        </XStack>
                      </AppCard>
                    </AnimatedListItem>
                  ))}
                </YStack>
              )}
            </YStack>
          </SlideIn>
        )}

        {/* Categories */}
        <SlideIn from="bottom" delay={100}>
          <YStack gap="$3">
            <Text fontWeight="600" fontSize="$4" color="$color">{t('explore.categories')}</Text>
            <XStack gap="$3" flexWrap="wrap">
              {CATEGORIES.map((cat) => {
                const color = cat.colorKey === 'accent' ? theme.accent.val : theme.secondary.val
                const colorEnd = cat.colorKey === 'accent' ? theme.accentGradientEnd.val : theme.accent.val
                const CatIcon = CATEGORY_ICON_MAP[cat.icon] || HelpCircle
                return (
                  <ScalePress key={cat.key} onPress={() => {}}>
                    <YStack width={80} alignItems="center" gap="$2">
                      <YStack
                        width={56}
                        height={56}
                        borderRadius={16}
                        alignItems="center"
                        justifyContent="center"
                        style={Platform.OS === 'web'
                          ? { background: `linear-gradient(135deg, ${color}, ${colorEnd})` }
                          : { backgroundColor: color }
                        }
                      >
                        <CatIcon size={24} color="white" />
                      </YStack>
                      <Text fontSize="$1" color="$mutedText" textAlign="center" numberOfLines={1}>
                        {t(`explore.${cat.key}`)}
                      </Text>
                    </YStack>
                  </ScalePress>
                )
              })}
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
                const itemColor = item.colorKey === 'accent' ? theme.accent.val : theme.secondary.val
                const FeaturedIcon = FEATURED_ICON_MAP[item.icon] || HelpCircle
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
                          <FeaturedIcon size={22} color={itemColor} />
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
                          <Bookmark
                            size={20}
                            color={isBookmarked ? theme.accent.val : theme.mutedText.val}
                            {...(isBookmarked ? { fill: theme.accent.val } : {})}
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
                <TrendingUp size={20} color={theme.accent.val} />
                <Text fontWeight="600" fontSize="$4" color="$color">{t('explore.trending')}</Text>
              </XStack>
              <XStack gap="$2" flexWrap="wrap">
                {['React Native', 'TypeScript', 'Tamagui', 'Expo', 'Fastify', 'Drizzle'].map((tag, i) => {
                  const isAccented = i % 3 === 0
                  const isSecondary = i % 3 === 1
                  return (
                    <YStack
                      key={tag}
                      backgroundColor={isAccented ? (theme.accent.val + '18') : isSecondary ? (theme.secondary.val + '18') : '$subtleBackground'}
                      paddingHorizontal="$3"
                      paddingVertical="$1.5"
                      borderRadius="$2"
                      borderWidth={1}
                      borderColor={isAccented ? '$accent' : isSecondary ? '$secondary' : '$borderColor'}
                    >
                      <Text fontSize="$2" color={isAccented ? '$accent' : isSecondary ? '$secondary' : '$color'}>{tag}</Text>
                    </YStack>
                  )
                })}
              </XStack>
            </YStack>
          </AppCard>
        </SlideIn>
      </YStack>
    </ScrollView>
  )
}
