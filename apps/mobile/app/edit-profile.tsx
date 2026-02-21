import { useState } from 'react'
import { Alert, Platform } from 'react-native'
import { ScrollView } from 'react-native'
import { YStack, Text, Input, useTheme } from 'tamagui'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { useTranslation } from '@mvp/i18n'
import { useAuthStore } from '@mvp/store'
import { AppButton, SettingsGroup } from '@mvp/ui'
import { api } from '../src/services/api'

export default function EditProfileScreen() {
  const { t } = useTranslation()
  const theme = useTheme()
  const insets = useSafeAreaInsets()
  const user = useAuthStore((s) => s.user)
  const setUser = useAuthStore((s) => s.setUser)

  const [name, setName] = useState(user?.name ?? '')
  const [bio, setBio] = useState(user?.bio ?? '')
  const [phone, setPhone] = useState(user?.phone ?? '')
  const [location, setLocation] = useState(user?.location ?? '')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    const trimmedName = name.trim()
    if (!trimmedName) return

    const payload: Record<string, string | null> = {}
    if (trimmedName !== user?.name) payload.name = trimmedName
    const trimmedBio = bio.trim()
    if (trimmedBio !== (user?.bio ?? '')) payload.bio = trimmedBio || null
    const trimmedPhone = phone.trim()
    if (trimmedPhone !== (user?.phone ?? '')) payload.phone = trimmedPhone || null
    const trimmedLocation = location.trim()
    if (trimmedLocation !== (user?.location ?? '')) payload.location = trimmedLocation || null

    if (Object.keys(payload).length === 0) {
      router.back()
      return
    }

    setSaving(true)
    try {
      const { data } = await api.patch('/users/profile', payload)
      if (data?.data && user) {
        setUser({ ...user, ...data.data })
      }
      router.back()
    } catch {
      Alert.alert(t('common.error'), t('common.retry'))
    } finally {
      setSaving(false)
    }
  }

  const inputStyle = {
    backgroundColor: '$subtleBackground' as const,
    borderWidth: 1,
    borderColor: '$borderColor' as const,
    borderRadius: '$3' as const,
    paddingHorizontal: '$3' as const,
    height: 44,
    fontSize: '$3' as const,
    color: '$color' as const,
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.background.val }}
      contentContainerStyle={{
        padding: 16,
        paddingBottom: 40,
        gap: 20,
      }}
    >
      <SettingsGroup>
        <YStack padding="$3" gap="$3">
          <YStack gap="$1.5">
            <Text fontWeight="600" color="$color" fontSize={14} paddingLeft="$1">{t('profile.name')}</Text>
            <Input value={name} onChangeText={setName} {...inputStyle} autoFocus />
          </YStack>

          <YStack gap="$1.5">
            <Text fontWeight="600" color="$color" fontSize={14} paddingLeft="$1">{t('profile.bio')}</Text>
            <Input
              value={bio}
              onChangeText={setBio}
              {...inputStyle}
              height={80}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              placeholder={t('profile.bioPlaceholder')}
              placeholderTextColor={theme.mutedText.val}
            />
          </YStack>

          <YStack gap="$1.5">
            <Text fontWeight="600" color="$color" fontSize={14} paddingLeft="$1">{t('profile.phone')}</Text>
            <Input value={phone} onChangeText={setPhone} {...inputStyle} keyboardType="phone-pad" />
          </YStack>

          <YStack gap="$1.5">
            <Text fontWeight="600" color="$color" fontSize={14} paddingLeft="$1">{t('profile.location')}</Text>
            <Input value={location} onChangeText={setLocation} {...inputStyle} />
          </YStack>

          <YStack gap="$1.5">
            <Text fontWeight="600" color="$color" fontSize={14} paddingLeft="$1">{t('profile.email')}</Text>
            <Text color="$mutedText" fontSize={15} paddingLeft="$1">{user?.email ?? '-'}</Text>
          </YStack>
        </YStack>
      </SettingsGroup>

      <AppButton onPress={handleSave} loading={saving}>
        {t('common.save')}
      </AppButton>
    </ScrollView>
  )
}
