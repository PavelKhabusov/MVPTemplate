import { useState, useEffect, useCallback } from 'react'
import AuthScreen from '../components/AuthScreen'
import OnboardingScreen from '../components/OnboardingScreen'
import MainScreen from '../components/MainScreen'
import { useTheme } from '../hooks/useTheme'
import { useSubscription } from '../hooks/useSubscription'
import { logout, fetchFlags, type AppFlags } from '../services/api'

const DEFAULT_FLAGS: AppFlags = { googleAuth: false, payments: false, email: false }

export default function App() {
  const [authed, setAuthed] = useState(false)
  const [authChecked, setAuthChecked] = useState(false)
  const [onboardingDone, setOnboardingDone] = useState(true)
  const [flags, setFlags] = useState<AppFlags>(DEFAULT_FLAGS)
  const { theme, setTheme } = useTheme()
  const { subscription, loading: subLoading } = useSubscription()

  useEffect(() => {
    // Fetch backend config flags
    fetchFlags().then(setFlags).catch(() => {})

    chrome.storage?.local
      ?.get(['accessToken', 'onboardingDone'])
      .then((result) => {
        if (result?.accessToken) setAuthed(true)
        if (result?.onboardingDone) setOnboardingDone(true)
        else setOnboardingDone(false)
        setAuthChecked(true)
      })
      .catch(() => {
        setAuthChecked(true)
      })
  }, [])

  const handleOnboardingComplete = useCallback(() => {
    setOnboardingDone(true)
    chrome.storage?.local?.set({ onboardingDone: true }).catch(() => {})
  }, [])

  const handleLogout = useCallback(async () => {
    await logout()
    setAuthed(false)
  }, [])

  if (!authChecked) {
    return (
      <div className="w-full h-screen bg-bg-primary flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-brand border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!authed) {
    return <AuthScreen onAuth={() => setAuthed(true)} googleAuthEnabled={flags.googleAuth} theme={theme} setTheme={setTheme} />
  }

  if (!onboardingDone) {
    return <OnboardingScreen onComplete={handleOnboardingComplete} />
  }

  return (
    <MainScreen
      subscription={subscription}
      subscriptionLoading={subLoading}
      theme={theme}
      setTheme={setTheme}
      onLogout={handleLogout}
      paymentsEnabled={flags.payments}
    />
  )
}
