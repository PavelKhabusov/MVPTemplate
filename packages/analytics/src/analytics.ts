/**
 * Analytics abstraction layer.
 * Dual-sends to PostHog (when configured) AND own backend (via event buffer).
 */

const isDev = typeof __DEV__ !== 'undefined' && __DEV__

let posthogClient: any = null

function getPostHog() {
  if (posthogClient !== null) return posthogClient
  try {
    const ph = require('posthog-react-native')
    return ph.default ?? ph
  } catch {
    return null
  }
}

// --- Event Buffer ---

interface BufferedEvent {
  event: string
  eventType: 'track' | 'screen' | 'identify' | 'session_start' | 'session_end'
  properties?: Record<string, unknown>
  screenName?: string
  sessionDuration?: number
  clientTimestamp: string
}

class EventBuffer {
  private buffer: BufferedEvent[] = []
  private flushTimer: ReturnType<typeof setInterval> | null = null
  private apiUrl = ''
  private deviceId = ''
  private getToken: (() => string | null) | null = null

  private readonly MAX_BUFFER = 10
  private readonly FLUSH_MS = 30_000

  configure(options: { apiUrl: string; deviceId: string; getToken: () => string | null }) {
    this.apiUrl = options.apiUrl
    this.deviceId = options.deviceId
    this.getToken = options.getToken
    this.startTimer()
  }

  push(event: BufferedEvent) {
    this.buffer.push(event)
    if (this.buffer.length >= this.MAX_BUFFER) {
      this.flush()
    }
  }

  async flush() {
    if (this.buffer.length === 0 || !this.apiUrl || !this.getToken) return

    const token = this.getToken()
    if (!token) return

    const events = [...this.buffer]
    this.buffer = []

    try {
      await fetch(`${this.apiUrl}/api/analytics/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ deviceId: this.deviceId, events }),
      })
      if (isDev) console.log(`[Analytics] Flushed ${events.length} events`)
    } catch (err) {
      if (isDev) console.warn('[Analytics] Flush failed, re-queuing', err)
      this.buffer = [...events, ...this.buffer]
    }
  }

  private startTimer() {
    if (this.flushTimer) return
    this.flushTimer = setInterval(() => this.flush(), this.FLUSH_MS)
  }

  destroy() {
    if (this.flushTimer) {
      clearInterval(this.flushTimer)
      this.flushTimer = null
    }
    this.flush()
  }
}

const eventBuffer = new EventBuffer()

// --- Session Tracking ---

let sessionStart: number | null = null

// --- Analytics Class ---

class Analytics {
  private initialized = false

  init(apiKey?: string, options?: { host?: string }) {
    if (!apiKey) {
      if (isDev) console.log('[Analytics] No API key, running in stub mode')
      return
    }

    const ph = getPostHog()
    if (ph) {
      try {
        posthogClient = new ph.PostHog(apiKey, {
          host: options?.host ?? 'https://us.i.posthog.com',
        })
        this.initialized = true
        if (isDev) console.log('[Analytics] PostHog initialized')
      } catch (e) {
        if (isDev) console.warn('[Analytics] PostHog init failed:', e)
      }
    } else {
      if (isDev) console.log('[Analytics] posthog-react-native not installed, using stub mode')
    }
  }

  configureBackend(options: { apiUrl: string; deviceId: string; getToken: () => string | null }) {
    eventBuffer.configure(options)
  }

  track(event: string, properties?: Record<string, unknown>) {
    if (isDev) console.log('[Analytics] track:', event, properties)
    if (this.initialized) posthogClient?.capture(event, properties)
    eventBuffer.push({
      event,
      eventType: 'track',
      properties,
      clientTimestamp: new Date().toISOString(),
    })
  }

  screen(name: string, properties?: Record<string, unknown>) {
    if (isDev) console.log('[Analytics] screen:', name, properties)
    if (this.initialized) posthogClient?.screen(name, properties)
    eventBuffer.push({
      event: 'screen_view',
      eventType: 'screen',
      properties: { ...properties, screen: name },
      screenName: name,
      clientTimestamp: new Date().toISOString(),
    })
  }

  identify(userId: string, traits?: Record<string, unknown>) {
    if (isDev) console.log('[Analytics] identify:', userId, traits)
    if (this.initialized) posthogClient?.identify(userId, traits)
    eventBuffer.push({
      event: 'identify',
      eventType: 'identify',
      properties: { userId, ...traits },
      clientTimestamp: new Date().toISOString(),
    })
  }

  startSession() {
    sessionStart = Date.now()
    eventBuffer.push({
      event: 'session_start',
      eventType: 'session_start',
      clientTimestamp: new Date().toISOString(),
    })
  }

  endSession() {
    const duration = sessionStart ? Math.round((Date.now() - sessionStart) / 1000) : undefined
    sessionStart = null
    eventBuffer.push({
      event: 'session_end',
      eventType: 'session_end',
      sessionDuration: duration,
      clientTimestamp: new Date().toISOString(),
    })
  }

  flush() {
    return eventBuffer.flush()
  }

  reset() {
    if (isDev) console.log('[Analytics] reset')
    if (!this.initialized) return
    posthogClient?.reset()
  }

  isFeatureEnabled(flag: string): boolean | undefined {
    if (!this.initialized || !posthogClient) return undefined
    return posthogClient.isFeatureEnabled?.(flag)
  }

  getClient() {
    return posthogClient
  }
}

export const analytics = new Analytics()
