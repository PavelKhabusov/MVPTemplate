import { secureStorage } from '@mvp/lib'
import { useAuthStore } from '@mvp/store'
import type { AuthServiceDeps } from './types'

export function createAuthService(deps: AuthServiceDeps) {
  const { http, setAccessToken } = deps

  async function handleAuthResponse(data: {
    accessToken: string
    refreshToken: string
  }) {
    setAccessToken(data.accessToken)
    await secureStorage.set('refreshToken', data.refreshToken)

    const { data: meData } = await http.get('/auth/me')
    useAuthStore.getState().setUser((meData as any).data)
  }

  return {
    async register(data: { email: string; password: string; name: string }) {
      const response = await http.post('/auth/register', data)
      await handleAuthResponse((response.data as any).data)
    },

    async login(data: { email: string; password: string }) {
      const response = await http.post('/auth/login', data)
      await handleAuthResponse((response.data as any).data)
    },

    async googleLogin(idToken: string) {
      const response = await http.post('/auth/google', { idToken })
      await handleAuthResponse((response.data as any).data)
    },

    async logout() {
      try {
        const refreshToken = await secureStorage.get('refreshToken')
        if (refreshToken) {
          await http.post('/auth/logout', { refreshToken })
        }
      } catch {
        // Ignore errors during logout
      } finally {
        setAccessToken(null)
        await secureStorage.remove('refreshToken')
        useAuthStore.getState().logout()
      }
    },

    async initialize() {
      try {
        const refreshToken = await secureStorage.get('refreshToken')
        if (!refreshToken) {
          useAuthStore.getState().setInitialized()
          return
        }

        const { data } = await http.post('/auth/refresh', { refreshToken })
        await handleAuthResponse((data as any).data)
      } catch {
        setAccessToken(null)
        await secureStorage.remove('refreshToken')
      } finally {
        useAuthStore.getState().setInitialized()
      }
    },

    async requestPasswordReset(email: string) {
      await http.post('/auth/request-password-reset', { email })
    },

    async resetPassword(token: string, password: string) {
      await http.post('/auth/reset-password', { token, password })
    },

    async verifyEmail(token: string) {
      await http.post('/auth/verify-email', { token })
    },

    async resendVerification(locale?: string) {
      await http.post('/auth/resend-verification', { locale })
    },
  }
}

export type AuthService = ReturnType<typeof createAuthService>
