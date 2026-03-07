import { test, expect, type Page } from '@playwright/test'
import { dismissOverlays } from './helpers/dismiss-overlays'

/**
 * Visual regression tests — capture screenshots of key screens
 * and compare against baseline snapshots.
 *
 * First run: `npx playwright test visual.spec.ts --update-snapshots`
 * to generate baseline screenshots.
 *
 * Subsequent runs compare against baselines and fail on visual diffs.
 */

// Fixed viewport for consistent screenshots
const DESKTOP = { width: 1280, height: 800 }
const MOBILE = { width: 390, height: 844 }

/** Navigate to settings via sidebar click (direct URL doesn't work reliably). */
async function gotoSettings(page: Page) {
  await page.goto('/')
  await page.waitForLoadState('domcontentloaded')
  const settingsLink = page.getByText('Settings').first()
  try {
    await settingsLink.click({ timeout: 5000 })
  } catch {
    await page.goto('/(tabs)/settings')
  }
  await page.getByText('Theme').first().waitFor({ state: 'visible', timeout: 15000 })
}

// ---------------------------------------------------------------------------
// Landing Page
// ---------------------------------------------------------------------------

test.describe('Visual: Landing Page', () => {
  test('desktop — hero section', async ({ page }) => {
    await dismissOverlays(page)
    await page.setViewportSize(DESKTOP)
    await page.goto('/landing')
    await page.getByText('Ship your MVP in days, not months').waitFor({ state: 'visible', timeout: 30000 })
    await page.waitForTimeout(1000)
    await expect(page).toHaveScreenshot('landing-hero-desktop.png', { fullPage: false })
  })

  test('desktop — full page', async ({ page }) => {
    await dismissOverlays(page)
    await page.setViewportSize(DESKTOP)
    await page.goto('/landing')
    await page.getByText('Ship your MVP in days, not months').waitFor({ state: 'visible', timeout: 30000 })
    await page.waitForTimeout(1500)
    await expect(page).toHaveScreenshot('landing-full-desktop.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.02,
    })
  })

  test('mobile — hero section', async ({ page }) => {
    await dismissOverlays(page)
    await page.setViewportSize(MOBILE)
    await page.goto('/landing')
    await page.getByText('Ship your MVP in days, not months').waitFor({ state: 'visible', timeout: 30000 })
    await page.waitForTimeout(1000)
    await expect(page).toHaveScreenshot('landing-hero-mobile.png', { fullPage: false })
  })
})

// ---------------------------------------------------------------------------
// Home Screen (Dashboard)
// ---------------------------------------------------------------------------

test.describe('Visual: Home Screen', () => {
  test('desktop — dashboard', async ({ page }) => {
    await dismissOverlays(page)
    await page.setViewportSize(DESKTOP)
    await page.goto('/')
    await page.getByText('Welcome').first().waitFor({ state: 'visible', timeout: 15000 })
    await page.waitForTimeout(800)
    await expect(page).toHaveScreenshot('home-desktop.png')
  })

  test('mobile — dashboard', async ({ page }) => {
    await dismissOverlays(page)
    await page.setViewportSize(MOBILE)
    await page.goto('/')
    await page.getByText('Welcome').first().waitFor({ state: 'visible', timeout: 15000 })
    await page.waitForTimeout(800)
    await expect(page).toHaveScreenshot('home-mobile.png')
  })
})

// ---------------------------------------------------------------------------
// Settings Page
// ---------------------------------------------------------------------------

test.describe('Visual: Settings Page', () => {
  test('desktop — settings', async ({ page }) => {
    await dismissOverlays(page)
    await page.setViewportSize(DESKTOP)
    await gotoSettings(page)
    await page.waitForTimeout(800)
    await expect(page).toHaveScreenshot('settings-desktop.png')
  })

  test('mobile — settings', async ({ page }) => {
    await dismissOverlays(page)
    await page.setViewportSize(MOBILE)
    await gotoSettings(page)
    await page.waitForTimeout(800)
    await expect(page).toHaveScreenshot('settings-mobile.png')
  })
})

