import { type Page, type Locator } from '@playwright/test'

/**
 * Page Object for the extension Auth screen.
 * Handles welcome → form → done flow.
 */
export class ExtAuthPage {
  readonly page: Page

  // Welcome step
  readonly brandName: Locator
  readonly signInOrRegisterButton: Locator

  // Form step
  readonly formTitle: Locator
  readonly emailInput: Locator
  readonly passwordInput: Locator
  readonly submitButton: Locator
  readonly toggleModeLink: Locator
  readonly errorMessage: Locator

  // Done step
  readonly successMessage: Locator

  // Bottom controls
  readonly themeToggleButton: Locator
  readonly langButtons: Record<string, Locator>

  constructor(page: Page) {
    this.page = page

    // Welcome
    this.brandName = page.locator('.text-\\[22px\\]')
    this.signInOrRegisterButton = page.locator('button', { hasText: /Sign In|Войти/ }).first()

    // Form
    this.formTitle = page.locator('.text-\\[17px\\]').first()
    this.emailInput = page.locator('input[type="email"]')
    this.passwordInput = page.locator('input[type="password"]')
    this.submitButton = page.locator('button.bg-gradient-to-br.from-brand').first()
    this.toggleModeLink = page.locator('button.bg-transparent.text-brand').first()
    this.errorMessage = page.locator('.text-error')

    // Done
    this.successMessage = page.locator('.text-success')

    // Bottom controls
    this.themeToggleButton = page.locator('button:has(svg)').last()
    this.langButtons = {
      en: page.locator('button', { hasText: 'EN' }),
      ru: page.locator('button', { hasText: 'RU' }),
      es: page.locator('button', { hasText: 'ES' }),
      ja: page.locator('button', { hasText: 'JA' }),
    }
  }

  async goto(extensionId: string) {
    await this.page.goto(`chrome-extension://${extensionId}/src/popup/index.html`)
    await this.page.waitForLoadState('domcontentloaded')
    // Wait for React to render
    await this.page.waitForSelector('#root > div', { timeout: 10000 })
  }

  async clickSignInOrRegister() {
    await this.signInOrRegisterButton.click()
  }

  async fillCredentials(email: string, password: string) {
    await this.emailInput.fill(email)
    await this.passwordInput.fill(password)
  }

  async submit() {
    await this.submitButton.click()
  }

  async toggleRegisterMode() {
    await this.toggleModeLink.click()
  }

  async selectLanguage(lang: string) {
    await this.langButtons[lang].click()
  }
}
