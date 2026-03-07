import { type Page, type Locator } from '@playwright/test'

/**
 * Page Object Model for the Pricing page.
 * Renders at /pricing, fetches plans from /api/payments/plans
 * and subscription from /api/payments/subscription.
 */
export class PricingPage {
  readonly page: Page

  // Header
  readonly title: Locator
  readonly subtitle: Locator

  // Billing interval toggle
  readonly monthlyToggle: Locator
  readonly yearlyToggle: Locator

  // Empty state
  readonly emptyMessage: Locator

  // Success banner
  readonly successBanner: Locator

  // Trust signals
  readonly securePayments: Locator
  readonly guarantee: Locator
  readonly cancelAnytime: Locator

  // Subscription card
  readonly cancelSubscriptionButton: Locator

  constructor(page: Page) {
    this.page = page

    this.title = page.getByText('Pricing', { exact: true }).first()
    this.subtitle = page.getByText('Choose the plan that works for you')

    this.monthlyToggle = page.getByText('Monthly', { exact: true }).first()
    this.yearlyToggle = page.getByText('Yearly', { exact: true }).first()

    this.emptyMessage = page.getByText('No plans available yet')

    this.successBanner = page.getByText('Payment Successful!')

    this.securePayments = page.getByText('Secure payments')
    this.guarantee = page.getByText('30-day money back guarantee')
    this.cancelAnytime = page.getByText('Cancel anytime')

    this.cancelSubscriptionButton = page.getByText('Cancel Subscription').first()
  }

  async goto() {
    await this.page.goto('/pricing')
    await this.page.waitForLoadState('domcontentloaded')
  }

  async gotoWithSuccess() {
    await this.page.goto('/pricing?success=true')
    await this.page.waitForLoadState('domcontentloaded')
  }

  async selectMonthly() {
    await this.monthlyToggle.click()
  }

  async selectYearly() {
    await this.yearlyToggle.click()
  }

  /**
   * Get a plan card locator by plan name text.
   */
  getCardByName(name: string): Locator {
    return this.page.getByText(name, { exact: true }).first()
  }

  /**
   * Get the "Get Started" button within a plan card context.
   * Since cards are rendered sequentially, we use nth() to target by index.
   */
  getGetStartedButton(nth = 0): Locator {
    return this.page.getByText('Get Started', { exact: true }).nth(nth)
  }

  /**
   * Get the "Current Plan" indicator by text.
   */
  getCurrentPlanBadge(): Locator {
    return this.page.getByText('Current Plan', { exact: true }).first()
  }

  /**
   * Get the "Most Popular" badge.
   */
  getMostPopularBadge(): Locator {
    return this.page.getByText('Most Popular', { exact: true }).first()
  }

  /**
   * Get skeleton loading cards (placeholder cards with opacity).
   * They are empty YStack elements with specific height (380).
   */
  getSkeletonCards(): Locator {
    return this.page.locator('[style*="opacity: 0.5"]')
  }

  /**
   * Get the subscription status badge by status text.
   */
  getStatusBadge(status: string): Locator {
    return this.page.getByText(status, { exact: true }).first()
  }

  /**
   * Get the savings badge on yearly toggle (e.g., "-20%").
   */
  getSavingsBadge(): Locator {
    return this.page.locator('text=/-\\d+%/')
  }
}
