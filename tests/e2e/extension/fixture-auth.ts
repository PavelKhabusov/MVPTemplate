import { test as base, chromium, type BrowserContext, type Page } from '@playwright/test'
import path from 'path'

/**
 * Authenticated fixture for extension tests.
 * Mocks all backend API responses and injects auth tokens into chrome.storage.
 */

const MOCK_USER = {
  id: 'user-1',
  email: 'test@example.com',
  name: 'Test User',
}

const MOCK_SUBSCRIPTION = {
  id: 'sub-1',
  planName: 'Pro',
  status: 'active',
  currentPeriodEnd: '2027-01-01T00:00:00Z',
  cancelAtPeriodEnd: false,
}

const MOCK_FLAGS = {
  googleAuth: false,
  payments: true,
  email: false,
}

/** Intercept all backend API calls with mock responses */
async function mockApi(page: Page) {
  await page.route('**/api/auth/me', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: MOCK_USER }),
    })
  )

  await page.route('**/api/auth/login', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: {
          accessToken: 'mock-access-token',
          refreshToken: 'mock-refresh-token',
          userId: MOCK_USER.id,
        },
      }),
    })
  )

  await page.route('**/api/auth/register', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: {
          accessToken: 'mock-access-token',
          refreshToken: 'mock-refresh-token',
          userId: MOCK_USER.id,
        },
      }),
    })
  )

  await page.route('**/api/auth/refresh', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: {
          accessToken: 'mock-refreshed-token',
          refreshToken: 'mock-refresh-token-2',
        },
      }),
    })
  )

  await page.route('**/api/payments/subscription', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: MOCK_SUBSCRIPTION }),
    })
  )

  await page.route('**/api/payments/plans', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: [
          { id: 'plan-1', name: 'Pro', description: 'All features', priceAmount: 999, currency: 'usd', interval: 'month', features: ['Feature 1'] },
        ],
      }),
    })
  )

  await page.route('**/api/config/flags', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: MOCK_FLAGS }),
    })
  )
}

export const test = base.extend<{
  context: BrowserContext
  extensionId: string
  authedPage: Page
}>({
  // eslint-disable-next-line no-empty-pattern
  context: async ({}, use) => {
    const extensionPath = path.resolve(__dirname, '../../../apps/extension/dist')
    const context = await chromium.launchPersistentContext('', {
      headless: false,
      args: [
        `--disable-extensions-except=${extensionPath}`,
        `--load-extension=${extensionPath}`,
        '--no-first-run',
        '--no-default-browser-check',
        '--disable-search-engine-choice-screen',
        '--headless=new',
      ],
    })
    await use(context)
    await context.close()
  },
  extensionId: async ({ context }, use) => {
    let sw = context.serviceWorkers()[0]
    if (!sw) sw = await context.waitForEvent('serviceworker', { timeout: 10000 })
    const id = sw.url().split('/')[2]
    await use(id)
  },
  authedPage: async ({ context, extensionId }, use) => {
    const page = await context.newPage()

    // Mock all API endpoints before navigating
    await mockApi(page)

    // Navigate to popup
    await page.goto(`chrome-extension://${extensionId}/src/popup/index.html`)
    await page.waitForLoadState('domcontentloaded')
    await page.waitForSelector('#root > div', { timeout: 10000 })

    // Inject auth tokens into chrome.storage to simulate logged-in state
    await page.evaluate(() => {
      chrome.storage?.local?.set({
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        onboardingDone: true,
        lang: 'en',
      })
    })

    // Reload so App.tsx reads the token and verifies via mocked /auth/me
    await page.reload()
    await page.waitForLoadState('domcontentloaded')
    await page.waitForSelector('#root > div', { timeout: 10000 })

    // Wait for main screen to appear (tab bar with Settings)
    await page.waitForSelector('button:has-text("Settings")', { timeout: 10000 })

    await use(page)
    await page.close()
  },
})

export const expect = test.expect
export { MOCK_USER, MOCK_SUBSCRIPTION }
