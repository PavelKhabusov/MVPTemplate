import { createContext, useContext } from 'react'
import type { AuthService } from './auth.service'

interface AuthContextValue {
  authApi: AuthService
  /** Navigate after successful login/register */
  onAuthSuccess: () => void
  /** Navigate to sign-in page */
  onNavigateToSignIn: () => void
  /** Navigate to forgot-password page */
  onNavigateToForgotPassword: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>')
  return ctx
}

interface AuthProviderProps extends AuthContextValue {
  children: React.ReactNode
}

export function AuthProvider({ children, ...value }: AuthProviderProps) {
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
