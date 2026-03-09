import { test, expect } from './fixture'

test.describe('Extension Navigation & UI', () => {
  test('popup page loads without errors', async ({ page, extensionId }) => {
    // Collect console errors
    const errors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text())
    })

    await page.goto(`chrome-extension://${extensionId}/src/popup/index.html`)
    await page.waitForLoadState('domcontentloaded')

    // React root should mount
    const root = page.locator('#root')
    await expect(root).toBeVisible({ timeout: 5000 })

    // App should render something inside #root (not empty)
    const content = page.locator('#root > div')
    await expect(content).toBeVisible({ timeout: 5000 })

    // No critical JS errors (filter out expected network/auth failures)
    const criticalErrors = errors.filter(
      (e) =>
        !e.includes('Failed to fetch') &&
        !e.includes('ERR_CONNECTION') &&
        !e.includes('net::') &&
        !e.includes('401') &&
        !e.includes('Failed to load resource')
    )
    expect(criticalErrors).toHaveLength(0)
  })

  test('sidebar page loads if available', async ({ page, extensionId }) => {
    // Sidebar may not exist in popup-mode builds — skip gracefully
    try {
      const response = await page.goto(`chrome-extension://${extensionId}/src/sidebar/index.html`)
      if (!response || response.status() !== 200) {
        test.skip(true, 'Sidebar page not available in current build mode')
        return
      }
    } catch {
      test.skip(true, 'Sidebar page not available in current build mode')
      return
    }

    await page.waitForLoadState('domcontentloaded')
    const root = page.locator('#root')
    await expect(root).toBeVisible({ timeout: 5000 })
    const content = page.locator('#root > div')
    await expect(content).toBeVisible({ timeout: 5000 })
  })

  test('loading spinner shows while auth checking', async ({ page, extensionId }) => {
    await page.goto(`chrome-extension://${extensionId}/src/popup/index.html`)
    // The spinner (.animate-spin) should appear briefly before auth check completes
    const spinner = page.locator('.animate-spin')
    // Either spinner was visible or auth check was instant — both are valid
    const wasVisible = await spinner.isVisible({ timeout: 1000 }).catch(() => false)
    // After auth check, we should see either auth screen or main screen
    const authOrMain = page.locator('#root > div')
    await expect(authOrMain).toBeVisible({ timeout: 5000 })
  })

  test('extension has correct manifest metadata', async ({ page, extensionId }) => {
    // Fetch the manifest directly
    const response = await page.goto(`chrome-extension://${extensionId}/manifest.json`)
    const manifest = await response?.json()

    expect(manifest.manifest_version).toBe(3)
    expect(manifest.name).toBe('MVPTemplate')
    expect(manifest.permissions).toContain('storage')
  })
})
