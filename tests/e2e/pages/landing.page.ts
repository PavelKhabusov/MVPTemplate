import { type Page, type Locator } from '@playwright/test'

/**
 * Page Object Model for the Landing page.
 * The landing page is web-only and renders at /landing.
 */
export class LandingPage {
  readonly page: Page

  // Hero section
  readonly heroSection: Locator
  readonly heroTitle: Locator
  readonly heroBadge: Locator
  readonly heroCTA: Locator
  readonly heroSecondaryCTA: Locator

  // Features section
  readonly featuresTitle: Locator

  // CTA section
  readonly ctaSection: Locator
  readonly ctaTitle: Locator

  constructor(page: Page) {
    this.page = page

    // Hero uses nativeID="hero-section" which renders as id="hero-section" on web
    this.heroSection = page.locator('#hero-section')
    // The hero title contains the i18n text "Ship your MVP in days, not months"
    this.heroTitle = page.getByText('Ship your MVP in days, not months')
    this.heroBadge = page.getByText('Open Source MVP Template')
    this.heroCTA = page.getByText('Get Started Free')
    this.heroSecondaryCTA = page.getByText('View on GitHub')

    // Features section
    this.featuresTitle = page.getByText('Built for speed')

    // CTA section uses nativeID="cta-section"
    this.ctaSection = page.locator('#cta-section')
    this.ctaTitle = page.getByText('Ready to build your next big thing?')
  }

  async goto() {
    await this.page.goto('/landing')
    await this.page.waitForLoadState('networkidle')
  }

  async getViewportWidth(): Promise<number> {
    return this.page.viewportSize()?.width ?? 0
  }

  /**
   * Check if the page has horizontal overflow (indicates layout issues).
   */
  async hasHorizontalOverflow(): Promise<boolean> {
    return this.page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth
    })
  }
}
