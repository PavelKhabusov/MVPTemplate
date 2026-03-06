import { useState, useCallback } from 'react'
import { ScrollView, Platform, RefreshControl } from 'react-native'
import { YStack, XStack, Text, H2, useTheme } from 'tamagui'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTranslation } from '@mvp/i18n'
import { FadeIn, SlideIn, AnimatedListItem, AppCard } from '@mvp/ui'
import { Ionicons } from '@expo/vector-icons'

const MONTHLY_STATS = [
  { key: 'answered', icon: 'call-outline' as const, colorKey: 'success' as const, value: 0 },
  { key: 'missed', icon: 'call-missed-outline' as const, colorKey: 'error' as const, value: 0 },
  { key: 'total', icon: 'bar-chart-outline' as const, colorKey: 'accent' as const, value: 0 },
  { key: 'minutes', icon: 'time-outline' as const, colorKey: 'secondary' as const, value: 0 },
]

export default function ExploreScreen() {
  const { t } = useTranslation()
  const insets = useSafeAreaInsets()
  const theme = useTheme()
  const [refreshing, setRefreshing] = useState(false)

  const onRefresh = useCallback(() => {
    setRefreshing(true)
    setTimeout(() => setRefreshing(false), 1200)
  }, [])

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

        {/* Monthly Stats Grid */}
        <SlideIn from="bottom" delay={100}>
          <YStack gap="$3">
            <Text fontWeight="600" fontSize="$4" color="$color">{t('explore.thisMonth')}</Text>
            <XStack gap="$3" flexWrap="wrap">
              {MONTHLY_STATS.map((stat) => {
                const colorVal = stat.colorKey === 'accent'
                  ? theme.accent.val
                  : stat.colorKey === 'secondary'
                  ? theme.secondary.val
                  : stat.colorKey === 'success'
                  ? theme.success.val
                  : theme.error.val
                return (
                  <AppCard key={stat.key} flex={1} minWidth={130} padding="$3" gap="$2" alignItems="center">
                    <YStack
                      width={40}
                      height={40}
                      borderRadius={20}
                      backgroundColor={colorVal + '18'}
                      alignItems="center"
                      justifyContent="center"
                    >
                      <Ionicons name={stat.icon} size={20} color={colorVal} />
                    </YStack>
                    <Text fontSize="$6" fontWeight="bold" color="$color">{stat.value}</Text>
                    <Text fontSize="$1" color="$mutedText" textAlign="center">
                      {t(`explore.stat${stat.key.charAt(0).toUpperCase() + stat.key.slice(1)}`)}
                    </Text>
                  </AppCard>
                )
              })}
            </XStack>
          </YStack>
        </SlideIn>

        {/* FREE Quota */}
        <SlideIn from="bottom" delay={200}>
          <AppCard>
            <YStack gap="$3">
              <XStack justifyContent="space-between" alignItems="center">
                <XStack gap="$2" alignItems="center">
                  <Ionicons name="gift-outline" size={20} color={theme.accent.val} />
                  <Text fontWeight="600" fontSize="$4" color="$color">{t('explore.freeQuota')}</Text>
                </XStack>
                <Text fontSize="$2" color="$accent">FREE</Text>
              </XStack>
              <YStack gap="$1">
                <XStack justifyContent="space-between">
                  <Text fontSize="$2" color="$mutedText">{t('explore.callsUsed')}</Text>
                  <Text fontSize="$2" color="$color" fontWeight="600">0 / 30</Text>
                </XStack>
                <YStack
                  height={6}
                  borderRadius={3}
                  backgroundColor="$subtleBackground"
                  overflow="hidden"
                >
                  <YStack
                    height="100%"
                    width="0%"
                    borderRadius={3}
                    backgroundColor="$accent"
                  />
                </YStack>
              </YStack>
              <Text fontSize="$1" color="$mutedText">{t('explore.quotaResetNote')}</Text>
            </YStack>
          </AppCard>
        </SlideIn>

        {/* Recent Call History */}
        <SlideIn from="bottom" delay={300}>
          <YStack gap="$3">
            <XStack justifyContent="space-between" alignItems="center">
              <Text fontWeight="600" fontSize="$4" color="$color">{t('explore.callHistory')}</Text>
            </XStack>
            <AnimatedListItem index={0}>
              <AppCard animated={false}>
                <YStack gap="$2" alignItems="center" paddingVertical="$4">
                  <Ionicons name="call-outline" size={32} color={theme.mutedText.val} />
                  <Text color="$mutedText" fontSize="$2" textAlign="center">
                    {t('explore.noCallsYet')}
                  </Text>
                  <Text color="$mutedText" fontSize="$1" textAlign="center">
                    {t('explore.noCallsHint')}
                  </Text>
                </YStack>
              </AppCard>
            </AnimatedListItem>
          </YStack>
        </SlideIn>

        {/* Tips */}
        <SlideIn from="bottom" delay={400}>
          <AppCard>
            <YStack gap="$3">
              <XStack gap="$2" alignItems="center">
                <Ionicons name="bulb-outline" size={20} color={theme.accent.val} />
                <Text fontWeight="600" fontSize="$4" color="$color">{t('explore.tips')}</Text>
              </XStack>
              <YStack gap="$2">
                {['tip1', 'tip2', 'tip3'].map((key, i) => (
                  <AnimatedListItem key={key} index={i}>
                    <XStack gap="$2" alignItems="flex-start">
                      <Text color="$accent" fontSize="$2" fontWeight="600">{i + 1}.</Text>
                      <Text color="$mutedText" fontSize="$2" flex={1}>{t(`explore.${key}`)}</Text>
                    </XStack>
                  </AnimatedListItem>
                ))}
              </YStack>
            </YStack>
          </AppCard>
        </SlideIn>
      </YStack>
    </ScrollView>
  )
}