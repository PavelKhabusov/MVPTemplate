import { Sun, Moon, Monitor, LogOut } from 'lucide-react'
import type { ThemeMode } from '../types'

interface SettingsTabProps {
  theme: ThemeMode
  setTheme: (mode: ThemeMode) => void
  onLogout: () => void
}

const THEME_OPTIONS: { value: ThemeMode; label: string; icon: typeof Sun }[] = [
  { value: 'system', label: 'System', icon: Monitor },
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
]

export default function SettingsTab({ theme, setTheme, onLogout }: SettingsTabProps) {
  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4">
      {/* Theme */}
      <div className="bg-bg-secondary border border-bg-tertiary rounded-xl p-4">
        <div className="text-[13px] font-medium mb-3">Theme</div>
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
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Logout */}
      <button
        onClick={onLogout}
        className="flex items-center justify-center gap-2 bg-bg-secondary border border-bg-tertiary text-error rounded-xl py-2.5 text-[12px] cursor-pointer font-sans hover:bg-error/5 transition"
      >
        <LogOut size={13} />
        Sign Out
      </button>
    </div>
  )
}
