import { useState, useCallback, useRef } from 'react'
import { ScrollView, Platform, RefreshControl } from 'react-native'
import { YStack, XStack, Text, H2, useTheme } from 'tamagui'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTranslation } from '@mvp/i18n'
import { useAuthStore } from '@mvp/store'
import { router } from 'expo-router'
import { FadeIn, SlideIn, AnimatedListItem, AppCard, AppButton, ScalePress } from '@mvp/ui'
import { CoachMark } from '@mvp/onboarding'
import { Ionicons } from '@expo/vector-icons'

function StatCard({ value, label, icon, color }: { value: string; label: string; icon: keyof typeof Ionicons.glyphMap; color: string }) {
  return (
    <AppCard flex={1} padding="$3" gap="$2" alignItems="center">
      <Ionicons name={icon} size={24} color={color} />
      <Text fontSize="$6" fontWeight="bold" color="$color">{value}</Text>
      <Text fontSize="$1" color="$mutedText" textAlign="center">{label}</Text>
    </AppCard>
  )
}

function CallItem({ name, phone, duration, status, time }: { name: string; phone: string; duration: string; status: 'answered' | 'missed' | 'failed'; time: string }) {
  const theme = useTheme()
  const iconMap = { answered: 'call-outline', missed: 'call-missed-outline', failed: 'close-circle-outline' } as const
  const colorMap = { answered: theme.success.val, missed: theme.error.val, failed: theme.mutedText.val }
  return (
    <XStack gap="$3" alignItems="center" paddingVertical="$2">
      <YStack
        width={36}
        height={36}
        borderRadius={18}
        backgroundColor={colorMap[status] + '18'}
        alignItems="center"
        justifyContent="center"
      >
        <Ionicons name={iconMap[status]} size={16} color={colorMap[status]} />
      </YStack>
      <YStack flex={1}>
        <Text fontSize="$2" color="$color" fontWeight="500">{name}</Text>
        <Text fontSize="$1" color="$mutedText">{phone}</Text>
      </YStack>
      <YStack alignItems="flex-end">
        <Text fontSize="$1" color="$mutedText">{duration}</Text>
        <Text fontSize="$1" color="$mutedText">{time}</Text>
      </YStack>
    </XStack>
  )
}

