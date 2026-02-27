import { useEffect, useState } from 'react'
import { Platform } from 'react-native'
import { router } from 'expo-router'
import { LandingPage } from '@mvp/ui'
import { useTemplateFlag } from '@mvp/template-config'
import { api } from '../src/services/api'

export default function LandingScreen() {
  const paymentsEnabled = useTemplateFlag('payments', false)
  const [plans, setPlans] = useState<any[]>([])

  // Landing is web-only — redirect native to home
  useEffect(() => {
    if (Platform.OS !== 'web') {
      router.replace('/')
    }
  }, [])

  // Fetch public plans when payments enabled
  useEffect(() => {
    if (!paymentsEnabled || Platform.OS !== 'web') return
    api.get('/payments/plans').then((res) => {
      setPlans(res.data?.data ?? [])
    }).catch(() => {})
  }, [paymentsEnabled])

  if (Platform.OS !== 'web') return null

  return <LandingPage logo={require('../assets/icon.png')} paymentsEnabled={paymentsEnabled} plans={plans} />
}
