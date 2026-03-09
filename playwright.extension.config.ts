import { defineConfig } from '@playwright/test'

/**
 * Playwright config for Chrome extension E2E tests.
 *
 * Extensions require a real Chromium instance (--headless=new).
 * No web server needed — tests load extension pages directly.
 *
 * Usage:
 *   npx playwright test --config=playwright.extension.config.ts
 */
export default defineConfig({
  testDir: './tests/e2e/extension',
  timeout: 30000,
  retries: 1,
  expect: { timeout: 5000 },
  use: {
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
    actionTimeout: 10000,
  },
  // Only chromium supports extensions
  projects: [
    {
      name: 'extension',
      use: { browserName: 'chromium' },
    },
  ],
})
