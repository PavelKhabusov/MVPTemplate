import { ScrollView, Platform } from 'react-native'
import { YStack, XStack, Text, H2, useTheme } from 'tamagui'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { useTranslation } from '@mvp/i18n'
import { useAuthStore } from '@mvp/store'
import { FadeIn, SlideIn, AppAvatar, AppButton, AppCard, AnimatedListItem } from '@mvp/ui'
import { Ionicons } from '@expo/vector-icons'

function ProfileStat({ value, label }: { value: string; label: string }) {
  return (
    <YStack flex={1} alignItems="center" gap="$1">
      <Text fontSize="$6" fontWeight="bold" color="$color">{value}</Text>
      <Text fontSize="$1" color="$mutedText">{label}</Text>
    </YStack>
  )
}

export default function ProfileScreen() {
  const { t } = useTranslation()
  const insets = useSafeAreaInsets()
  const user = useAuthStore((s) => s.user)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const theme = useTheme()

  if (!isAuthenticated) {
    return (
      <YStack
        flex={1}
        alignItems="center"
        justifyContent="center"
        padding="$4"
        paddingTop={Platform.OS === 'web' ? '$4' : insets.top}
        gap="$4"
        backgroundColor="$background"
      >
        <FadeIn>
          <YStack alignItems="center" gap="$3">
            <AppAvatar name="?" size={80} />
            <H2>{t('auth.signIn')}</H2>
            <Text color="$mutedText" textAlign="center" maxWidth={300}>
              {t('profile.signInPrompt')}
            </Text>
          </YStack>
        </FadeIn>

        <SlideIn from="bottom" delay={200}>
          <YStack gap="$3" width={250}>
            <AppButton onPress={() => router.push('/sign-in')}>
              {t('auth.signIn')}
            </AppButton>
            <AppButton variant="outline" onPress={() => router.push('/sign-up')}>
              {t('auth.createAccount')}
            </AppButton>
          </YStack>
        </SlideIn>
      </YStack>
    )
  }

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
        {/* Profile Header */}
        <FadeIn>
          <YStack alignItems="center" gap="$3">
            <AppAvatar uri={user?.avatarUrl} name={user?.name} size={88} />
            <YStack alignItems="center" gap="$1">
              <H2 color="$color">{user?.name ?? 'Guest'}</H2>
              <Text color="$mutedText" fontSize="$3">{user?.email ?? ''}</Text>
            </YStack>
          </YStack>
        </FadeIn>

        {/* Stats Row */}
        <SlideIn from="bottom" delay={100}>
          <AppCard>
            <XStack>
              <ProfileStat value="5" label={t('profile.projects')} />
              <YStack width={1} backgroundColor="$borderColor" />
              <ProfileStat value="23" label={t('profile.tasksCompleted')} />
              <YStack width={1} backgroundColor="$borderColor" />
              <ProfileStat value="7" label={t('profile.streak')} />
            </XStack>
          </AppCard>
        </SlideIn>

        {/* Profile Details */}
        <SlideIn from="bottom" delay={200}>
          <AppCard gap="$3">
            <YStack gap="$2">
              <Text fontWeight="600" color="$color">{t('profile.name')}</Text>
              <Text color="$mutedText">{user?.name ?? '-'}</Text>
            </YStack>
            <YStack width="100%" height={1} backgroundColor="$borderColor" />
            <YStack gap="$2">
              <Text fontWeight="600" color="$color">{t('profile.email')}</Text>
              <Text color="$mutedText">{user?.email ?? '-'}</Text>
            </YStack>
          </AppCard>
        </SlideIn>

        {/* Actions */}
        <SlideIn from="bottom" delay={300}>
          <YStack gap="$3">
            <AppButton variant="outline" onPress={() => router.push('/settings')}>
              <XStack gap="$2" alignItems="center">
                <Ionicons name="settings-outline" size={18} color={theme.color.val} />
                <Text color="$color" fontWeight="600">{t('settings.title')}</Text>
              </XStack>
            </AppButton>
          </YStack>
        </SlideIn>
      </YStack>
    </ScrollView>
  )
}
