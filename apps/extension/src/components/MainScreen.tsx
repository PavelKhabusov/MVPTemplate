import { useState } from 'react'
import { Sparkles, Home, Settings } from 'lucide-react'
import type { Tab, Subscription, ThemeMode } from '../types'
import HomeTab from './HomeTab'
import SettingsTab from './SettingsTab'

interface MainScreenProps {
  subscription: Subscription | null
  subscriptionLoading: boolean
  theme: ThemeMode
  setTheme: (mode: ThemeMode) => void
  onLogout: () => void
  paymentsEnabled?: boolean
}

export default function MainScreen({
  subscription,
  subscriptionLoading,
  theme,
  setTheme,
  onLogout,
  paymentsEnabled = false,
}: MainScreenProps) {
  const [tab, setTab] = useState<Tab>('home')

  const isActive = subscription?.status === 'active'

  return (
    <div className="w-full h-screen bg-bg-primary text-text-primary flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-4 pt-3.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-brand to-brand-dark flex items-center justify-center">
            <Sparkles size={14} className="text-white" />
          </div>
          <span className="text-sm font-semibold tracking-tight">MVP Extension</span>
        </div>
        {paymentsEnabled && subscription && (
          <span
            className={`text-[10px] px-2 py-0.5 rounded-full ${
              isActive ? 'bg-success/15 text-success' : 'bg-bg-tertiary text-text-muted'
            }`}
          >
            {isActive ? subscription.planName : 'Free'}
          </span>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-bg-tertiary mx-4 mt-2">
        <button
          onClick={() => setTab('home')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[12px] cursor-pointer font-sans bg-transparent border-none border-b-2 transition ${
            tab === 'home'
              ? 'border-brand text-brand'
              : 'border-transparent text-text-secondary'
          }`}
        >
          <Home size={14} />
          Home
        </button>
        <button
          onClick={() => setTab('settings')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[12px] cursor-pointer font-sans bg-transparent border-none border-b-2 transition ${
            tab === 'settings'
              ? 'border-brand text-brand'
              : 'border-transparent text-text-secondary'
          }`}
        >
          <Settings size={14} />
          Settings
        </button>
      </div>

      {/* Content */}
      {tab === 'home' && (
        <HomeTab
          subscription={subscription}
          subscriptionLoading={subscriptionLoading}
          paymentsEnabled={paymentsEnabled}
        />
      )}
      {tab === 'settings' && (
        <SettingsTab theme={theme} setTheme={setTheme} onLogout={onLogout} />
      )}
    </div>
  )
}
