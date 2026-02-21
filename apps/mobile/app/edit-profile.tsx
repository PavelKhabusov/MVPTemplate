import { useState, useCallback, useLayoutEffect } from 'react'
import { Alert, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native'
import { YStack, XStack, Text, Input, useTheme } from 'tamagui'
import { router, useNavigation } from 'expo-router'
import { useTranslation } from '@mvp/i18n'
import { useAuthStore, useThemeStore } from '@mvp/store'
import { AppAvatar, SettingsGroup, SettingsGroupItem, ScalePress, PhoneInput, LocationInput } from '@mvp/ui'
import * as ImagePicker from 'expo-image-picker'
import { api, getAccessToken } from '../src/services/api'
import { useLocationSearch } from '../src/hooks/useLocationSearch'
import { authApi } from '../src/features/auth/auth.service'

let DateTimePicker: any = null
if (Platform.OS !== 'web') {
  DateTimePicker = require('@react-native-community/datetimepicker').default
}

export default function EditProfileScreen() {
  const { t } = useTranslation()
  const theme = useTheme()
  const navigation = useNavigation()
  const user = useAuthStore((s) => s.user)
  const setUser = useAuthStore((s) => s.setUser)
  const resolvedTheme = useThemeStore((s) => s.resolvedTheme)

  const [name, setName] = useState(user?.name ?? '')
  const [bio, setBio] = useState(user?.bio ?? '')
  const [phone, setPhone] = useState(user?.phone ?? '')
  const [location, setLocation] = useState(user?.location ?? '')
  const [locationQuery, setLocationQuery] = useState(user?.location ?? '')
  const [birthday, setBirthday] = useState<Date | null>(
    user?.birthday ? new Date(user.birthday) : null,
  )
  const [avatarUri, setAvatarUri] = useState(user?.avatarUrl ?? null)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)

  const { results: locationResults, isLoading: locationLoading } = useLocationSearch(locationQuery)

  const formatDate = (date: Date) =>
    date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })

  const handlePickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    })

    if (result.canceled || !result.assets[0]) return

    const asset = result.assets[0]
    setAvatarUri(asset.uri)
    setUploadingPhoto(true)
    try {
      const formData = new FormData()

      if (Platform.OS === 'web') {
        const response = await fetch(asset.uri)
        const blob = await response.blob()
        const ext = asset.mimeType === 'image/png' ? 'png' : asset.mimeType === 'image/webp' ? 'webp' : 'jpg'
        formData.append('file', new File([blob], `avatar.${ext}`, { type: asset.mimeType ?? 'image/jpeg' }))
      } else {
        const ext = asset.uri.split('.').pop() ?? 'jpg'
        formData.append('file', {
          uri: asset.uri,
          name: `avatar.${ext}`,
          type: asset.mimeType ?? `image/${ext}`,
        } as any)
      }

      const apiUrl = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000'
      const token = getAccessToken()
      console.log('Uploading avatar to', `${apiUrl}/api/users/avatar`, 'token:', !!token)
      const uploadRes = await fetch(`${apiUrl}/api/users/avatar`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      })
      if (!uploadRes.ok) {
        const errBody = await uploadRes.text()
        console.error('Avatar upload failed:', uploadRes.status, errBody)
        throw new Error(errBody)
      }
      const { data: profile } = await uploadRes.json()
      if (profile) {
        setAvatarUri(profile.avatarUrl)
        if (user) setUser({ ...user, avatarUrl: profile.avatarUrl })
      }
    } catch (err) {
      console.error('Avatar upload error:', err)
      setAvatarUri(user?.avatarUrl ?? null)
      Alert.alert(t('common.error'), t('common.retry'))
    } finally {
      setUploadingPhoto(false)
    }
  }

  const goBack = useCallback(() => {
    if (Platform.OS === 'web') {
      router.replace('/profile')
    } else {
      router.back()
    }
  }, [])

  const handleSave = useCallback(async () => {
    const trimmedName = name.trim()
    if (!trimmedName) return

    const payload: Record<string, string | null> = {}
    if (trimmedName !== user?.name) payload.name = trimmedName
    const trimmedBio = bio.trim()
    if (trimmedBio !== (user?.bio ?? '')) payload.bio = trimmedBio || null
    if (phone !== (user?.phone ?? '')) payload.phone = phone || null
    const trimmedLocation = location.trim()
    if (trimmedLocation !== (user?.location ?? '')) payload.location = trimmedLocation || null
    const birthdayStr = birthday ? birthday.toISOString().split('T')[0] : null
    if (birthdayStr !== (user?.birthday ?? null)) payload.birthday = birthdayStr

    if (Object.keys(payload).length === 0) {
      goBack()
      return
    }

    setSaving(true)
    try {
      const { data } = await api.patch('/users/profile', payload)
      if (data?.data && user) {
        setUser({ ...user, ...data.data })
      }
      goBack()
    } catch {
      Alert.alert(t('common.error'), t('common.retry'))
    } finally {
      setSaving(false)
    }
  }, [name, bio, phone, location, birthday, user, setUser, t, goBack])

  const handleSignOut = async () => {
    await authApi.logout()
    router.replace('/')
  }

  // Native header buttons
  useLayoutEffect(() => {
    if (Platform.OS === 'web') return
    navigation.setOptions({
      headerLeft: () => (
        <TouchableOpacity onPress={goBack} activeOpacity={0.7} style={{ paddingHorizontal: 8 }}>
          <Text fontSize={17} color="$accent">{t('common.cancel')}</Text>
        </TouchableOpacity>
      ),
      headerRight: () =>
        saving ? (
          <ActivityIndicator size="small" color={theme.accent.val} style={{ paddingHorizontal: 8 }} />
        ) : (
          <TouchableOpacity onPress={handleSave} activeOpacity={0.7} style={{ paddingHorizontal: 8 }}>
            <Text fontSize={17} fontWeight="600" color="$accent">{t('common.done')}</Text>
          </TouchableOpacity>
        ),
    })
  }, [navigation, handleSave, goBack, saving, t, theme])

  const inputStyle = {
    backgroundColor: 'transparent' as const,
    borderWidth: 0,
    height: 44,
    fontSize: 17 as const,
    color: '$color' as const,
    paddingHorizontal: 0 as const,
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
          paddingBottom: 60,
          gap: 20,
        }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Web header with Cancel / Done */}
        {Platform.OS === 'web' && (
          <XStack
            justifyContent="space-between"
            alignItems="center"
            paddingHorizontal="$4"
            paddingVertical="$3"
          >
            <ScalePress onPress={goBack}>
              <Text fontSize={17} color="$accent">{t('common.cancel')}</Text>
            </ScalePress>
            {saving ? (
              <ActivityIndicator size="small" color={theme.accent.val} />
            ) : (
              <ScalePress onPress={handleSave}>
                <Text fontSize={17} fontWeight="600" color="$accent">{t('common.done')}</Text>
              </ScalePress>
            )}
          </XStack>
        )}

        {/* Avatar */}
        <YStack alignItems="center" paddingVertical="$4" gap="$2">
          <TouchableOpacity onPress={handlePickPhoto} activeOpacity={0.7} disabled={uploadingPhoto}>
            <YStack>
              <AppAvatar uri={avatarUri} name={user?.name} size={100} />
              {uploadingPhoto && (
                <YStack
                  position="absolute"
                  top={0}
                  left={0}
                  right={0}
                  bottom={0}
                  borderRadius={50}
                  backgroundColor="rgba(0,0,0,0.4)"
                  alignItems="center"
                  justifyContent="center"
                >
                  <ActivityIndicator color="white" />
                </YStack>
              )}
            </YStack>
          </TouchableOpacity>
          <TouchableOpacity onPress={handlePickPhoto} activeOpacity={0.7} disabled={uploadingPhoto}>
            <Text fontSize={16} color="$accent">{t('profile.setNewPhoto')}</Text>
          </TouchableOpacity>
        </YStack>

        {/* Name & Bio */}
        <YStack paddingHorizontal={16}>
          <SettingsGroup>
            <YStack paddingHorizontal="$3">
              <Input
                value={name}
                onChangeText={setName}
                placeholder={t('profile.name')}
                placeholderTextColor={theme.mutedText.val}
                {...inputStyle}
              />
              <YStack height={0.5} backgroundColor="$borderColor" marginLeft={0} />
              <Input
                value={bio}
                onChangeText={setBio}
                placeholder={t('profile.bio')}
                placeholderTextColor={theme.mutedText.val}
                {...inputStyle}
                height={80}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </YStack>
          </SettingsGroup>
        </YStack>

        {/* Birthday */}
        <YStack paddingHorizontal={16}>
          <SettingsGroup>
            <SettingsGroupItem
              icon="calendar-outline"
              label={t('profile.birthday')}
              value={birthday ? formatDate(birthday) : undefined}
              onPress={() => {
                if (Platform.OS === 'web') {
                  // Fallback: prompt for date string on web
                  const input = window.prompt('Birthday (YYYY-MM-DD)', birthday ? birthday.toISOString().split('T')[0] : '')
                  if (input) {
                    const d = new Date(input)
                    if (!isNaN(d.getTime())) setBirthday(d)
                  }
                } else {
                  setShowDatePicker(!showDatePicker)
                }
              }}
            />
          </SettingsGroup>
          {showDatePicker && DateTimePicker && Platform.OS !== 'web' && (
            <DateTimePicker
              value={birthday ?? new Date(2000, 0, 1)}
              mode="date"
              display="spinner"
              maximumDate={new Date()}
              onChange={(_event: any, date: Date | undefined) => {
                if (Platform.OS === 'android') setShowDatePicker(false)
                if (date) setBirthday(date)
              }}
              themeVariant={resolvedTheme}
            />
          )}
        </YStack>

        {/* Phone & Location */}
        <YStack paddingHorizontal={16} gap="$3">
          <SettingsGroup>
            <YStack padding="$3" gap="$3">
              <YStack gap="$1">
                <Text fontSize={13} color="$mutedText" paddingLeft="$0.5">{t('profile.phone')}</Text>
                <PhoneInput value={phone} onChangePhone={setPhone} />
              </YStack>
              <YStack height={0.5} backgroundColor="$borderColor" />
              <YStack gap="$1">
                <Text fontSize={13} color="$mutedText" paddingLeft="$0.5">{t('profile.location')}</Text>
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
            </YStack>
          </SettingsGroup>
        </YStack>

        {/* Sign Out */}
        <YStack paddingHorizontal={16}>
          <SettingsGroup>
            <SettingsGroupItem
              icon="log-out-outline"
              label={t('settings.signOut')}
              onPress={handleSignOut}
              danger
            />
          </SettingsGroup>
        </YStack>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
