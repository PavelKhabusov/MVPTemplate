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
    this.signInButton = page.getByRole('button', { name: 'Sign In' })
    this.createAccountButton = page.getByRole('button', { name: 'Create Account' })

    // Theme row shows current theme value (System/Light/Dark)
    this.themeRow = page.getByText('Theme').first()
    this.languageRow = page.getByText('Language').first()

    // About row
    this.aboutRow = page.getByText('About').first()

    // Close button inside About modal overlay
    this.aboutModalCloseButton = page.locator('[style*="position: fixed"] [role="button"]').first()
  }

  async goto() {
    await this.page.goto('/settings')
    await this.page.waitForLoadState('networkidle')
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
    // The modal overlay covers the whole screen; click the outer overlay
    // Use position: fixed element as the backdrop
    const backdrop = this.page.locator('[style*="position: fixed"][style*="rgba(0,0,0,0.5)"]')
    // Click in the corner (outside the modal card) to close
    await backdrop.click({ position: { x: 10, y: 10 } })
  }
}
