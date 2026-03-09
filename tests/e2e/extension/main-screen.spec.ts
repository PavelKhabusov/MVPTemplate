import { test, expect, MOCK_USER, MOCK_SUBSCRIPTION } from './fixture-auth'

test.describe('Extension Main Screen (Authenticated)', () => {
  test('main screen shows brand name in header', async ({ authedPage: page }) => {
    const brand = page.locator('.text-sm.font-semibold')
    await expect(brand).toContainText('MVPTemplate')
  })

  test('tab bar shows Home and Settings tabs', async ({ authedPage: page }) => {
    const homeTab = page.locator('button', { hasText: 'Home' })
    const settingsTab = page.locator('button', { hasText: 'Settings' })

    await expect(homeTab).toBeVisible()
    await expect(settingsTab).toBeVisible()
  })

  test('Home tab is active by default', async ({ authedPage: page }) => {
    const homeTab = page.locator('button', { hasText: 'Home' })
    // Active tab has text-brand class
    await expect(homeTab).toHaveClass(/text-brand/)
  })

  test('subscription badge shows Pro plan', async ({ authedPage: page }) => {
    // Payments are enabled in mock flags + active subscription
    const badge = page.locator('.rounded-full', { hasText: 'Pro' })
    await expect(badge).toBeVisible({ timeout: 5000 })
  })

  test('switching to Settings tab shows settings content', async ({ authedPage: page }) => {
    await page.locator('button', { hasText: 'Settings' }).click()

    // Theme section should appear
    const themeLabel = page.locator('text=Theme').first()
    await expect(themeLabel).toBeVisible({ timeout: 3000 })

    // Language section should appear
    const langLabel = page.locator('text=Language').first()
    await expect(langLabel).toBeVisible()
  })

  test('switching back to Home tab works', async ({ authedPage: page }) => {
    // Go to Settings
    await page.locator('button', { hasText: 'Settings' }).click()
    await expect(page.locator('text=Theme').first()).toBeVisible({ timeout: 3000 })

    // Go back to Home
    await page.locator('button', { hasText: 'Home' }).click()

    // Home tab should be active again
    const homeTab = page.locator('button', { hasText: 'Home' })
    await expect(homeTab).toHaveClass(/text-brand/)
  })
})

test.describe('Extension Settings Tab (Authenticated)', () => {
  test.beforeEach(async ({ authedPage: page }) => {
    // Navigate to Settings tab
    await page.locator('button', { hasText: 'Settings' }).click()
    await page.waitForSelector('text=Theme', { timeout: 5000 })
  })

  test('user badge shows name and email', async ({ authedPage: page }) => {
    const name = page.locator('.truncate', { hasText: MOCK_USER.name })
    const email = page.locator('.truncate', { hasText: MOCK_USER.email })

    await expect(name).toBeVisible()
    await expect(email).toBeVisible()
  })

  test('user avatar shows first letter of name', async ({ authedPage: page }) => {
    const avatar = page.locator('.rounded-full.bg-brand\\/15')
    await expect(avatar).toContainText('T') // "Test User" → "T"
  })

  test('theme buttons show System, Light, Dark', async ({ authedPage: page }) => {
    await expect(page.locator('button', { hasText: 'System' })).toBeVisible()
    await expect(page.locator('button', { hasText: 'Light' })).toBeVisible()
    await expect(page.locator('button', { hasText: 'Dark' })).toBeVisible()
  })

  test('clicking Light theme activates it', async ({ authedPage: page }) => {
    const lightBtn = page.locator('button', { hasText: 'Light' })
    await lightBtn.click()
    await expect(lightBtn).toHaveClass(/text-brand/)
  })

  test('clicking Dark theme activates it', async ({ authedPage: page }) => {
    const darkBtn = page.locator('button', { hasText: 'Dark' })
    await darkBtn.click()
    await expect(darkBtn).toHaveClass(/text-brand/)
  })

  test('language buttons show EN, RU, ES, JA', async ({ authedPage: page }) => {
    for (const lang of ['EN', 'RU', 'ES', 'JA']) {
      await expect(page.locator('button', { hasText: lang }).last()).toBeVisible()
    }
  })

  test('switching language to RU changes labels', async ({ authedPage: page }) => {
    // Click RU
    await page.locator('button', { hasText: 'RU' }).last().click()
    await page.waitForTimeout(500)

    // Theme label should change to Russian
    await expect(page.locator('text=Тема').first()).toBeVisible({ timeout: 3000 })
    // Language label should change
    await expect(page.locator('text=Язык').first()).toBeVisible()

    // Tab bar should also update
    await expect(page.locator('button', { hasText: 'Настройки' })).toBeVisible()
  })

  test('switching language to ES changes labels', async ({ authedPage: page }) => {
    await page.locator('button', { hasText: 'ES' }).last().click()
    await page.waitForTimeout(500)

    await expect(page.locator('text=Tema').first()).toBeVisible({ timeout: 3000 })
    await expect(page.locator('text=Idioma').first()).toBeVisible()
    await expect(page.locator('button', { hasText: 'Ajustes' })).toBeVisible()
  })

  test('switching language to JA changes labels', async ({ authedPage: page }) => {
    await page.locator('button', { hasText: 'JA' }).last().click()
    await page.waitForTimeout(500)

    await expect(page.locator('text=テーマ').first()).toBeVisible({ timeout: 3000 })
    await expect(page.locator('text=言語').first()).toBeVisible()
    await expect(page.locator('button', { hasText: '設定' })).toBeVisible()
  })

  test('open in app link points to localhost:8081', async ({ authedPage: page }) => {
    const link = page.locator('a[href="http://localhost:8081"]')
    await expect(link).toBeVisible()
  })

  test('logout button is visible with red styling', async ({ authedPage: page }) => {
    const logoutBtn = page.locator('button.text-error')
    await expect(logoutBtn).toBeVisible()
    await expect(logoutBtn).toContainText(/Sign Out|Выход/)
  })
})

test.describe('Extension Logout Flow', () => {
  test('clicking logout returns to auth screen', async ({ authedPage: page }) => {
    // Go to Settings
    await page.locator('button', { hasText: 'Settings' }).click()
    await page.waitForSelector('text=Theme', { timeout: 5000 })

    // Click logout
    const logoutBtn = page.locator('button.text-error')
    await logoutBtn.click()

    // Should return to auth/welcome screen
    // The welcome screen shows the brand name in large text and a sign-in button
    const signInBtn = page.locator('button', { hasText: /Sign In|Войти/ }).first()
    await expect(signInBtn).toBeVisible({ timeout: 5000 })
  })
})
