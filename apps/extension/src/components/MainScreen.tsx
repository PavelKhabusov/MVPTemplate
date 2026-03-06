import { useState, useEffect, Suspense } from 'react'
import { Sparkles, Home, Settings } from 'lucide-react'
import type { Tab, Subscription, ThemeMode } from '../types'
import { extensionConfig } from '../config'
import { getMe } from '../services/api'
import { APP_BRAND } from '@mvp/template-config/src/brand'
import HomeTab from './HomeTab'
import SettingsTab from './SettingsTab'

type Lang = 'en' | 'ru' | 'es' | 'ja'

interface MainScreenProps {
  subscription: Subscription | null
  subscriptionLoading: boolean
  theme: ThemeMode
  setTheme: (mode: ThemeMode) => void
  onLogout: () => void
  paymentsEnabled?: boolean
}

const builtinLabels: Record<string, Partial<Record<Lang, string>>> = {
  home: { en: 'Home', ru: 'Главная', es: 'Inicio', ja: 'ホーム' },
  settings: { en: 'Settings', ru: 'Настройки', es: 'Ajustes', ja: '設定' },
}

export default function MainScreen({
  subscription,
  subscriptionLoading,
  theme,
  setTheme,
  onLogout,
  paymentsEnabled = false,
}: MainScreenProps) {
  const hasCustomTabs = extensionConfig.tabs.length > 0
  const defaultTab = hasCustomTabs ? extensionConfig.tabs[0].id : 'home'
  const [tab, setTab] = useState<Tab>(defaultTab)
  const [lang, setLang] = useState<Lang>('en')
  const [user, setUser] = useState<{ email: string; name: string } | null>(null)

  const isActive = subscription?.status === 'active'

  useEffect(() => {
    chrome.storage?.local?.get('lang').then((r) => {
      if (['en', 'ru', 'es', 'ja'].includes(r?.lang)) setLang(r.lang)
    }).catch(() => {})
    getMe().then(setUser).catch(() => {})
  }, [])

  // Auto-switch to Call tab when Google Sheets is detected
  useEffect(() => {
    if (!hasCustomTabs) return
    const callTabId = extensionConfig.tabs[0]?.id
    if (!callTabId) return

    // Check initial state: sidebar may open while already on a Sheets tab
    chrome.runtime?.sendMessage?.({ type: 'GET_CURRENT_SHEET' }, (res) => {
      if (chrome.runtime.lastError) return
      if (res?.spreadsheetId) setTab(callTabId)
    })

    const listener = (message: any) => {
      if (message.type === 'TAB_CONTEXT_CHANGED') {
        if (message.payload?.isGoogleSheets) setTab(callTabId)
      }
    }
    chrome.runtime?.onMessage?.addListener(listener)
    return () => chrome.runtime?.onMessage?.removeListener(listener)
  }, [hasCustomTabs])

  const handleSetLang = (l: Lang) => {
    setLang(l)
    chrome.storage?.local?.set({ lang: l }).catch(() => {})
  }

  // Build tab list: custom tabs (if any) or Home, then Settings
  const tabs = hasCustomTabs
    ? [
        ...extensionConfig.tabs.map((t) => ({
          id: t.id,
          label: t.label[lang] || t.label.en || t.id,
          icon: t.icon,
        })),
        { id: 'settings', label: builtinLabels.settings[lang] || 'Settings', icon: Settings },
      ]
    : [
        { id: 'home', label: builtinLabels.home[lang] || 'Home', icon: Home },
        { id: 'settings', label: builtinLabels.settings[lang] || 'Settings', icon: Settings },
      ]

  return (
    <div className="w-full h-screen bg-bg-primary text-text-primary flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-4 pt-3.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-brand to-brand-dark flex items-center justify-center">
            <Sparkles size={14} className="text-white" />
          </div>
          <span className="text-sm font-semibold tracking-tight">{APP_BRAND.name}</span>
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
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[12px] cursor-pointer font-sans bg-transparent border-none border-b-2 transition ${
              tab === id
                ? 'border-brand text-brand'
                : 'border-transparent text-text-secondary'
            }`}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      <Suspense fallback={<div className="flex-1 flex items-center justify-center"><div className="w-5 h-5 border-2 border-brand border-t-transparent rounded-full animate-spin" /></div>}>
        {tab === 'home' && !hasCustomTabs && (
          <HomeTab
            subscription={subscription}
            subscriptionLoading={subscriptionLoading}
            paymentsEnabled={paymentsEnabled}
          />
        )}

        {tab === 'settings' && (
          <SettingsTab
            theme={theme}
            setTheme={setTheme}
            lang={lang}
            setLang={handleSetLang}
            user={user}
            onLogout={onLogout}
          />
        )}

        {/* Custom tabs */}
        {extensionConfig.tabs.map((customTab) =>
          tab === customTab.id ? (
            <customTab.component key={customTab.id} lang={lang} />
          ) : null
        )}
      </Suspense>
    </div>
  )
}
