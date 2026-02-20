import { useEffect, useRef } from 'react'
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

/**
 * Hook to track screen views. Pass usePathname() from expo-router.
 */
export function useScreenTracking(pathname: string) {
  const prevRef = useRef<string | null>(null)

  useEffect(() => {
    if (pathname && pathname !== prevRef.current) {
      trackScreen(pathname)
      prevRef.current = pathname
    }
  }, [pathname])
}
