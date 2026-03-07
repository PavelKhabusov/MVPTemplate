import { test, expect } from '@playwright/test'
import { SettingsPage } from './pages/settings.page'

test.describe('Settings Page', () => {
  let settings: SettingsPage

  test.beforeEach(async ({ page }) => {
    settings = new SettingsPage(page)
    await settings.goto()
  })

  test('settings page renders for unauthenticated user', async () => {
    // Unauthenticated user sees sign-in prompt
    await expect(settings.signInPromptText).toBeVisible()
    await expect(settings.signInButton).toBeVisible()
    await expect(settings.createAccountButton).toBeVisible()

    // Appearance section is still visible
    await expect(settings.themeRow).toBeVisible()
    await expect(settings.languageRow).toBeVisible()
  })

  test('theme toggle cycles through System -> Light -> Dark', async ({ page }) => {
    // Initial theme should be "System" (default)
    const systemText = page.getByText('System').first()
    await expect(systemText).toBeVisible()

    // Click theme row to cycle to Light
    await settings.cycleTheme()
    const lightText = page.getByText('Light').first()
    await expect(lightText).toBeVisible()

    // Click again to cycle to Dark
    await settings.cycleTheme()
    const darkText = page.getByText('Dark').first()
    await expect(darkText).toBeVisible()
  })

  test('language picker changes UI text', async ({ page }) => {
    // Open language picker
    await settings.openLanguagePicker()

    // Language options should be visible
    const russianOption = page.getByText('Русский')
    await expect(russianOption).toBeVisible()

    // Select Russian
    await settings.selectLanguage('Русский')

    // The UI text should switch to Russian.
    // "Theme" in Russian locale translates to a Russian string.
    // The Settings title "Settings" becomes "Настройки" in Russian.
    const russianSettingsTitle = page.getByText('Настройки')
    await expect(russianSettingsTitle).toBeVisible({ timeout: 5000 })

    // Switch back to English so we don't affect other tests
    // Re-find language row (now in Russian)
    const languageRow = page.getByText('Язык').first()
    await languageRow.click()
    await settings.selectLanguage('English')
  })

  test('about modal opens and closes', async ({ page }) => {
    // Scroll to and click the About row
    await settings.aboutRow.scrollIntoViewIfNeeded()
    await settings.openAboutModal()

    // About modal should show version info
    const isVisible = await settings.isAboutModalVisible()
    expect(isVisible).toBe(true)

    // Close by clicking the backdrop
    await settings.closeAboutModalByBackdrop()

    // Modal should disappear
    // Wait a moment for animation
    await page.waitForTimeout(300)
    const versionLabel = page.getByText('Version').last()
    await expect(versionLabel).not.toBeVisible({ timeout: 3000 })
  })
})
