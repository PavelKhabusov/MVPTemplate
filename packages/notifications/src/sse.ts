import { QueryClient } from '@tanstack/react-query'

interface SSEConfig {
  apiUrl: string
  getAccessToken: () => string | null
  queryClient: QueryClient
}

let _controller: AbortController | null = null
let reconnectTimer: ReturnType<typeof setTimeout> | null = null
let _config: SSEConfig | null = null

export function configureSSE(config: SSEConfig) {
  _config = config
}

/**
 * Connect to SSE endpoint using fetch with Authorization header.
 * This avoids putting the token in the URL (which leaks into server logs,
 * proxy logs, CDN logs, and browser history).
 */
export function connectSSE() {
  if (typeof window === 'undefined' || typeof fetch === 'undefined') return
  if (!_config) return

  const token = _config.getAccessToken()
  if (!token) return

  disconnectSSE()

  const controller = new AbortController()
  _controller = controller
  const config = _config

  fetch(`${config.apiUrl}/api/sse/events`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'text/event-stream',
    },
    signal: controller.signal,
  })
    .then(async (res) => {
      if (!res.ok || !res.body) {
        scheduleReconnect()
        return
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })

        // SSE events are separated by double newlines
        const blocks = buffer.split('\n\n')
        buffer = blocks.pop() ?? ''

        for (const block of blocks) {
          let eventName = ''
          for (const line of block.split('\n')) {
            if (line.startsWith('event:')) eventName = line.slice(6).trim()
          }
          if (eventName === 'notification') {
            config.queryClient.invalidateQueries({ queryKey: ['notifications'] })
          }
        }
      }

      // Stream ended cleanly — reconnect
      scheduleReconnect()
    })
    .catch((err: Error) => {
      if (err.name === 'AbortError') return // Intentional disconnect
      scheduleReconnect()
    })
}

function scheduleReconnect() {
  reconnectTimer = setTimeout(() => connectSSE(), 5000)
}

export function disconnectSSE() {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer)
    reconnectTimer = null
  }
  if (_controller) {
    _controller.abort()
    _controller = null
  }
}
