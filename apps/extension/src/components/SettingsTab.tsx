import { Suspense } from 'react'
import { Sun, Moon, Monitor, LogOut, Globe, ExternalLink } from 'lucide-react'
import type { ThemeMode } from '../types'
import { extensionConfig } from '../config'

type Lang = 'en' | 'ru' | 'es' | 'ja'

interface UserInfo {
  email: string
  name: string
}

interface SettingsTabProps {
  theme: ThemeMode
  setTheme: (mode: ThemeMode) => void
  lang: Lang
  setLang: (lang: Lang) => void
  user: UserInfo | null
  onLogout: () => void
}

const THEME_OPTIONS: { value: ThemeMode; label: Partial<Record<Lang, string>>; icon: typeof Sun }[] = [
  { value: 'system', label: { en: 'System', ru: 'Система', es: 'Sistema', ja: 'システム' }, icon: Monitor },
  { value: 'light', label: { en: 'Light', ru: 'Светлая', es: 'Claro', ja: 'ライト' }, icon: Sun },
  { value: 'dark', label: { en: 'Dark', ru: 'Тёмная', es: 'Oscuro', ja: 'ダーク' }, icon: Moon },
]

const LANG_OPTIONS: { value: Lang; label: string }[] = [
  { value: 'en', label: 'EN' },
  { value: 'ru', label: 'RU' },
  { value: 'es', label: 'ES' },
  { value: 'ja', label: 'JA' },
]

const labels: Record<string, Partial<Record<Lang, string>>> = {
  theme: { en: 'Theme', ru: 'Тема', es: 'Tema', ja: 'テーマ' },
  language: { en: 'Language', ru: 'Язык', es: 'Idioma', ja: '言語' },
  openApp: { en: 'Open in app', ru: 'Открыть в приложении', es: 'Abrir en app', ja: 'アプリで開く' },
  signOut: { en: 'Sign Out', ru: 'Выход', es: 'Cerrar sesión', ja: 'ログアウト' },
}

export default function SettingsTab({ theme, setTheme, lang, setLang, user, onLogout }: SettingsTabProps) {
  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
      {/* User badge */}
      {user && (
        <div className="bg-bg-secondary border border-bg-tertiary rounded-xl p-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-brand/15 flex items-center justify-center text-brand text-[13px] font-semibold shrink-0">
            {user.name?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-medium truncate">{user.name || user.email}</div>
            <div className="text-[11px] text-text-muted truncate">{user.email}</div>
          </div>
          <a
            href="http://localhost:8081"
            target="_blank"
            rel="noopener noreferrer"
            className="text-text-muted hover:text-brand transition"
            title={labels.openApp[lang] || labels.openApp.en}
          >
            <ExternalLink size={14} />
          </a>
        </div>
      )}

      {/* Theme */}
      <div className="bg-bg-secondary border border-bg-tertiary rounded-xl p-4">
        <div className="text-[13px] font-medium mb-3">{labels.theme[lang] || labels.theme.en}</div>
        <div className="flex gap-2">
          {THEME_OPTIONS.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              onClick={() => setTheme(value)}
              className={`flex-1 flex flex-col items-center gap-1.5 py-2.5 rounded-lg text-[11px] cursor-pointer font-sans border transition ${
                theme === value
                  ? 'bg-brand/10 border-brand/30 text-brand'
                  : 'bg-transparent border-transparent text-text-secondary hover:bg-bg-tertiary/50'
              }`}
            >
              <Icon size={16} />
              {label[lang] || label.en}
            </button>
          ))}
        </div>
      </div>

      {/* Language */}
      <div className="bg-bg-secondary border border-bg-tertiary rounded-xl p-4">
        <div className="text-[13px] font-medium mb-3 flex items-center gap-2">
          <Globe size={14} />
          {labels.language[lang] || labels.language.en}
        </div>
        <div className="flex gap-2">
          {LANG_OPTIONS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setLang(value)}
              className={`flex-1 py-2 rounded-lg text-[12px] cursor-pointer font-sans border transition font-medium ${
                lang === value
                  ? 'bg-brand/10 border-brand/30 text-brand'
                  : 'bg-transparent border-transparent text-text-secondary hover:bg-bg-tertiary/50'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Custom settings sections from config */}
      {extensionConfig.settingsSections.length > 0 && (
        <Suspense fallback={<div className="bg-bg-secondary border border-bg-tertiary rounded-xl p-4 animate-pulse h-20" />}>
          {extensionConfig.settingsSections.map((Section, i) => (
            <Section key={i} lang={lang} />
          ))}
        </Suspense>
      )}

      {/* Logout */}
      <button
        onClick={onLogout}
        className="flex items-center justify-center gap-2 bg-bg-secondary border border-bg-tertiary text-error rounded-xl py-2.5 text-[12px] cursor-pointer font-sans hover:bg-error/5 transition"
      >
        <LogOut size={13} />
        {labels.signOut[lang] || labels.signOut.en}
      </button>
    </div>
  )
}
