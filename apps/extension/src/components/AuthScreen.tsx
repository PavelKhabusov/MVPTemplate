import { useState, useEffect } from 'react'
import { Sparkles, Check, Sun, Moon } from 'lucide-react'
import type { LoginStep, ThemeMode } from '../types'
import { login, register } from '../services/api'
import { APP_BRAND } from '@mvp/template-config/src/brand'
import { useTranslation } from '@mvp/i18n/src/browser'
import { i18n, SUPPORTED_LANGUAGES, type SupportedLanguage } from '@mvp/i18n/src/browser'

interface AuthScreenProps {
  onAuth: () => void
  googleAuthEnabled?: boolean
  theme: ThemeMode
  setTheme: (mode: ThemeMode) => void
}

export default function AuthScreen({ onAuth, googleAuthEnabled = false, theme, setTheme }: AuthScreenProps) {
  const { t } = useTranslation()
  const [step, setStep] = useState<LoginStep>('welcome')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [isRegister, setIsRegister] = useState(false)
  const [lang, setLangState] = useState<SupportedLanguage>('en')

  useEffect(() => {
    chrome.storage?.local?.get('lang').then((r) => {
      if (SUPPORTED_LANGUAGES.includes(r?.lang)) setLangState(r.lang)
    }).catch(() => {})
  }, [])

  const setLang = (l: SupportedLanguage) => {
    setLangState(l)
    i18n.changeLanguage(l)
    chrome.storage?.local?.set({ lang: l }).catch(() => {})
  }

  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) { setError(t('auth.enterEmailPassword')); return }
    setLoading(true)
    setError(null)
    try {
      if (isRegister) { await register(email.trim(), password) } else { await login(email.trim(), password) }
      setStep('done')
      setTimeout(onAuth, 800)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error'
      if (msg.includes('Failed to fetch') || msg.includes('ERR_CONNECTION')) setError(t('auth.errorServerDown'))
      else if (msg.includes('401') || msg.includes('Invalid')) setError(t('auth.errorInvalidCredentials'))
      else if (msg.includes('409') || msg.includes('exists')) setError(t('auth.errorEmailExists'))
      else if (msg.includes('400')) setError(t('auth.errorPasswordFormat'))
      else setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full h-screen bg-bg-primary text-text-primary flex flex-col items-center justify-center p-8 relative overflow-hidden">
      <div className="absolute -top-15 -left-15 w-55 h-55 rounded-full bg-[radial-gradient(circle,rgba(99,102,241,0.18)_0%,transparent_70%)] pointer-events-none" />
      <div className="absolute -bottom-10 -right-10 w-45 h-45 rounded-full bg-[radial-gradient(circle,rgba(139,92,246,0.12)_0%,transparent_70%)] pointer-events-none" />

      {step === 'welcome' && (
        <div className="flex flex-col items-center gap-6 z-1">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand to-brand-dark flex items-center justify-center shadow-[0_8px_32px_rgba(99,102,241,0.35)]">
            <Sparkles size={26} className="text-white" />
          </div>
          <div className="text-center">
            <div className="text-[22px] font-semibold tracking-tight mb-2">{APP_BRAND.name}</div>
            <div className="text-[13px] text-text-secondary leading-relaxed">{APP_BRAND.tagline}</div>
          </div>
          <button
            onClick={() => setStep('form')}
            className="bg-gradient-to-br from-brand to-brand-dark text-white border-none rounded-xl py-3 px-8 text-sm font-medium cursor-pointer font-sans shadow-[0_4px_20px_rgba(99,102,241,0.4)] hover:scale-105 transition-transform"
          >
            {t('auth.signInOrRegister')}
          </button>
        </div>
      )}

      {step === 'form' && (
        <div className="flex flex-col gap-3.5 z-1 w-full max-w-[280px]">
          <div className="text-center mb-1">
            <div className="text-[17px] font-semibold">{isRegister ? t('auth.signUp') : t('auth.signIn')}</div>
            <div className="text-xs text-text-secondary mt-1">
              {isRegister ? t('auth.createAccount') : t('auth.orQuickReg')}
            </div>
          </div>

          <input
            placeholder={t('auth.email')}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            className="bg-bg-secondary border border-bg-tertiary rounded-[10px] py-[11px] px-3.5 text-text-primary text-[13px] font-sans outline-none focus:border-brand transition-colors"
          />
          <input
            placeholder={t('auth.password')}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            className="bg-bg-secondary border border-bg-tertiary rounded-[10px] py-[11px] px-3.5 text-text-primary text-[13px] font-sans outline-none focus:border-brand transition-colors"
          />

          {error && (
            <div className="text-[12px] text-error bg-error/10 rounded-lg py-2 px-3 text-center">
              {error}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="bg-gradient-to-br from-brand to-brand-dark text-white border-none rounded-[10px] py-3 text-sm font-medium cursor-pointer font-sans mt-1 disabled:opacity-50"
          >
            {loading ? t('common.loading') : isRegister ? t('auth.signUp') : t('auth.signIn')}
          </button>

          <button
            onClick={() => { setIsRegister(!isRegister); setError(null) }}
            className="bg-transparent border-none text-[12px] text-brand cursor-pointer font-sans"
          >
            {isRegister ? t('auth.alreadyHaveAccount') : t('auth.noAccountRegister')}
          </button>

          {googleAuthEnabled && (
            <>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-px bg-bg-tertiary" />
                <span className="text-[11px] text-text-muted">{t('auth.or')}</span>
                <div className="flex-1 h-px bg-bg-tertiary" />
              </div>
              <button className="bg-bg-secondary text-text-primary border border-bg-tertiary rounded-[10px] py-[11px] text-[13px] cursor-pointer font-sans flex items-center justify-center gap-2">
                <span className="text-base">G</span> {t('auth.continueWithGoogle')}
              </button>
            </>
          )}
        </div>
      )}

      {step === 'done' && (
        <div className="flex flex-col items-center gap-4 z-1">
          <div className="w-[52px] h-[52px] rounded-full bg-success/15 flex items-center justify-center">
            <Check size={24} className="text-success" />
          </div>
          <div className="text-[15px] font-medium text-success">{t('auth.signingIn')}</div>
        </div>
      )}

      {/* Bottom controls: lang + theme */}
      <div className="absolute bottom-3 left-0 right-0 flex items-center justify-between px-4 z-10">
        <div className="flex gap-0.5">
          {SUPPORTED_LANGUAGES.map((l) => (
            <button
              key={l}
              onClick={() => setLang(l)}
              className={`bg-transparent border-none text-[10px] cursor-pointer font-sans px-1.5 py-1 rounded uppercase tracking-wide transition-colors ${
                lang === l ? 'text-brand font-semibold' : 'text-text-muted hover:text-text-secondary'
              }`}
            >
              {l}
            </button>
          ))}
        </div>
        <button
          onClick={() => setTheme(isDark ? 'light' : 'dark')}
          className="bg-transparent border-none cursor-pointer text-text-muted hover:text-text-secondary transition-colors p-1"
        >
          {isDark ? <Sun size={13} /> : <Moon size={13} />}
        </button>
      </div>
    </div>
  )
}
