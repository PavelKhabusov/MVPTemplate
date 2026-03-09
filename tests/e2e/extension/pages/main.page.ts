import { type Page, type Locator } from '@playwright/test'

/**
 * Page Object for the extension Main screen (tab navigation).
 */
export class ExtMainPage {
  readonly page: Page

  // Header
  readonly brandName: Locator
  readonly subscriptionBadge: Locator

  // Tab bar
  readonly homeTab: Locator
  readonly settingsTab: Locator

  // Settings tab content
  readonly userBadge: Locator
  readonly userName: Locator
  readonly userEmail: Locator
  readonly themeSection: Locator
  readonly systemThemeButton: Locator
  readonly lightThemeButton: Locator
  readonly darkThemeButton: Locator
  readonly langSection: Locator
  readonly logoutButton: Locator

  // Home tab content
  readonly homeContent: Locator

  constructor(page: Page) {
    this.page = page

    // Header
    this.brandName = page.locator('.text-sm.font-semibold')
    this.subscriptionBadge = page.locator('.text-\\[10px\\].rounded-full')

    // Tabs — button elements in the tab bar
    this.homeTab = page.locator('button', { hasText: /Home|Главная|Inicio/ })
    this.settingsTab = page.locator('button', { hasText: /Settings|Настройки|Ajustes/ })

    // Settings tab
    this.userBadge = page.locator('.bg-bg-secondary.border.rounded-xl.p-3')
    this.userName = page.locator('.text-\\[13px\\].font-medium.truncate')
    this.userEmail = page.locator('.text-\\[11px\\].text-text-muted.truncate')
    this.themeSection = page.locator('text=Theme').first()
    this.systemThemeButton = page.locator('button', { hasText: /System|Система/ })
    this.lightThemeButton = page.locator('button', { hasText: /Light|Светлая/ })
    this.darkThemeButton = page.locator('button', { hasText: /Dark|Тёмная/ })
    this.langSection = page.locator('text=Language').first()
    this.logoutButton = page.locator('button.text-error')

    // Home tab
    this.homeContent = page.locator('.flex-1.overflow-y-auto')
  }

  async switchToHome() {
    await this.homeTab.click()
  }

  async switchToSettings() {
    await this.settingsTab.click()
  }

  async selectTheme(mode: 'system' | 'light' | 'dark') {
    const btn = mode === 'system' ? this.systemThemeButton
      : mode === 'light' ? this.lightThemeButton
      : this.darkThemeButton
    await btn.click()
  }

  async selectLanguage(lang: string) {
    await this.page.locator(`button:has-text("${lang.toUpperCase()}")`).click()
  }

  async logout() {
    await this.logoutButton.click()
  }
}
