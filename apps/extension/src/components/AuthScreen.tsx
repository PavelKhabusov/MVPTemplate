import { useState } from 'react'
import { Sparkles, Check } from 'lucide-react'
import type { LoginStep } from '../types'
import { login, register } from '../services/api'

interface AuthScreenProps {
  onAuth: () => void
  googleAuthEnabled?: boolean
}

export default function AuthScreen({ onAuth, googleAuthEnabled = false }: AuthScreenProps) {
  const [step, setStep] = useState<LoginStep>('welcome')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [isRegister, setIsRegister] = useState(false)

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Enter email and password')
      return
    }

    setLoading(true)
    setError(null)

    try {
      if (isRegister) {
        await register(email.trim(), password)
      } else {
        await login(email.trim(), password)
      }
      setStep('done')
      setTimeout(onAuth, 800)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error'
      if (msg.includes('Failed to fetch') || msg.includes('ERR_CONNECTION')) {
        setError('Server unavailable. Start the backend.')
      } else if (msg.includes('401') || msg.includes('Invalid')) {
        setError('Invalid email or password')
      } else if (msg.includes('409') || msg.includes('exists')) {
        setError('User already exists')
      } else if (msg.includes('400')) {
        setError('Check email and password (min. 6 characters)')
      } else {
        setError(msg)
      }
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
            <div className="text-[22px] font-semibold tracking-tight mb-2">MVP Extension</div>
            <div className="text-[13px] text-text-secondary leading-relaxed">
              Your app — right in
              <br />
              the browser
            </div>
          </div>
          <button
            onClick={() => setStep('form')}
            className="bg-gradient-to-br from-brand to-brand-dark text-white border-none rounded-xl py-3 px-8 text-sm font-medium cursor-pointer font-sans shadow-[0_4px_20px_rgba(99,102,241,0.4)] hover:scale-105 transition-transform"
          >
            Sign In / Register
          </button>
        </div>
      )}

      {step === 'form' && (
        <div className="flex flex-col gap-3.5 z-1 w-full max-w-[280px]">
          <div className="text-center mb-1">
            <div className="text-[17px] font-semibold">{isRegister ? 'Register' : 'Sign In'}</div>
            <div className="text-xs text-text-secondary mt-1">
              {isRegister ? 'Create your account' : 'or quick registration'}
            </div>
          </div>

          <input
            placeholder="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            className="bg-bg-secondary border border-bg-tertiary rounded-[10px] py-[11px] px-3.5 text-text-primary text-[13px] font-sans outline-none focus:border-brand transition-colors"
          />
          <input
            placeholder="Password"
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
            {loading ? 'Loading...' : isRegister ? 'Register' : 'Sign In'}
          </button>

          <button
            onClick={() => {
              setIsRegister(!isRegister)
              setError(null)
            }}
            className="bg-transparent border-none text-[12px] text-brand cursor-pointer font-sans"
          >
            {isRegister ? 'Already have an account? Sign In' : "No account? Register"}
          </button>

          {googleAuthEnabled && (
            <>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-px bg-bg-tertiary" />
                <span className="text-[11px] text-text-muted">or</span>
                <div className="flex-1 h-px bg-bg-tertiary" />
              </div>
              <button className="bg-bg-secondary text-text-primary border border-bg-tertiary rounded-[10px] py-[11px] text-[13px] cursor-pointer font-sans flex items-center justify-center gap-2">
                <span className="text-base">G</span> Sign in with Google
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
          <div className="text-[15px] font-medium text-success">Signing in...</div>
        </div>
      )}
    </div>
  )
}
