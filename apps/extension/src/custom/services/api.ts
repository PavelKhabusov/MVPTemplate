// CallSheet-specific API endpoints

const API_BASE = 'http://localhost:3000/api'

async function getToken(): Promise<string | null> {
  const result = await chrome.storage?.local?.get('accessToken')
  return (result?.accessToken as string) || null
}

async function tryRefresh(): Promise<string | null> {
  try {
    const stored = (await chrome.storage?.local?.get('refreshToken')) as { refreshToken?: string }
    if (!stored.refreshToken) return null
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: stored.refreshToken }),
    })
    if (!res.ok) return null
    const json = await res.json()
    const data = json.data || json
    await chrome.storage?.local?.set({ accessToken: data.accessToken, refreshToken: data.refreshToken })
    return data.accessToken
  } catch {
    return null
  }
}

async function request<T>(path: string, options: RequestInit = {}, rawJson = false): Promise<T> {
  const token = await getToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }
  if (token) headers['Authorization'] = `Bearer ${token}`
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers })

  // Handle 401 — try to refresh token
  if (res.status === 401 && token) {
    const refreshed = await tryRefresh()
    if (refreshed) {
      headers['Authorization'] = `Bearer ${refreshed}`
      const retry = await fetch(`${API_BASE}${path}`, { ...options, headers })
      if (!retry.ok) throw new Error(`API error: ${retry.status}`)
      const retryJson = await retry.json()
      if (rawJson) return retryJson
      return retryJson.data !== undefined ? retryJson.data : retryJson
    }
  }

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
  return request<{ login: string; appId: string | null; password: string | null } | null>('/voximplant/config')
}

export async function connectVoximplant(data: { login: string; password: string; appId?: string }) {
  return request<{ ok: boolean }>('/voximplant/connect', { method: 'POST', body: JSON.stringify(data) })
}

// --- Sheet Templates ---

export interface SheetTemplateData {
  id: string
  name: string
  spreadsheetId: string | null
  spreadsheetName: string | null
  sheetName: string | null
  columnMappings: Record<string, string | undefined>
  isDefault: boolean
}

export async function matchSheetTemplate(spreadsheetId: string, sheetName: string) {
  const params = new URLSearchParams({ spreadsheetId, sheetName })
  return request<SheetTemplateData | null>(`/sheet-templates/match?${params}`)
}

export async function createSheetTemplate(data: {
  name: string
  spreadsheetId?: string
  spreadsheetName?: string
  sheetName?: string
  columnMappings: Record<string, string | undefined>
}) {
  return request<SheetTemplateData>('/sheet-templates', { method: 'POST', body: JSON.stringify(data) })
}

export async function updateSheetTemplate(id: string, data: {
  columnMappings?: Record<string, string | undefined>
  name?: string
  spreadsheetId?: string | null
  spreadsheetName?: string | null
  sheetName?: string | null
}) {
  return request<SheetTemplateData>(`/sheet-templates/${id}`, { method: 'PATCH', body: JSON.stringify(data) })
}

export async function listSheetTemplates() {
  return request<SheetTemplateData[]>('/sheet-templates')
}