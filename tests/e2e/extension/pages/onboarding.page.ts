import { type Page, type Locator } from '@playwright/test'

/**
 * Page Object for the extension Onboarding screen.
 * Multi-step carousel with progress bar.
 */
export class ExtOnboardingPage {
  readonly page: Page

  readonly stepTitle: Locator
  readonly stepDescription: Locator
  readonly stepCounter: Locator
  readonly nextButton: Locator
  readonly skipButton: Locator
  readonly progressBars: Locator

  constructor(page: Page) {
    this.page = page

    this.stepTitle = page.locator('.text-\\[17px\\]')
    this.stepDescription = page.locator('.text-\\[13px\\].text-text-secondary')
    this.stepCounter = page.locator('.text-\\[10px\\].text-text-muted')
    this.nextButton = page.locator('button.bg-gradient-to-br').first()
    this.skipButton = page.locator('button', { hasText: /Skip|Пропустить|Omitir/ })
    this.progressBars = page.locator('.flex.gap-1\\.5 > div')
  }

  async clickNext() {
    await this.nextButton.click()
  }

  async clickSkip() {
    await this.skipButton.click()
  }

  async getStepNumber(): Promise<string> {
    return (await this.stepCounter.textContent()) ?? ''
  }
}
