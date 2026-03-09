import { useState, useEffect, useCallback } from 'react'
import AuthScreen from '../components/AuthScreen'
import OnboardingScreen from '../components/OnboardingScreen'
import MainScreen from '../components/MainScreen'
import { useTheme } from '../hooks/useTheme'
import { useSubscription } from '../hooks/useSubscription'
import { logout, fetchFlags, getMe, type AppFlags } from '../services/api'

const DEFAULT_FLAGS: AppFlags = { googleAuth: false, payments: false, email: false }

export default function App() {
  const [authed, setAuthed] = useState(false)
  const [authChecked, setAuthChecked] = useState(false)
  const [onboardingDone, setOnboardingDone] = useState(true)
  const [flags, setFlags] = useState<AppFlags>(DEFAULT_FLAGS)
  const [user, setUser] = useState<{ email: string; name: string } | null>(null)
  const { theme, setTheme } = useTheme()
  const { subscription, loading: subLoading } = useSubscription(authed && authChecked)

  useEffect(() => {
    fetchFlags().then(setFlags).catch(() => {})

    chrome.storage?.local
      ?.get(['accessToken', 'onboardingDone'])
      .then(async (result) => {
        if (result?.accessToken) {
          // Validate token — if expired/invalid, clear it and show login
          const u = await getMe().catch(() => null)
          if (u) {
            setAuthed(true)
            setUser(u)
          } else {
            chrome.storage?.local?.remove(['accessToken', 'refreshToken']).catch(() => {})
          }
        }
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
    setUser(null)
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