export default function HomeScreen() {
  const { t } = useTranslation()
  const insets = useSafeAreaInsets()
  const user = useAuthStore((s) => s.user)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const theme = useTheme()
  const [refreshing, setRefreshing] = useState(false)
  const scrollRef = useRef<ScrollView>(null)

  const onRefresh = useCallback(() => {
    setRefreshing(true)
    setTimeout(() => setRefreshing(false), 1200)
  }, [])

  const greeting = isAuthenticated
    ? `${t('home.welcome')}, ${user?.name?.split(' ')[0] ?? ''}`
    : t('home.welcomeGuest')

  return (
    <ScrollView
      ref={scrollRef}
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
            title=""
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
            <H2 color="$color">{greeting}</H2>
            <Text color="$mutedText" fontSize="$3">{t('home.subtitle')}</Text>
          </YStack>
        </FadeIn>

        {/* Stats */}
        <SlideIn from="bottom" delay={100}>
          <CoachMark stepId="home-stats" scrollRef={scrollRef}>
            <XStack gap="$3">
              <StatCard value="0" label={t('home.callsToday')} icon="call-outline" color={theme.accent.val} />
              <StatCard value="0" label={t('home.callsMonth')} icon="bar-chart-outline" color={theme.secondary.val} />
              <StatCard value="30" label={t('home.freeLeft')} icon="gift-outline" color={theme.success.val} />
            </XStack>
          </CoachMark>
        </SlideIn>

        {/* Quick Actions */}
        <SlideIn from="bottom" delay={200}>
          <CoachMark stepId="home-actions" scrollRef={scrollRef}>
            <YStack gap="$3">
              <Text fontWeight="600" fontSize="$4" color="$color">{t('home.quickActions')}</Text>
              <XStack gap="$3" flexWrap="wrap">
                <AppButton variant="accent" size="sm" onPress={() => {}}>
                  <XStack gap="$2" alignItems="center">
                    <Ionicons name="extension-puzzle-outline" size={16} color={theme.background.val} />
                    <Text color="$background" fontWeight="600" fontSize="$2">{t('home.openExtension')}</Text>
                  </XStack>
                </AppButton>
                <AppButton variant="outline" size="sm" onPress={() => router.push('/explore')}>
                  <XStack gap="$2" alignItems="center">
                    <Ionicons name="time-outline" size={16} color={theme.color.val} />
                    <Text color="$color" fontSize="$2">{t('home.viewHistory')}</Text>
                  </XStack>
                </AppButton>
                <AppButton variant="outline" size="sm" onPress={() => router.push('/billing')}>
                  <XStack gap="$2" alignItems="center">
                    <Ionicons name="rocket-outline" size={16} color={theme.color.val} />
                    <Text color="$color" fontSize="$2">{t('home.upgradePro')}</Text>
                  </XStack>
                </AppButton>
              </XStack>
            </YStack>
          </CoachMark>
        </SlideIn>

        {/* Recent Calls */}
        <SlideIn from="bottom" delay={300}>
          <AppCard>
            <Text fontWeight="600" fontSize="$4" color="$color" marginBottom="$3">{t('home.recentCalls')}</Text>
            {!isAuthenticated ? (
              <YStack gap="$2">
                <AnimatedListItem index={0}>
                  <CallItem name="Ivan Petrov" phone="+7 999 123-45-67" duration="2:15" status="answered" time="10m ago" />
                </AnimatedListItem>
                <AnimatedListItem index={1}>
                  <CallItem name="Anna Smirnova" phone="+7 903 456-78-90" duration="—" status="missed" time="1h ago" />
                </AnimatedListItem>
                <AnimatedListItem index={2}>
                  <CallItem name="Dmitry Kozlov" phone="+7 916 789-01-23" duration="5:42" status="answered" time="2h ago" />
                </AnimatedListItem>
              </YStack>
            ) : (
              <Text color="$mutedText" fontSize="$2" textAlign="center" paddingVertical="$4">
                {t('home.noCallsYet')}
              </Text>
            )}
          </AppCard>
        </SlideIn>

        {/* Install extension CTA */}
        <SlideIn from="bottom" delay={400}>
          <AppCard borderColor="$accent" borderWidth={0.5}>
            <YStack gap="$3" alignItems="center">
              <Ionicons name="logo-chrome" size={32} color={theme.accent.val} />
              <Text fontWeight="600" fontSize="$3" color="$color" textAlign="center">
                {t('home.installExtension')}
              </Text>
              <Text color="$mutedText" fontSize="$2" textAlign="center">
                {t('home.installExtensionDesc')}
              </Text>
              <AppButton variant="accent" size="sm" onPress={() => {}}>
                {t('home.installNow')}
              </AppButton>
            </YStack>
          </AppCard>
        </SlideIn>

        {/* Sign in CTA for guests */}
        {!isAuthenticated && (
          <SlideIn from="bottom" delay={500}>
            <AppCard borderColor="$borderColor" borderWidth={0.5}>
              <YStack gap="$3" alignItems="center">
                <Text fontWeight="600" fontSize="$3" color="$color" textAlign="center">
                  {t('profile.signInPrompt')}
                </Text>
                <XStack gap="$3">
                  <AppButton size="sm" onPress={() => router.push('/sign-in')}>
                    {t('auth.signIn')}
                  </AppButton>
                  <AppButton size="sm" variant="outline" onPress={() => router.push('/sign-up')}>
                    {t('auth.createAccount')}
                  </AppButton>
                </XStack>
              </YStack>
            </AppCard>
          </SlideIn>
        )}
      </YStack>
    </ScrollView>
  )
}