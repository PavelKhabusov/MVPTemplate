import { QueryClient } from '@tanstack/react-query'

interface SSEConfig {
  apiUrl: string
  getAccessToken: () => string | null
  queryClient: QueryClient
}

let eventSource: EventSource | null = null
let reconnectTimer: ReturnType<typeof setTimeout> | null = null
let _config: SSEConfig | null = null

export function configureSSE(config: SSEConfig) {
  _config = config
}

/**
 * Connect to SSE endpoint with authentication.
 * Uses query param for token since EventSource doesn't support custom headers.
 */
export function connectSSE() {
  if (typeof EventSource === 'undefined') return
  if (!_config) return

  const token = _config.getAccessToken()
  if (!token) return

  disconnectSSE()

  const url = `${_config.apiUrl}/api/sse/events?token=${encodeURIComponent(token)}`

  eventSource = new EventSource(url)

  eventSource.addEventListener('notification', () => {
    _config?.queryClient.invalidateQueries({ queryKey: ['notifications'] })
  })

  eventSource.addEventListener('error', () => {
    disconnectSSE()
    reconnectTimer = setTimeout(() => connectSSE(), 5000)
  })
}

export function disconnectSSE() {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer)
    reconnectTimer = null
  }
  if (eventSource) {
    eventSource.close()
    eventSource = null
  }
}
