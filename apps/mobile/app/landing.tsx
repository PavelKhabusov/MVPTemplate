import { useEffect } from 'react'
import { Platform } from 'react-native'
import { router } from 'expo-router'
import { LandingPage } from '@mvp/ui'

export default function LandingScreen() {
  // Landing is web-only — redirect native to home
  useEffect(() => {
    if (Platform.OS !== 'web') {
      router.replace('/')
    }
  }, [])

  if (Platform.OS !== 'web') return null

  return <LandingPage />
}
