import { api, setAccessToken } from '../../services/api'
import { secureStorage } from '@mvp/lib'
import { useAuthStore } from '@mvp/store'

const DEMO_USER = {
  id: 'demo-user-1',
  email: 'demo@example.com',
  name: 'Demo User',
  avatarUrl: null,
}

export const authApi = {
  async register(data: { email: string; password: string; name: string }) {
    try {
      const response = await api.post('/auth/register', data)
      await handleAuthResponse(response.data.data)
    } catch (err: any) {
      if (isNetworkError(err)) {
        await handleDemoAuth({ ...DEMO_USER, email: data.email, name: data.name })
        return
      }
      throw err
    }
  },

  async login(data: { email: string; password: string }) {
    try {
      const response = await api.post('/auth/login', data)
      await handleAuthResponse(response.data.data)
    } catch (err: any) {
      if (isNetworkError(err)) {
        await handleDemoAuth({ ...DEMO_USER, email: data.email })
        return
      }
      throw err
    }
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
      await secureStorage.remove('demoUser')
      useAuthStore.getState().logout()
    }
  },

  async initialize() {
    try {
      // Check for demo session first
      const demoUser = await secureStorage.get('demoUser')
      if (demoUser) {
        useAuthStore.getState().setUser(JSON.parse(demoUser))
        useAuthStore.getState().setInitialized()
        return
      }

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

function isNetworkError(err: any): boolean {
  return !err.response && (err.code === 'ERR_NETWORK' || err.message === 'Network Error')
}

async function handleDemoAuth(user: {
  id: string
  email: string
  name: string
  avatarUrl: string | null
}) {
  await secureStorage.set('demoUser', JSON.stringify(user))
  useAuthStore.getState().setUser(user)
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
