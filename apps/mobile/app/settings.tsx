import { useEffect } from 'react'
import { Platform } from 'react-native'
import { YStack } from 'tamagui'
import { router } from 'expo-router'
import { SettingsContent } from '../src/features/settings/SettingsScreen'

export default function SettingsScreen() {
  useEffect(() => {
    if (Platform.OS !== 'web') {
      router.replace('/(tabs)/profile')
    }
  }, [])

  if (Platform.OS !== 'web') return null

  return (
    <YStack flex={1} backgroundColor="$background">
      <SettingsContent />
    </YStack>
  )
}
