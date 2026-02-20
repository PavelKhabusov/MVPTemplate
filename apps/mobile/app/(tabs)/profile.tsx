import { useState, useCallback } from 'react'
import { ScrollView, Platform, Alert, RefreshControl } from 'react-native'
import { YStack, XStack, Text, H2, Input, useTheme } from 'tamagui'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { useTranslation } from '@mvp/i18n'
import { useAuthStore } from '@mvp/store'
import { FadeIn, SlideIn, AppAvatar, AppButton, AppCard, ScalePress } from '@mvp/ui'
import { Ionicons } from '@expo/vector-icons'
import { api } from '../../src/services/api'
import { secureStorage } from '@mvp/lib'

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
  const [refreshing, setRefreshing] = useState(false)

  const onRefresh = useCallback(() => {
    setRefreshing(true)
    setTimeout(() => setRefreshing(false), 1200)
  }, [])

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

        {/* Profile Details / Edit */}
        <SlideIn from="bottom" delay={200}>
          <EditProfileSection />
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

function EditProfileSection() {
  const { t } = useTranslation()
  const theme = useTheme()
  const user = useAuthStore((s) => s.user)
  const setUser = useAuthStore((s) => s.setUser)
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(user?.name ?? '')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    const trimmed = name.trim()
    if (!trimmed || trimmed === user?.name) {
      setEditing(false)
      return
    }

    setSaving(true)
    try {
      const { data } = await api.patch('/users/profile', { name: trimmed })
      if (data?.data && user) {
        setUser({ ...user, name: data.data.name })
      }
      setEditing(false)
    } catch (err: any) {
      // In demo mode (no backend), update locally
      if (!err.response && user) {
        const updated = { ...user, name: trimmed }
        setUser(updated)
        await secureStorage.set('demoUser', JSON.stringify(updated))
        setEditing(false)
      } else {
        Alert.alert(t('common.error'), t('common.retry'))
      }
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setName(user?.name ?? '')
    setEditing(false)
  }

  if (editing) {
    return (
      <AppCard gap="$3">
        <XStack justifyContent="space-between" alignItems="center">
          <Text fontWeight="600" fontSize="$4" color="$color">{t('profile.editProfile')}</Text>
          <ScalePress onPress={handleCancel}>
            <Ionicons name="close" size={20} color={theme.mutedText.val} />
          </ScalePress>
        </XStack>

        <YStack gap="$2">
          <Text fontWeight="600" color="$color" fontSize="$2">{t('profile.name')}</Text>
          <Input
            value={name}
            onChangeText={setName}
            backgroundColor="$subtleBackground"
            borderWidth={1}
            borderColor="$borderColor"
            borderRadius="$3"
            paddingHorizontal="$3"
            height={42}
            fontSize="$3"
            color="$color"
            autoFocus
          />
        </YStack>

        <YStack gap="$2">
          <Text fontWeight="600" color="$color" fontSize="$2">{t('profile.email')}</Text>
          <Text color="$mutedText" fontSize="$3">{user?.email ?? '-'}</Text>
        </YStack>

        <AppButton onPress={handleSave} disabled={saving}>
          {saving ? t('common.loading') : t('common.save')}
        </AppButton>
      </AppCard>
    )
  }

  return (
    <AppCard gap="$3">
      <XStack justifyContent="space-between" alignItems="center">
        <Text fontWeight="600" fontSize="$4" color="$color">{t('profile.title')}</Text>
        <ScalePress onPress={() => setEditing(true)}>
          <XStack gap="$1" alignItems="center">
            <Ionicons name="pencil-outline" size={16} color={theme.accent.val} />
            <Text fontSize="$2" color="$accent">{t('profile.editProfile')}</Text>
          </XStack>
        </ScalePress>
      </XStack>

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
  )
}
