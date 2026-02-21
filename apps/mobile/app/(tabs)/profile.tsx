import { useEffect } from 'react'
import { router } from 'expo-router'
import { YStack } from 'tamagui'

export default function ProfileScreen() {
  useEffect(() => {
    router.replace('/(tabs)/settings')
  }, [])

  return <YStack flex={1} backgroundColor="$background" />
}
