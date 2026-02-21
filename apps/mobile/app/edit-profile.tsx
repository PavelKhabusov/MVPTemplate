import { useState } from 'react'
import { Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native'
import { YStack, Text, Input, useTheme } from 'tamagui'
import { router } from 'expo-router'
import { useTranslation } from '@mvp/i18n'
import { useAuthStore } from '@mvp/store'
import { AppButton, SettingsGroup, PhoneInput, LocationInput } from '@mvp/ui'
import { api } from '../src/services/api'
import { useLocationSearch } from '../src/hooks/useLocationSearch'

export default function EditProfileScreen() {
  const { t } = useTranslation()
  const theme = useTheme()
  const user = useAuthStore((s) => s.user)
  const setUser = useAuthStore((s) => s.setUser)

  const [name, setName] = useState(user?.name ?? '')
  const [bio, setBio] = useState(user?.bio ?? '')
  const [phone, setPhone] = useState(user?.phone ?? '')
  const [location, setLocation] = useState(user?.location ?? '')
  const [locationQuery, setLocationQuery] = useState(user?.location ?? '')
  const [saving, setSaving] = useState(false)

  const { results: locationResults, isLoading: locationLoading } = useLocationSearch(locationQuery)

  const handleSave = async () => {
    const trimmedName = name.trim()
    if (!trimmedName) return

    const payload: Record<string, string | null> = {}
    if (trimmedName !== user?.name) payload.name = trimmedName
    const trimmedBio = bio.trim()
    if (trimmedBio !== (user?.bio ?? '')) payload.bio = trimmedBio || null
    if (phone !== (user?.phone ?? '')) payload.phone = phone || null
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
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <ScrollView
        style={{ flex: 1, backgroundColor: theme.background.val }}
        contentContainerStyle={{
          padding: 16,
          paddingBottom: 60,
          gap: 20,
        }}
        keyboardShouldPersistTaps="handled"
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
            <PhoneInput
              value={phone}
              onChangePhone={setPhone}
            />
          </YStack>

          <YStack gap="$1.5">
            <Text fontWeight="600" color="$color" fontSize={14} paddingLeft="$1">{t('profile.location')}</Text>
            <LocationInput
              value={locationQuery}
              onChangeText={(text) => {
                setLocationQuery(text)
                setLocation(text)
              }}
              onSelectLocation={(loc) => {
                setLocationQuery(loc)
                setLocation(loc)
              }}
              suggestions={locationResults}
              isLoading={locationLoading}
            />
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
    </KeyboardAvoidingView>
  )
}
