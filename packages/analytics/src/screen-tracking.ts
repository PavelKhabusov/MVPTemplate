import { analytics } from './analytics'

let lastScreenName: string | null = null

export function trackScreen(pathname: string) {
  // Remove route group markers like (auth), (tabs)
  const cleanPath = pathname.replace(/\([^)]+\)\/?/g, '')
  const screenName = cleanPath || 'Home'

  if (screenName !== lastScreenName) {
    analytics.screen(screenName, { pathname })
    lastScreenName = screenName
  }
}
