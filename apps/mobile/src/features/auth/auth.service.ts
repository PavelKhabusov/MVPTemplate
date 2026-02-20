import { api, setAccessToken } from '../../services/api'
import { secureStorage } from '@mvp/lib'
import { useAuthStore } from '@mvp/store'

export const authApi = {
  async register(data: { email: string; password: string; name: string }) {
    const response = await api.post('/auth/register', data)
    await handleAuthResponse(response.data.data)
  },

  async login(data: { email: string; password: string }) {
    const response = await api.post('/auth/login', data)
    await handleAuthResponse(response.data.data)
  },

  async logout() {
    try {
      const refreshToken = await secureStorage.get('refreshToken')
      if (refreshToken) {
        await api.post('/auth/logout', { refreshToken })
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

      const { data } = await api.post('/auth/refresh', { refreshToken })
      await handleAuthResponse(data.data)
    } catch {
      setAccessToken(null)
      await secureStorage.remove('refreshToken')
    } finally {
      useAuthStore.getState().setInitialized()
    }
  },
}

async function handleAuthResponse(data: {
  accessToken: string
  refreshToken: string
}) {
  setAccessToken(data.accessToken)
  await secureStorage.set('refreshToken', data.refreshToken)

  // Fetch user profile
  const { data: meData } = await api.get('/auth/me')
  useAuthStore.getState().setUser(meData.data)
}
