import { ScrollView } from 'react-native'
import { YStack, Text, H2 } from 'tamagui'
import { router } from 'expo-router'
import { useTranslation } from '@mvp/i18n'
import { useAuthStore } from '@mvp/store'
import { FadeIn, SlideIn, AppAvatar, AppButton, AppCard } from '@mvp/ui'

export default function ProfileScreen() {
  const { t } = useTranslation()
  const user = useAuthStore((s) => s.user)

  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
      <YStack flex={1} padding="$4" gap="$4" alignItems="center">
        <FadeIn>
          <YStack alignItems="center" gap="$3" paddingTop="$6">
            <AppAvatar uri={user?.avatarUrl} name={user?.name} size={80} />
            <H2>{user?.name ?? 'Guest'}</H2>
            <Text color="$mutedText" fontSize="$3">
              {user?.email ?? ''}
            </Text>
          </YStack>
        </FadeIn>

        <SlideIn from="bottom" delay={200}>
          <AppCard width="100%">
            <YStack gap="$2">
              <Text fontWeight="600">{t('profile.name')}</Text>
              <Text color="$mutedText">{user?.name ?? '-'}</Text>
            </YStack>
            <YStack gap="$2" marginTop="$3">
              <Text fontWeight="600">{t('profile.email')}</Text>
              <Text color="$mutedText">{user?.email ?? '-'}</Text>
            </YStack>
          </AppCard>
        </SlideIn>

        <SlideIn from="bottom" delay={300}>
          <AppButton
            variant="outline"
            onPress={() => router.push('/(auth)/settings')}
          >
            {t('settings.title')}
          </AppButton>
        </SlideIn>
      </YStack>
    </ScrollView>
  )
}
