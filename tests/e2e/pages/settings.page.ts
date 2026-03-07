import { type Page, type Locator } from '@playwright/test'

/**
 * Page Object Model for the Settings page.
 * On web, both authenticated and unauthenticated states use WebSettingsView.
 */
export class SettingsPage {
  readonly page: Page

  // Sign in prompt (unauthenticated)
  readonly signInPromptText: Locator
  readonly signInButton: Locator
  readonly createAccountButton: Locator

  // Appearance section
  readonly themeRow: Locator
  readonly languageRow: Locator

  // General section
  readonly aboutRow: Locator

  // About modal
  readonly aboutModalCloseButton: Locator

  constructor(page: Page) {
    this.page = page

    // Unauthenticated state shows sign in prompt
    this.signInPromptText = page.getByText('Sign in to view your profile and access all features')
    // RNW renders AppButton as <div>, not <button> — use text
    this.signInButton = page.getByText('Sign In', { exact: true }).first()
    this.createAccountButton = page.getByText('Create Account', { exact: true }).first()

    // Theme row shows current theme value (System/Light/Dark)
    this.themeRow = page.getByText('Theme').first()
    this.languageRow = page.getByText('Language').first()

    // About row
    this.aboutRow = page.getByText('About').first()

    // Close button inside About modal overlay
    this.aboutModalCloseButton = page.locator('[style*="position: fixed"] [role="button"]').first()
  }

  async goto() {
    // Expo Router web: try both URL patterns
    await this.page.goto('/')
    await this.page.waitForLoadState('domcontentloaded')
    // Navigate via sidebar/tab to settings, or go directly
    const settingsLink = this.page.getByText('Settings').first()
    try {
      await settingsLink.click({ timeout: 5000 })
    } catch {
      // Fallback: direct navigation
      await this.page.goto('/(tabs)/settings')
      await this.page.waitForLoadState('domcontentloaded')
    }
    await this.page.waitForSelector('text=Theme', { timeout: 15000 })
  }

  /**
   * Get the current theme label text displayed in the theme row.
   */
  async getThemeValue(): Promise<string> {
    // The theme value (System/Light/Dark) is rendered next to the Theme label
    const themeValueLocator = this.page.getByText(/^(System|Light|Dark)$/).first()
    return themeValueLocator.textContent() as Promise<string>
  }

  /**
   * Click the theme row to cycle through theme modes.
   */
  async cycleTheme() {
    await this.themeRow.click()
  }

  /**
   * Click the language row to open the language picker.
   */
  async openLanguagePicker() {
    await this.languageRow.click()
  }

  /**
   * Select a language from the picker.
   */
  async selectLanguage(label: string) {
    await this.page.getByText(label).click()
  }

  /**
   * Open the About modal.
   */
  async openAboutModal() {
    await this.aboutRow.click()
  }

  /**
   * Check if About modal is visible by looking for the version text.
   */
  async isAboutModalVisible(): Promise<boolean> {
    // About modal shows "Version" label
    const versionLabel = this.page.getByText('Version').last()
    return versionLabel.isVisible()
  }

  /**
   * Close the About modal by clicking the backdrop (overlay).
   */
  async closeAboutModalByBackdrop() {
    // Click outside the modal content area — top-left corner of viewport
    await this.page.mouse.click(10, 10)
  }
}
