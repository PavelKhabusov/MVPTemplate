import axios from 'axios'
import { secureStorage } from '@mvp/lib'

// Survive HMR: keep token in globalThis so module re-evaluation doesn't lose it
const TOKEN_KEY = '__mvp_access_token__'
const _global = globalThis as any

interface AuthHttpClientConfig {
  baseURL: string
  timeout?: number
}

export function createAuthHttpClient(config: AuthHttpClientConfig) {
  const api = axios.create({
    baseURL: config.baseURL,
    timeout: config.timeout ?? 15000,
    headers: { 'Content-Type': 'application/json' },
  })

  let accessToken: string | null = _global[TOKEN_KEY] ?? null
  let isRefreshing = false
  let refreshQueue: Array<{
    resolve: (token: string) => void
    reject: (err: unknown) => void
  }> = []

  function setAccessToken(token: string | null) {
    accessToken = token
    _global[TOKEN_KEY] = token
  }

  function getAccessToken() {
    return accessToken
  }

  // Request interceptor: attach access token
  api.interceptors.request.use((cfg) => {
    if (accessToken) {
      cfg.headers.Authorization = `Bearer ${accessToken}`
    }
    return cfg
  })

  // Response interceptor: auto-refresh on 401
  api.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config

      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true

        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            refreshQueue.push({ resolve, reject })
          }).then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`
            return api(originalRequest)
          })
        }

        isRefreshing = true

        try {
          const refreshToken = await secureStorage.get('refreshToken')
          if (!refreshToken) throw new Error('No refresh token')

          const { data } = await axios.post(`${config.baseURL}/auth/refresh`, {
            refreshToken,
          })

          const newAccessToken = data.data.accessToken
          const newRefreshToken = data.data.refreshToken

          accessToken = newAccessToken
          _global[TOKEN_KEY] = newAccessToken
          await secureStorage.set('refreshToken', newRefreshToken)

          refreshQueue.forEach(({ resolve }) => resolve(newAccessToken))
          refreshQueue = []

          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
          return api(originalRequest)
        } catch (refreshError) {
          refreshQueue.forEach(({ reject }) => reject(refreshError))
          refreshQueue = []
          accessToken = null
          _global[TOKEN_KEY] = null
          await secureStorage.remove('refreshToken')
          return Promise.reject(refreshError)
        } finally {
          isRefreshing = false
        }
      }

      return Promise.reject(error)
    }
  )

  return { api, setAccessToken, getAccessToken }
}