// ---------------------------------------------------------------------------
// Auth Screen
// ---------------------------------------------------------------------------

test.describe('Visual: Auth Screen', () => {
  test('desktop — login form', async ({ page }) => {
    await dismissOverlays(page)
    await page.setViewportSize(DESKTOP)
    await page.goto('/sign-in')
    await page.getByText('Sign In', { exact: true }).first().waitFor({ state: 'visible', timeout: 15000 })
    await page.waitForTimeout(800)
    await expect(page).toHaveScreenshot('auth-login-desktop.png')
  })

  test('mobile — login form', async ({ page }) => {
    await dismissOverlays(page)
    await page.setViewportSize(MOBILE)
    await page.goto('/sign-in')
    await page.getByText('Sign In', { exact: true }).first().waitFor({ state: 'visible', timeout: 15000 })
    await page.waitForTimeout(800)
    await expect(page).toHaveScreenshot('auth-login-mobile.png')
  })
})

// ---------------------------------------------------------------------------
// Pricing Page
// ---------------------------------------------------------------------------

test.describe('Visual: Pricing Page', () => {
  const MOCK_PLANS = [
    {
      id: 'basic', name: 'Basic', description: 'For individuals',
      priceAmount: 900, currency: 'usd', interval: 'month',
      features: ['5 projects', 'Basic analytics', 'Email support'],
      sortOrder: 1, isActive: true, provider: 'stripe',
    },
    {
      id: 'pro', name: 'Pro', description: 'For growing teams',
      priceAmount: 1900, currency: 'usd', interval: 'month',
      features: ['Unlimited projects', 'Advanced analytics', 'Priority support', 'API access'],
      sortOrder: 2, isActive: true, provider: 'stripe',
    },
    {
      id: 'enterprise', name: 'Enterprise', description: 'For organizations',
      priceAmount: 4900, currency: 'usd', interval: 'month',
      features: ['Everything in Pro', 'Custom integrations', 'Dedicated support', 'SLA'],
      sortOrder: 3, isActive: true, provider: 'stripe',
    },
  ]

  async function mockPayments(page: Page) {
    await page.route('**/api/payments/plans', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: MOCK_PLANS, success: true }),
      })
    })
    await page.route('**/api/payments/subscription', (route) => {
      route.fulfill({ status: 401, body: 'Unauthorized' })
    })
  }

  test('desktop — pricing cards', async ({ page }) => {
    await dismissOverlays(page)
    await page.setViewportSize(DESKTOP)
    await mockPayments(page)
    await page.goto('/pricing')
    await page.getByText('Basic').first().waitFor({ state: 'visible', timeout: 15000 })
    await page.waitForTimeout(800)
    await expect(page).toHaveScreenshot('pricing-desktop.png', { fullPage: true })
  })

  test('mobile — pricing cards', async ({ page }) => {
    await dismissOverlays(page)
    await page.setViewportSize(MOBILE)
    await mockPayments(page)
    await page.goto('/pricing')
    await page.getByText('Basic').first().waitFor({ state: 'visible', timeout: 15000 })
    await page.waitForTimeout(800)
    await expect(page).toHaveScreenshot('pricing-mobile.png', { fullPage: true })
  })
})

// ---------------------------------------------------------------------------
// Dark Theme
// ---------------------------------------------------------------------------

