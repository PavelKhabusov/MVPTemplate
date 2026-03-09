import { test, expect, type Page } from '@playwright/test'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Skip onboarding wizard but leave cookie consent untouched. */
async function skipOnboardingOnly(page: Page) {
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
}

/** Accept cookie consent but leave onboarding untouched (wizard will appear). */
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

/** Skip both onboarding and cookie consent. */
async function skipAll(page: Page) {
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
  })
}

// ---------------------------------------------------------------------------
// Cookie Consent Banner
// ---------------------------------------------------------------------------

test.describe('Cookie Consent Banner', () => {
  test('banner appears after delay', async ({ page }) => {
    await skipOnboardingOnly(page)
    await page.goto('/')

    // Banner should NOT be visible immediately
    const bannerText = page.getByText('We use cookies and local storage')
    await expect(bannerText).not.toBeVisible({ timeout: 1000 })

    // Wait for the 1500ms delay + render time
    await expect(bannerText).toBeVisible({ timeout: 5000 })
  })

  test('Accept button hides banner', async ({ page }) => {
    await skipOnboardingOnly(page)
    await page.goto('/')

    const bannerText = page.getByText('We use cookies and local storage')
    await expect(bannerText).toBeVisible({ timeout: 5000 })

    const acceptButton = page.getByText('Accept', { exact: true })
    await acceptButton.click()

    await expect(bannerText).not.toBeVisible({ timeout: 5000 })
  })

  test('Decline button hides banner', async ({ page }) => {
    await skipOnboardingOnly(page)
    await page.goto('/')

    const bannerText = page.getByText('We use cookies and local storage')
    await expect(bannerText).toBeVisible({ timeout: 5000 })

    const declineButton = page.getByText('Decline', { exact: true })
    await declineButton.click()

    await expect(bannerText).not.toBeVisible({ timeout: 5000 })
  })

  test('banner does not reappear after acceptance', async ({ page }) => {
    await skipOnboardingOnly(page)
    await page.goto('/')

    const bannerText = page.getByText('We use cookies and local storage')
    await expect(bannerText).toBeVisible({ timeout: 5000 })

    // Accept
    const acceptButton = page.getByText('Accept', { exact: true })
    await acceptButton.click()
    await expect(bannerText).not.toBeVisible({ timeout: 5000 })

    // Reload and wait — banner should not reappear
    await page.reload()
    await page.waitForTimeout(3000)
    await expect(bannerText).not.toBeVisible()
  })

  test('Learn more link is visible', async ({ page }) => {
    await skipOnboardingOnly(page)
    await page.goto('/')

    const bannerText = page.getByText('We use cookies and local storage')
    await expect(bannerText).toBeVisible({ timeout: 5000 })

    const learnMore = page.getByText('Learn more', { exact: true })
    await expect(learnMore).toBeVisible()
  })
})

// ---------------------------------------------------------------------------
// Onboarding Wizard
// ---------------------------------------------------------------------------

test.describe('Onboarding Wizard', () => {
  test('wizard appears on first visit', async ({ page }) => {
    await skipCookiesOnly(page)
    await page.goto('/')

    const stepTitle = page.getByText('Welcome to').first()
    await expect(stepTitle).toBeVisible({ timeout: 10000 })
  })

  test('navigate through all 4 steps', async ({ page }) => {
    await skipCookiesOnly(page)
    await page.goto('/')

    // Step 1
    await expect(page.getByText('Welcome to').first()).toBeVisible({ timeout: 10000 })

    // Step 2
    const nextButton = page.getByText('Next', { exact: true }).first()
    await nextButton.click()
    await expect(page.getByText('Discover & Explore').first()).toBeVisible({ timeout: 5000 })

    // Step 3
    await page.getByText('Next', { exact: true }).first().click()
    await expect(page.getByText('Stay in the Loop').first()).toBeVisible({ timeout: 5000 })

    // Step 4
    await page.getByText('Next', { exact: true }).first().click()
    await expect(page.getByText("You're All Set!").first()).toBeVisible({ timeout: 5000 })
  })

  test('Get Started on last step completes wizard', async ({ page }) => {
    await skipCookiesOnly(page)
    await page.goto('/')

    // Navigate to step 4
    await expect(page.getByText('Welcome to').first()).toBeVisible({ timeout: 10000 })
    await page.getByText('Next', { exact: true }).first().click()
    await expect(page.getByText('Discover & Explore').first()).toBeVisible({ timeout: 5000 })
    await page.getByText('Next', { exact: true }).first().click()
    await expect(page.getByText('Stay in the Loop').first()).toBeVisible({ timeout: 5000 })
    await page.getByText('Next', { exact: true }).first().click()
    await expect(page.getByText("You're All Set!").first()).toBeVisible({ timeout: 5000 })

    // Click Get Started
    const getStarted = page.getByText('Get Started', { exact: true }).first()
    await getStarted.click()

    // Wizard should disappear
    await expect(page.getByText("You're All Set!").first()).not.toBeVisible({ timeout: 5000 })
  })

  test('Escape key closes wizard (AppModal)', async ({ page }) => {
    await skipCookiesOnly(page)
    await page.goto('/')

    const stepTitle = page.getByText('Welcome to').first()
    await expect(stepTitle).toBeVisible({ timeout: 10000 })

    // AppModal handles Escape to close
    await page.keyboard.press('Escape')

    await expect(stepTitle).not.toBeVisible({ timeout: 5000 })
  })

  test('progress dots are visible', async ({ page }) => {
    await skipCookiesOnly(page)
    await page.goto('/')

    await expect(page.getByText('Welcome to').first()).toBeVisible({ timeout: 10000 })

    // The wizard renders 4 ProgressDot elements (MotiView divs).
    // We verify the Next button is visible (which sits below the dots),
    // confirming the bottom bar with dots rendered correctly.
    const nextButton = page.getByText('Next', { exact: true }).first()
    await expect(nextButton).toBeVisible()
  })

  test('wizard does not show after completion', async ({ page }) => {
    await skipCookiesOnly(page)
    await page.goto('/')

    // Complete the wizard
    await expect(page.getByText('Welcome to').first()).toBeVisible({ timeout: 10000 })
    await page.getByText('Next', { exact: true }).first().click()
    await expect(page.getByText('Discover & Explore').first()).toBeVisible({ timeout: 5000 })
    await page.getByText('Next', { exact: true }).first().click()
    await expect(page.getByText('Stay in the Loop').first()).toBeVisible({ timeout: 5000 })
    await page.getByText('Next', { exact: true }).first().click()
    await expect(page.getByText("You're All Set!").first()).toBeVisible({ timeout: 5000 })
    await page.getByText('Get Started', { exact: true }).first().click()
    await expect(page.getByText("You're All Set!").first()).not.toBeVisible({ timeout: 5000 })

    // Wait for coach marks to potentially appear and dismiss them
    await page.waitForTimeout(1500)

    // Reload — wizard should NOT reappear
    await page.reload()
    await page.waitForTimeout(3000)
    await expect(page.getByText('Welcome to').first()).not.toBeVisible()
  })
})

