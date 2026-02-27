import { useEffect } from 'react'
import { Platform } from 'react-native'
import { router } from 'expo-router'
import { LandingPage } from '@mvp/ui'
import { useTemplateFlag } from '@mvp/template-config'

export default function LandingScreen() {
  const paymentsEnabled = useTemplateFlag('payments', false)

  // Landing is web-only — redirect native to home
  useEffect(() => {
    if (Platform.OS !== 'web') {
      router.replace('/')
    }
  }, [])

  if (Platform.OS !== 'web') return null

  return <LandingPage logo={require('../assets/icon.png')} paymentsEnabled={paymentsEnabled} />
}
