import { test as base, chromium, type BrowserContext } from '@playwright/test'
import path from 'path'

/**
 * Custom Playwright fixture that launches Chromium with the extension loaded.
 *
 * Chrome extensions require headed mode (or --headless=new in Chromium 112+).
 * The extension ID is extracted from the service worker URL.
 */
export const test = base.extend<{
  context: BrowserContext
  extensionId: string
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
        // Use new headless mode that supports extensions
        '--headless=new',
      ],
    })
    await use(context)
    await context.close()
  },
  extensionId: async ({ context }, use) => {
    // Wait for service worker to register
    let sw = context.serviceWorkers()[0]
    if (!sw) {
      sw = await context.waitForEvent('serviceworker', { timeout: 10000 })
    }
    // Extract extension ID from service worker URL: chrome-extension://<id>/...
    const id = sw.url().split('/')[2]
    await use(id)
  },
})

export const expect = test.expect