test.describe('Visual: Dark Theme', () => {
  async function setDarkTheme(page: Page) {
    await page.addInitScript(() => {
      localStorage.setItem('app-storage', JSON.stringify({
        state: { hasCompletedOnboarding: true, lastRoute: null },
        version: 0,
      }))
      localStorage.setItem('cookie-consent', JSON.stringify({
        state: { consent: 'accepted' },
        version: 0,
      }))
      localStorage.setItem('language-storage', JSON.stringify({
        state: { language: null },
        version: 0,
      }))
      localStorage.setItem('theme-storage', JSON.stringify({
        state: { mode: 'dark' },
        version: 0,
      }))
    })
    // Also emulate dark color scheme at browser level
    await page.emulateMedia({ colorScheme: 'dark' })
  }

  test('desktop — home dark', async ({ page }) => {
    await setDarkTheme(page)
    await page.setViewportSize(DESKTOP)
    await page.goto('/')
    await page.getByText('Welcome').first().waitFor({ state: 'visible', timeout: 15000 })
    await page.waitForTimeout(800)
    await expect(page).toHaveScreenshot('home-dark-desktop.png')
  })

  test('desktop — landing dark', async ({ page }) => {
    await setDarkTheme(page)
    await page.setViewportSize(DESKTOP)
    await page.goto('/landing')
    await page.getByText('Ship your MVP in days, not months').waitFor({ state: 'visible', timeout: 30000 })
    await page.waitForTimeout(1000)
    await expect(page).toHaveScreenshot('landing-dark-desktop.png')
  })

  test('desktop — settings dark', async ({ page }) => {
    await setDarkTheme(page)
    await page.setViewportSize(DESKTOP)
    await gotoSettings(page)
    await page.waitForTimeout(800)
    await expect(page).toHaveScreenshot('settings-dark-desktop.png')
  })

  test('desktop — auth dark', async ({ page }) => {
    await setDarkTheme(page)
    await page.setViewportSize(DESKTOP)
    await page.goto('/sign-in')
    await page.getByText('Sign In', { exact: true }).first().waitFor({ state: 'visible', timeout: 15000 })
    await page.waitForTimeout(800)
    await expect(page).toHaveScreenshot('auth-dark-desktop.png')
  })
})

// ---------------------------------------------------------------------------
// Onboarding Wizard
// ---------------------------------------------------------------------------

test.describe('Visual: Onboarding', () => {
  async function skipCookiesOnly(page: Page) {
    await page.addInitScript(() => {
      localStorage.setItem('cookie-consent', JSON.stringify({
        state: { consent: 'accepted' },
        version: 0,
      }))
      localStorage.setItem('language-storage', JSON.stringify({
        state: { language: null },
        version: 0,
      }))
    })
  }

  test('desktop — wizard step 1', async ({ page }) => {
    await skipCookiesOnly(page)
    await page.setViewportSize(DESKTOP)
    await page.goto('/')
    await page.getByText('Welcome to').first().waitFor({ state: 'visible', timeout: 15000 })
    await page.waitForTimeout(500)
    await expect(page).toHaveScreenshot('onboarding-step1-desktop.png')
  })

  test('desktop — wizard step 4', async ({ page }) => {
    await skipCookiesOnly(page)
    await page.setViewportSize(DESKTOP)
    await page.goto('/')
    await page.getByText('Welcome to').first().waitFor({ state: 'visible', timeout: 15000 })

    for (let i = 0; i < 3; i++) {
      await page.getByText('Next', { exact: true }).first().click()
      await page.waitForTimeout(300)
    }
    await page.getByText("You're All Set!").first().waitFor({ state: 'visible', timeout: 5000 })
    await page.waitForTimeout(500)
    await expect(page).toHaveScreenshot('onboarding-step4-desktop.png')
  })
})

// ---------------------------------------------------------------------------
// Cookie Consent Banner
// ---------------------------------------------------------------------------

test.describe('Visual: Cookie Banner', () => {
  test('desktop — cookie banner', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('app-storage', JSON.stringify({
        state: { hasCompletedOnboarding: true, lastRoute: null },
        version: 0,
      }))
      localStorage.setItem('language-storage', JSON.stringify({
        state: { language: null },
        version: 0,
      }))
    })
    await page.setViewportSize(DESKTOP)
    await page.goto('/')
    await page.getByText('We use cookies and local storage').waitFor({ state: 'visible', timeout: 5000 })
    await page.waitForTimeout(500)
    await expect(page).toHaveScreenshot('cookie-banner-desktop.png')
  })
})