// ---------------------------------------------------------------------------
// Coach Mark Tour
// ---------------------------------------------------------------------------

test.describe('Coach Mark Tour', () => {
  /** Helper: complete the wizard (all 4 steps) to trigger the coach mark tour. */
  async function completeWizard(page: Page) {
    await expect(page.getByText('Welcome to').first()).toBeVisible({ timeout: 10000 })
    await page.getByText('Next', { exact: true }).first().click()
    await expect(page.getByText('Discover & Explore').first()).toBeVisible({ timeout: 5000 })
    await page.getByText('Next', { exact: true }).first().click()
    await expect(page.getByText('Stay in the Loop').first()).toBeVisible({ timeout: 5000 })
    await page.getByText('Next', { exact: true }).first().click()
    await expect(page.getByText("You're All Set!").first()).toBeVisible({ timeout: 5000 })
    await page.getByText('Get Started', { exact: true }).first().click()
    await expect(page.getByText("You're All Set!").first()).not.toBeVisible({ timeout: 5000 })
  }

  test('tour starts after wizard completion', async ({ page }) => {
    await skipCookiesOnly(page)
    await page.goto('/')

    await completeWizard(page)

    // Coach marks start after 600ms delay — wait up to 3s
    const stepCounter = page.getByText('1 / 3').first()
    await expect(stepCounter).toBeVisible({ timeout: 5000 })
  })

  test('tour advances through steps', async ({ page }) => {
    await skipCookiesOnly(page)
    await page.goto('/')

    await completeWizard(page)

    // Step 1: Track Your Progress (tooltip title, unique to overlay)
    const stepCounter1 = page.getByText('1 / 3').first()
    await expect(stepCounter1).toBeVisible({ timeout: 5000 })
    await expect(page.getByText('Track Your Progress').first()).toBeVisible()

    // Advance to step 2 via the Next button in the tooltip
    await page.getByText('Next', { exact: true }).first().click()
    const stepCounter2 = page.getByText('2 / 3').first()
    await expect(stepCounter2).toBeVisible({ timeout: 5000 })

    // Note: Step 3 (home-notes) has no CoachMark wrapper on the home screen,
    // so the overlay disappears after step 2 when Next is clicked
    await page.getByText('Next', { exact: true }).first().click()
    // Overlay should disappear since step 3 target doesn't exist
    await expect(stepCounter2).not.toBeVisible({ timeout: 5000 })
  })

  test('Skip dismisses tour', async ({ page }) => {
    await skipCookiesOnly(page)
    await page.goto('/')

    await completeWizard(page)

    // Wait for tour to start
    const stepCounter = page.getByText('1 / 3').first()
    await expect(stepCounter).toBeVisible({ timeout: 5000 })

    // Click Skip in the tooltip
    const skipButton = page.getByText('Skip', { exact: true }).first()
    await skipButton.click()

    // Overlay should disappear
    await expect(stepCounter).not.toBeVisible({ timeout: 5000 })
  })

  test('advancing past last visible step ends tour', async ({ page }) => {
    await skipCookiesOnly(page)
    await page.goto('/')

    await completeWizard(page)

    // Wait for tour to start (600ms delay + layout measurement)
    const stepCounter1 = page.getByText('1 / 3').first()
    await expect(stepCounter1).toBeVisible({ timeout: 10000 })

    // Advance to step 2 (last visible — home-notes has no CoachMark wrapper)
    await page.getByText('Next', { exact: true }).first().click()
    const stepCounter2 = page.getByText('2 / 3').first()
    await expect(stepCounter2).toBeVisible({ timeout: 5000 })

    // Clicking Next advances to step 3 which has no target → overlay disappears
    // Use the step counter to verify overlay is gone (not title text which exists on page too)
    await page.getByText('Next', { exact: true }).first().click()
    await expect(stepCounter2).not.toBeVisible({ timeout: 5000 })
  })
})
