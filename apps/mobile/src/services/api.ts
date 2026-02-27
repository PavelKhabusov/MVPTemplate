import { createAuthHttpClient } from '@mvp/auth'

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000'

export const { api, setAccessToken, getAccessToken } = createAuthHttpClient({
  baseURL: `${API_URL}/api`,
})
