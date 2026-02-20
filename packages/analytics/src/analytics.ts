/**
 * Analytics abstraction layer.
 * Backed by PostHog in production. Add posthog-react-native when ready.
 * For now, provides a no-op stub that logs in development.
 */

const isDev = __DEV__

interface AnalyticsEvent {
  name: string
  properties?: Record<string, unknown>
}

class Analytics {
  private initialized = false

  init(apiKey?: string) {
    if (!apiKey) {
      if (isDev) console.log('[Analytics] No API key, running in stub mode')
      return
    }

    // TODO: Initialize PostHog with apiKey
    // posthog.init(apiKey)
    this.initialized = true
  }

  track(event: string, properties?: Record<string, unknown>) {
    if (isDev) console.log('[Analytics] track:', event, properties)
    if (!this.initialized) return
    // posthog.capture(event, properties)
  }

  screen(name: string, properties?: Record<string, unknown>) {
    if (isDev) console.log('[Analytics] screen:', name, properties)
    if (!this.initialized) return
    // posthog.screen(name, properties)
  }

  identify(userId: string, traits?: Record<string, unknown>) {
    if (isDev) console.log('[Analytics] identify:', userId, traits)
    if (!this.initialized) return
    // posthog.identify(userId, traits)
  }

  reset() {
    if (isDev) console.log('[Analytics] reset')
    if (!this.initialized) return
    // posthog.reset()
  }
}

export const analytics = new Analytics()
