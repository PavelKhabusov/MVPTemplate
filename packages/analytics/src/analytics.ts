/**
 * Analytics abstraction layer.
 * Backed by PostHog when posthog-react-native is installed and API key is provided.
 * Falls back to console.log in dev, no-op in production.
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

  track(event: string, properties?: Record<string, unknown>) {
    if (isDev) console.log('[Analytics] track:', event, properties)
    if (!this.initialized) return
    posthogClient?.capture(event, properties)
  }

  screen(name: string, properties?: Record<string, unknown>) {
    if (isDev) console.log('[Analytics] screen:', name, properties)
    if (!this.initialized) return
    posthogClient?.screen(name, properties)
  }

  identify(userId: string, traits?: Record<string, unknown>) {
    if (isDev) console.log('[Analytics] identify:', userId, traits)
    if (!this.initialized) return
    posthogClient?.identify(userId, traits)
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
