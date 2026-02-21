import { useEffect } from 'react'
import { router } from 'expo-router'

export default function SettingsScreen() {
  useEffect(() => {
    router.replace('/(tabs)/profile')
  }, [])

  return null
}
