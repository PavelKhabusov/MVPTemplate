import { type Page } from '@playwright/test'

/**
 * Dismiss onboarding wizard and cookie consent before tests.
 * Sets localStorage values that Zustand persist reads on hydration.
 */
export async function dismissOverlays(page: Page) {
  await page.addInitScript(() => {
    // Skip onboarding wizard
    localStorage.setItem('app-storage', JSON.stringify({
      state: { hasCompletedOnboarding: true, lastRoute: null },
      version: 0,
    }))
    // Accept cookies
    localStorage.setItem('cookie-consent', JSON.stringify({
      state: { consent: 'accepted' },
      version: 0,
    }))
    // Reset language to device default (English) to prevent leakage between tests
    localStorage.setItem('language-storage', JSON.stringify({
      state: { language: null },
      version: 0,
    }))
  })
}
