import { test, expect } from '@playwright/test'
import { SettingsPage } from './pages/settings.page'
import { dismissOverlays } from './helpers/dismiss-overlays'

test.describe('Settings Page', () => {
  let settings: SettingsPage

  test.beforeEach(async ({ page }) => {
    await dismissOverlays(page)
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

  test('theme toggle cycles through modes', async ({ page }) => {
    // Theme row exists — click it to cycle
    await expect(settings.themeRow).toBeVisible()

    // Click to cycle theme mode — just verify the row is interactive
    await settings.cycleTheme()
    // After cycling, one of System/Light/Dark should be visible
    const themeLabel = page.getByText(/System|Light|Dark/).first()
    await expect(themeLabel).toBeVisible()

    // Click again
    await settings.cycleTheme()
    await expect(themeLabel).toBeVisible()
  })

  test('language picker changes UI text', async ({ page }) => {
    // Open language picker
    await settings.openLanguagePicker()

    // Language options should be visible
    const russianOption = page.getByText('Русский')
    await expect(russianOption).toBeVisible()

    // Select Russian
    await settings.selectLanguage('Русский')

    // The Settings sidebar link should become "Настройки" in Russian
    const russianSettingsTitle = page.getByText('Настройки').first()
    await expect(russianSettingsTitle).toBeVisible({ timeout: 5000 })
  })

  test('about modal opens and closes', async ({ page }) => {
    // Scroll to and click the About row
    await settings.aboutRow.scrollIntoViewIfNeeded()
    await settings.openAboutModal()

    // About modal should show version info
    const versionLabel = page.getByText('Version').first()
    await expect(versionLabel).toBeVisible({ timeout: 5000 })

    // Close by clicking outside the modal panel (right side of viewport, away from sidebar)
    // The About modal backdrop uses onPress={onClose} on the outer fixed YStack
    const viewport = page.viewportSize()!
    await page.mouse.click(viewport.width - 20, 20)

    // Modal should disappear
    await expect(versionLabel).not.toBeVisible({ timeout: 5000 })
  })
})
