export type ProxyProtocol = 'http' | 'socks5'
export type ProxyCheckStatus = 'success' | 'failed' | 'pending'

export interface ProxyItem {
  id: string
  name: string
  host: string
  protocol: ProxyProtocol
  httpPort: number | null
  socks5Port: number | null
  username: string | null
  password: string | null
  isActive: boolean
  priority: number
  lastCheckedAt: string | null
  lastCheckStatus: ProxyCheckStatus | null
  lastCheckMessage: string | null
  createdAt: string
  updatedAt: string
}

export interface CreateProxyDto {
  name: string
  host: string
  protocol?: ProxyProtocol
  httpPort?: number
  socks5Port?: number
  username?: string
  password?: string
  isActive?: boolean
  priority?: number
}

export type UpdateProxyDto = Partial<CreateProxyDto>

export interface ProxyTestResult {
  success: boolean
  message: string
  latency?: number
  details?: {
    proxyHost: string
    proxyPort: number
    testUrl?: string
    errorCode?: string
    errorType?: string
    timestamp: string
  }
}
