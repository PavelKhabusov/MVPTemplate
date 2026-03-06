// CallSheet-specific API endpoints
// Uses the template's api.ts for base auth/request, but we need direct access
// to add callsheet-specific endpoints

const API_BASE = 'http://localhost:3000/api'

async function getToken(): Promise<string | null> {
  const result = await chrome.storage?.local?.get('accessToken')
  return (result?.accessToken as string) || null
}

async function request<T>(path: string, options: RequestInit = {}, rawJson = false): Promise<T> {
  const token = await getToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }
  if (token) headers['Authorization'] = `Bearer ${token}`
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    const errMsg = typeof body.error === 'string' ? body.error : body.error?.formErrors?.[0] || `API error: ${res.status}`
    throw new Error(errMsg)
  }
  const json = await res.json()
  if (rawJson) return json
  return json.data !== undefined ? json.data : json
}

// --- Calls ---

export async function initiateCall(data: {
  to: string
  mode: 'browser' | 'phone'
  contactName?: string
  sheetId: string
  rowIndex: number
  managerPhone?: string
}) {
  return request<{ id: string }>('/calls/initiate', { method: 'POST', body: JSON.stringify(data) })
}

export async function getCallHistory(params: { sheetId?: string; page?: number; limit?: number }) {
  const searchParams = new URLSearchParams()
  if (params.sheetId) searchParams.set('sheetId', params.sheetId)
  if (params.page) searchParams.set('page', String(params.page))
  if (params.limit) searchParams.set('limit', String(params.limit))
  return request<{
    data: Array<{
      id: string
      contactName: string | null
      contactPhone: string
      status: string
      duration: number | null
      recordingUrl: string | null
      note: string | null
      startedAt: string
    }>
    pagination: { page: number; total: number; totalPages: number; limit: number }
  }>(`/calls?${searchParams}`, {}, true)
}

// --- Voximplant ---

export async function getVoximplantConfig() {
  return request<{ login: string; appId: string | null }>('/voximplant/config')
}

export async function connectVoximplant(data: { login: string; password: string; appId?: string }) {
  return request<{ ok: boolean }>('/voximplant/connect', { method: 'POST', body: JSON.stringify(data) })
}