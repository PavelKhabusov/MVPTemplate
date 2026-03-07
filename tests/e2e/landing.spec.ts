import { test, expect } from '@playwright/test'
import { LandingPage } from './pages/landing.page'

test.describe('Landing Page', () => {
  let landing: LandingPage

  test.beforeEach(async ({ page }) => {
    landing = new LandingPage(page)
    await landing.goto()
  })

  test('hero section renders with title and badge', async () => {
    await expect(landing.heroSection).toBeVisible()
    await expect(landing.heroTitle).toBeVisible()
    await expect(landing.heroBadge).toBeVisible()
  })

  test('features section is visible with heading', async () => {
    // Scroll features into view (it is below the fold)
    await landing.featuresTitle.scrollIntoViewIfNeeded()
    await expect(landing.featuresTitle).toBeVisible()
  })

  test('CTA buttons are visible and interactive', async () => {
    await expect(landing.heroCTA).toBeVisible()
    await expect(landing.heroSecondaryCTA).toBeVisible()

    // Bottom CTA section should also be present
    await landing.ctaTitle.scrollIntoViewIfNeeded()
    await expect(landing.ctaTitle).toBeVisible()
  })

  test('mobile viewport (375px) has no horizontal overflow', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    // Re-navigate after viewport change so CSS media queries apply properly
    await landing.goto()

    const hasOverflow = await landing.hasHorizontalOverflow()
    expect(hasOverflow).toBe(false)
  })
})
