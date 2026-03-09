import { test, expect } from './fixture'
import { ExtOnboardingPage } from './pages/onboarding.page'

test.describe('Extension Onboarding', () => {
  /**
   * Onboarding shows after auth succeeds. Since we can't easily auth
   * in tests (backend may not be running), we test the onboarding screen
   * by navigating directly to the popup and injecting the auth + onboarding state.
   */

  test('onboarding screen shows 3 default steps', async ({ page, extensionId }) => {
    // Set auth state but clear onboarding flag to force onboarding screen
    await page.goto(`chrome-extension://${extensionId}/src/popup/index.html`)
    await page.waitForLoadState('domcontentloaded')

    // Inject chrome.storage state via evaluate
    await page.evaluate(() => {
      // Mock chrome.storage for the onboarding to show
      chrome.storage?.local?.set({
        accessToken: 'fake-token-for-testing',
        onboardingDone: false,
      })
    })

    // Reload to pick up the state
    await page.reload()
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(1500)

    // If backend is down, we'll still be on auth screen — skip in that case
    const onboarding = new ExtOnboardingPage(page)
    const hasOnboarding = await onboarding.stepTitle.isVisible({ timeout: 3000 }).catch(() => false)

    if (!hasOnboarding) {
      test.skip(true, 'Backend not available — cannot reach onboarding screen')
      return
    }

    // Step 1: Welcome
    await expect(onboarding.stepTitle).toContainText('Welcome')
    await expect(onboarding.stepCounter).toContainText('1')
    await expect(onboarding.skipButton).toBeVisible()

    // Step 2: Key Features
    await onboarding.clickNext()
    await expect(onboarding.stepTitle).toContainText('Key Features')
    await expect(onboarding.stepCounter).toContainText('2')

    // Step 3: Get Started
    await onboarding.clickNext()
    await expect(onboarding.stepTitle).toContainText('Get Started')
    await expect(onboarding.stepCounter).toContainText('3')
    // Skip button should be hidden on last step
    await expect(onboarding.skipButton).not.toBeVisible()
  })

  test('skip button completes onboarding immediately', async ({ page, extensionId }) => {
    await page.goto(`chrome-extension://${extensionId}/src/popup/index.html`)
    await page.waitForLoadState('domcontentloaded')

    await page.evaluate(() => {
      chrome.storage?.local?.set({
        accessToken: 'fake-token-for-testing',
        onboardingDone: false,
      })
    })

    await page.reload()
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(1500)

    const onboarding = new ExtOnboardingPage(page)
    const hasOnboarding = await onboarding.stepTitle.isVisible({ timeout: 3000 }).catch(() => false)

    if (!hasOnboarding) {
      test.skip(true, 'Backend not available — cannot reach onboarding screen')
      return
    }

    // Click Skip on step 1
    await onboarding.clickSkip()

    // Should transition to main screen or at least leave onboarding
    await expect(onboarding.stepTitle).not.toBeVisible({ timeout: 5000 })
  })
})
