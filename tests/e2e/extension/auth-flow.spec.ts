import { test, expect, MOCK_USER } from './fixture-auth'
import { test as unauthTest, expect as unauthExpect } from './fixture'

test.describe('Extension Full Auth Flow (Mocked Backend)', () => {
  test('login via form navigates to main screen', async ({ context, extensionId }) => {
    const page = await context.newPage()

    // Mock API
    await page.route('**/api/config/flags', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: { googleAuth: false, payments: false, email: false } }),
      })
    )
    await page.route('**/api/auth/login', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            accessToken: 'mock-token',
            refreshToken: 'mock-refresh',
            userId: 'user-1',
          },
        }),
      })
    )
    await page.route('**/api/auth/me', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: MOCK_USER }),
      })
    )
    await page.route('**/api/payments/subscription', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: null }),
      })
    )

    // Clear any existing auth state
    await page.goto(`chrome-extension://${extensionId}/src/popup/index.html`)
    await page.waitForLoadState('domcontentloaded')
    await page.evaluate(() => {
      chrome.storage?.local?.remove(['accessToken', 'refreshToken', 'onboardingDone'])
    })
    await page.reload()
    await page.waitForSelector('#root > div', { timeout: 10000 })

    // Should see welcome screen
    const signInBtn = page.locator('button', { hasText: /Sign In|Войти/ }).first()
    await expect(signInBtn).toBeVisible({ timeout: 5000 })

    // Click to go to form
    await signInBtn.click()

    // Fill credentials
    const emailInput = page.locator('input[type="email"]')
    const passwordInput = page.locator('input[type="password"]')
    await expect(emailInput).toBeVisible({ timeout: 3000 })
    await emailInput.fill('test@example.com')
    await passwordInput.fill('password123')

    // Submit
    await page.locator('button.bg-gradient-to-br.from-brand').first().click()

    // Should show success checkmark then transition to onboarding or main
    const successOrMain = page.locator('.text-success, button:has-text("Settings"), button:has-text("Next")')
    await expect(successOrMain.first()).toBeVisible({ timeout: 5000 })

    await page.close()
  })

  test('register via form shows success', async ({ context, extensionId }) => {
    const page = await context.newPage()

    // Mock API
    await page.route('**/api/config/flags', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: { googleAuth: false, payments: false, email: false } }),
      })
    )
    await page.route('**/api/auth/register', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            accessToken: 'mock-token',
            refreshToken: 'mock-refresh',
            userId: 'user-1',
          },
        }),
      })
    )
    await page.route('**/api/auth/me', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: MOCK_USER }),
      })
    )
    await page.route('**/api/payments/subscription', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: null }),
      })
    )

    // Clear auth
    await page.goto(`chrome-extension://${extensionId}/src/popup/index.html`)
    await page.waitForLoadState('domcontentloaded')
    await page.evaluate(() => {
      chrome.storage?.local?.remove(['accessToken', 'refreshToken', 'onboardingDone'])
    })
    await page.reload()
    await page.waitForSelector('#root > div', { timeout: 10000 })

    // Welcome → Form
    const signInBtn = page.locator('button', { hasText: /Sign In|Войти/ }).first()
    await signInBtn.click()

    // Toggle to Register mode
    const toggleLink = page.locator('button.bg-transparent.text-brand').first()
    await toggleLink.click()

    // Fill
    await page.locator('input[type="email"]').fill('new@example.com')
    await page.locator('input[type="password"]').fill('password123')

    // Submit
    await page.locator('button.bg-gradient-to-br.from-brand').first().click()

    // Should show success
    const successOrMain = page.locator('.text-success, button:has-text("Settings"), button:has-text("Next")')
    await expect(successOrMain.first()).toBeVisible({ timeout: 5000 })

    await page.close()
  })
})

unauthTest.describe('Extension Auth Error Handling', () => {
  unauthTest('server error shows appropriate message', async ({ page, extensionId }) => {
    // Mock login to return 500
    await page.route('**/api/auth/login', (route) =>
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' }),
      })
    )
    await page.route('**/api/config/flags', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: { googleAuth: false, payments: false, email: false } }),
      })
    )

    await page.goto(`chrome-extension://${extensionId}/src/popup/index.html`)
    await page.waitForSelector('#root > div', { timeout: 10000 })

    // Go to form
    const signInBtn = page.locator('button', { hasText: /Sign In|Войти/ }).first()
    await signInBtn.click()

    // Fill and submit
    await page.locator('input[type="email"]').fill('test@example.com')
    await page.locator('input[type="password"]').fill('password')
    await page.locator('button.bg-gradient-to-br.from-brand').first().click()

    // Should show error
    const error = page.locator('.text-error')
    await unauthExpect(error).toBeVisible({ timeout: 5000 })
  })

  unauthTest('409 conflict shows email exists error', async ({ page, extensionId }) => {
    await page.route('**/api/auth/register', (route) =>
      route.fulfill({
        status: 409,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'User with this email already exists' }),
      })
    )
    await page.route('**/api/config/flags', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: { googleAuth: false, payments: false, email: false } }),
      })
    )

    await page.goto(`chrome-extension://${extensionId}/src/popup/index.html`)
    await page.waitForSelector('#root > div', { timeout: 10000 })

    // Go to form and switch to register
    await page.locator('button', { hasText: /Sign In|Войти/ }).first().click()
    await page.locator('button.bg-transparent.text-brand').first().click()

    // Fill and submit
    await page.locator('input[type="email"]').fill('existing@example.com')
    await page.locator('input[type="password"]').fill('password123')
    await page.locator('button.bg-gradient-to-br.from-brand').first().click()

    // Should show email exists error
    const error = page.locator('.text-error')
    await unauthExpect(error).toBeVisible({ timeout: 5000 })
  })
})
