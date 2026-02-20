import { getAccessToken } from './api'
import { queryClient } from './query-client'

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000'

let eventSource: EventSource | null = null

export function connectSSE() {
  const token = getAccessToken()
  if (!token) return

  // Close existing connection
  disconnectSSE()

  const url = `${API_URL}/api/sse/events`

  eventSource = new EventSource(url, {
    // Note: EventSource doesn't support custom headers natively
    // In production, use a polyfill or pass token as query param
  } as any)

  eventSource.addEventListener('notification', (event: any) => {
    const data = JSON.parse(event.data)
    // Invalidate notifications query to trigger refetch
    queryClient.invalidateQueries({ queryKey: ['notifications'] })
  })

  eventSource.addEventListener('error', () => {
    // Auto-reconnect is built into EventSource
  })
}

export function disconnectSSE() {
  if (eventSource) {
    eventSource.close()
    eventSource = null
  }
}
