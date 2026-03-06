const API_BASE = 'http://localhost:3000/api'

async function getToken(): Promise<string | null> {
  const result = await chrome.storage?.local?.get('accessToken')
  return (result?.accessToken as string) || null
}

async function setTokens(accessToken: string, refreshToken: string) {
  await chrome.storage?.local?.set({ accessToken, refreshToken })
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await getToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers })

  // Handle 401 — try to refresh
  if (res.status === 401 && token) {
    const refreshed = await tryRefresh()
    if (refreshed) {
      headers['Authorization'] = `Bearer ${refreshed}`
      const retry = await fetch(`${API_BASE}${path}`, { ...options, headers })
      if (!retry.ok) throw new Error(`API error: ${retry.status}`)
      const retryJson = await retry.json()
      return retryJson.data !== undefined ? retryJson.data : retryJson
    }
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    const errMsg =
      typeof body.error === 'string'
        ? body.error
        : body.error?.formErrors?.[0] || `API error: ${res.status}`
    throw new Error(errMsg)
  }

  const json = await res.json()
  return json.data !== undefined ? json.data : json
}

async function tryRefresh(): Promise<string | null> {
  try {
    const stored = (await chrome.storage?.local?.get('refreshToken')) as { refreshToken?: string }
    if (!stored.refreshToken) return null

    const res = await fetch(`http://localhost:3000/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: stored.refreshToken }),
    })

    if (!res.ok) return null

    const json = await res.json()
    const data = json.data || json
    await setTokens(data.accessToken, data.refreshToken)
    return data.accessToken
  } catch {
    return null
  }
}

// --- Config ---

export interface AppFlags {
  googleAuth: boolean
  payments: boolean
  email: boolean
}

export async function fetchFlags(): Promise<AppFlags> {
  try {
    const res = await fetch(`http://localhost:3000/api/config/flags`)
    if (!res.ok) return { googleAuth: false, payments: false, email: false }
    const json = await res.json()
    return {
      googleAuth: !!json.data?.googleAuth,
      payments: !!json.data?.payments,
      email: !!json.data?.email,
    }
  } catch {
    return { googleAuth: false, payments: false, email: false }
  }
}

// --- Auth ---

export async function register(email: string, password: string, name?: string) {
  const data = await request<{
    accessToken: string
    refreshToken: string
    userId: string
  }>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password, name: name || email.split('@')[0] }),
  })
  await setTokens(data.accessToken, data.refreshToken)
  return data
}

export async function login(email: string, password: string) {
  const data = await request<{
    accessToken: string
    refreshToken: string
    userId: string
  }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
  await setTokens(data.accessToken, data.refreshToken)
  return data
}

export async function logout() {
  await chrome.storage?.local?.remove(['accessToken', 'refreshToken'])
}

// --- User ---

export async function getMe() {
  return request<{ id: string; email: string; name: string }>('/auth/me')
}

// --- Subscription ---

export async function getSubscription() {
  return request<{
    id: string
    planName: string
    status: string
    currentPeriodEnd: string
    cancelAtPeriodEnd: boolean
  } | null>('/payments/subscription')
}

export async function getPlans() {
  return request<
    Array<{
      id: string
      name: string
      description: string | null
      priceAmount: number
      currency: string
      interval: string
      features: string[]
    }>
  >('/payments/plans')
}
