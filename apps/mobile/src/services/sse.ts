import { getAccessToken } from './api'
import { queryClient } from './query-client'

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000'

let eventSource: EventSource | null = null
let reconnectTimer: ReturnType<typeof setTimeout> | null = null

/**
 * Connect to SSE endpoint with authentication.
 * Uses query param for token since EventSource doesn't support custom headers.
 * In production, consider using a short-lived ticket instead of the JWT directly.
 */
export function connectSSE() {
  if (typeof EventSource === 'undefined') return // Not available on native

  const token = getAccessToken()
  if (!token) return

  disconnectSSE()

  const url = `${API_URL}/api/sse/events?token=${encodeURIComponent(token)}`

  eventSource = new EventSource(url)

  eventSource.addEventListener('notification', (event: any) => {
    try {
      const data = JSON.parse(event.data)
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    } catch {}
  })

  eventSource.addEventListener('error', () => {
    // Reconnect with fresh token after delay
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
