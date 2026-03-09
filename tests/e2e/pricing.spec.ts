import { test, expect } from '@playwright/test'
import { PricingPage } from './pages/pricing.page'
import { dismissOverlays } from './helpers/dismiss-overlays'

// ----- Test data fixtures -----

const MONTHLY_PLANS = [
  {
    id: 'basic-mo',
    name: 'Basic',
    description: 'For individuals getting started',
    priceAmount: 900,
    currency: 'usd',
    interval: 'month' as const,
    features: ['5 projects', 'Basic analytics', 'Email support'],
    sortOrder: 1,
    isActive: true,
    provider: 'stripe',
  },
  {
    id: 'pro-mo',
    name: 'Pro',
    description: 'For growing teams',
    priceAmount: 1900,
    currency: 'usd',
    interval: 'month' as const,
    features: ['Unlimited projects', 'Advanced analytics', 'Priority support', 'API access'],
    sortOrder: 2,
    isActive: true,
    provider: 'stripe',
  },
  {
    id: 'enterprise-mo',
    name: 'Enterprise',
    description: 'For large organizations',
    priceAmount: 4900,
    currency: 'usd',
    interval: 'month' as const,
    features: ['Everything in Pro', 'Custom integrations', 'Dedicated support', 'SLA guarantee', 'SSO'],
    sortOrder: 3,
    isActive: true,
    provider: 'stripe',
  },
]

const YEARLY_PLANS = [
  {
    id: 'basic-yr',
    name: 'Basic',
    description: 'For individuals getting started',
    priceAmount: 8400,
    currency: 'usd',
    interval: 'year' as const,
    features: ['5 projects', 'Basic analytics', 'Email support'],
    sortOrder: 1,
    isActive: true,
    provider: 'stripe',
  },
  {
    id: 'pro-yr',
    name: 'Pro',
    description: 'For growing teams',
    priceAmount: 17400,
    currency: 'usd',
    interval: 'year' as const,
    features: ['Unlimited projects', 'Advanced analytics', 'Priority support', 'API access'],
    sortOrder: 2,
    isActive: true,
    provider: 'stripe',
  },
  {
    id: 'enterprise-yr',
    name: 'Enterprise',
    description: 'For large organizations',
    priceAmount: 46800,
    currency: 'usd',
    interval: 'year' as const,
    features: ['Everything in Pro', 'Custom integrations', 'Dedicated support', 'SLA guarantee', 'SSO'],
    sortOrder: 3,
    isActive: true,
    provider: 'stripe',
  },
]

const ALL_PLANS = [...MONTHLY_PLANS, ...YEARLY_PLANS]

function makeSubscription(overrides: Partial<{
  id: string
  planId: string
  planName: string
  status: string
  provider: string
  currentPeriodStart: string
  currentPeriodEnd: string
  cancelAtPeriodEnd: boolean
}> = {}) {
  return {
    id: 'sub_test_123',
    planId: 'pro-mo',
    planName: 'Pro',
    status: 'active',
    provider: 'stripe',
    currentPeriodStart: '2026-02-07T00:00:00Z',
    currentPeriodEnd: '2026-03-07T00:00:00Z',
    cancelAtPeriodEnd: false,
    ...overrides,
  }
}

// ----- Helper to mock API routes -----

async function mockPlansAPI(page: import('@playwright/test').Page, plans: typeof MONTHLY_PLANS) {
  await page.route('**/api/payments/plans', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: plans, success: true }),
    })
  })
}

async function mockSubscriptionAPI(page: import('@playwright/test').Page, subscription: ReturnType<typeof makeSubscription> | null) {
  await page.route('**/api/payments/subscription', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: subscription, success: true }),
    })
  })
}

async function mockNoSubscription(page: import('@playwright/test').Page) {
  await page.route('**/api/payments/subscription', (route) => {
    route.fulfill({ status: 401, body: 'Unauthorized' })
  })
}

// ----- Tests -----

test.describe('Pricing Page', () => {
  let pricing: PricingPage

  test.beforeEach(async ({ page }) => {
    await dismissOverlays(page)
    pricing = new PricingPage(page)
  })

  test.describe('Plans rendering', () => {
    test('renders page with 3 plan cards', async ({ page }) => {
      await mockPlansAPI(page, MONTHLY_PLANS)
      await mockNoSubscription(page)
      await pricing.goto()

      await expect(pricing.title).toBeVisible({ timeout: 15000 })
      await expect(pricing.subtitle).toBeVisible()

      // All 3 plan names visible
      await expect(pricing.getCardByName('Basic')).toBeVisible()
      await expect(pricing.getCardByName('Pro')).toBeVisible()
      await expect(pricing.getCardByName('Enterprise')).toBeVisible()

      // Prices rendered (formatPrice divides by 100)
      await expect(page.getByText('$9')).toBeVisible()
      await expect(page.getByText('$19')).toBeVisible()
      await expect(page.getByText('$49')).toBeVisible()

      // Features visible
      await expect(page.getByText('5 projects')).toBeVisible()
      await expect(page.getByText('Unlimited projects')).toBeVisible()
      await expect(page.getByText('SSO')).toBeVisible()
    })

    test('Most Popular badge on middle plan', async ({ page }) => {
      await mockPlansAPI(page, MONTHLY_PLANS)
      await mockNoSubscription(page)
      await pricing.goto()

      await expect(pricing.title).toBeVisible({ timeout: 15000 })
      // Middle plan (sortOrder 2 = Pro) gets the highlighted badge
      await expect(pricing.getMostPopularBadge()).toBeVisible()
    })

    test('empty state when no plans', async ({ page }) => {
      await mockPlansAPI(page, [])
      await mockNoSubscription(page)
      await pricing.goto()

      await expect(pricing.title).toBeVisible({ timeout: 15000 })
      await expect(pricing.emptyMessage).toBeVisible()
    })

    test('loading state shows skeleton cards', async ({ page }) => {
      // Mock plans API to never respond (simulating loading)
      await page.route('**/api/payments/plans', () => {
        // Intentionally never fulfill — keeps loading state
      })
      await mockNoSubscription(page)
      await pricing.goto()

      await expect(pricing.title).toBeVisible({ timeout: 15000 })
      // Skeleton cards have opacity: 0.5 style
      const skeletons = pricing.getSkeletonCards()
      await expect(skeletons.first()).toBeVisible({ timeout: 5000 })
      const count = await skeletons.count()
      expect(count).toBe(3)
    })
  })

  test.describe('Billing interval toggle', () => {
    test('toggle appears when both monthly and yearly plans exist', async ({ page }) => {
      await mockPlansAPI(page, ALL_PLANS)
      await mockNoSubscription(page)
      await pricing.goto()

      await expect(pricing.title).toBeVisible({ timeout: 15000 })
      await expect(pricing.monthlyToggle).toBeVisible()
      await expect(pricing.yearlyToggle).toBeVisible()
    })

    test('clicking Yearly shows yearly plans', async ({ page }) => {
      await mockPlansAPI(page, ALL_PLANS)
      await mockNoSubscription(page)
      await pricing.goto()

      await expect(pricing.title).toBeVisible({ timeout: 15000 })

      // Default is monthly — monthly prices visible
      await expect(page.getByText('/month').first()).toBeVisible()

      // Switch to yearly
      await pricing.selectYearly()

      // Yearly prices should show /year interval labels
      await expect(page.getByText('/year').first()).toBeVisible({ timeout: 5000 })
    })

    test('savings badge shown on yearly toggle', async ({ page }) => {
      await mockPlansAPI(page, ALL_PLANS)
      await mockNoSubscription(page)
      await pricing.goto()

      await expect(pricing.title).toBeVisible({ timeout: 15000 })

      // Savings badge appears next to Yearly toggle when Monthly is selected
      // The badge format is "-XX%" where XX is the calculated savings
      const savingsBadge = page.getByText(/-\d+%/)
      await expect(savingsBadge.first()).toBeVisible()
    })

    test('toggle hidden when only monthly plans exist', async ({ page }) => {
      await mockPlansAPI(page, MONTHLY_PLANS)
      await mockNoSubscription(page)
      await pricing.goto()

      await expect(pricing.title).toBeVisible({ timeout: 15000 })
      // Monthly toggle should not be visible since there are no yearly alternatives
      await expect(pricing.yearlyToggle).not.toBeVisible()
    })
  })

  test.describe('Success banner', () => {
    test('shows success banner with ?success=true', async ({ page }) => {
      await mockPlansAPI(page, MONTHLY_PLANS)
      await mockNoSubscription(page)
      await pricing.gotoWithSuccess()

      await expect(pricing.title).toBeVisible({ timeout: 15000 })
      await expect(pricing.successBanner).toBeVisible()
    })

    test('no success banner on normal navigation', async ({ page }) => {
      await mockPlansAPI(page, MONTHLY_PLANS)
      await mockNoSubscription(page)
      await pricing.goto()

      await expect(pricing.title).toBeVisible({ timeout: 15000 })
      await expect(pricing.successBanner).not.toBeVisible()
    })
  })

  test.describe('Subscription card', () => {
    test('shows current subscription with status badge', async ({ page }) => {
      await mockPlansAPI(page, MONTHLY_PLANS)
      const sub = makeSubscription()
      await mockSubscriptionAPI(page, sub)
      await pricing.goto()

      await expect(pricing.title).toBeVisible({ timeout: 15000 })
      // Subscription badge shows plan name
      await expect(page.getByText('Pro').first()).toBeVisible()
      // Status badge shows "Active"
      await expect(pricing.getStatusBadge('Active')).toBeVisible()
    })

    test('cancel button visible for active subscription', async ({ page }) => {
      await mockPlansAPI(page, MONTHLY_PLANS)
      await mockSubscriptionAPI(page, makeSubscription())
      await pricing.goto()

      await expect(pricing.title).toBeVisible({ timeout: 15000 })
      await expect(pricing.cancelSubscriptionButton).toBeVisible()
    })

    test('cancel button hidden for canceled subscription', async ({ page }) => {
      await mockPlansAPI(page, MONTHLY_PLANS)
      await mockSubscriptionAPI(page, makeSubscription({
        status: 'canceled',
        cancelAtPeriodEnd: true,
      }))
      await pricing.goto()

      await expect(pricing.title).toBeVisible({ timeout: 15000 })
      // Status shows "Canceled"
      await expect(pricing.getStatusBadge('Canceled')).toBeVisible()
      // Cancel button should not be visible
      await expect(pricing.cancelSubscriptionButton).not.toBeVisible()
    })
  })

  test.describe('Trust signals', () => {
    test('trust signals visible when plans are loaded', async ({ page }) => {
      await mockPlansAPI(page, MONTHLY_PLANS)
      await mockNoSubscription(page)
      await pricing.goto()

      await expect(pricing.title).toBeVisible({ timeout: 15000 })

      // Scroll trust signals into view
      await pricing.securePayments.scrollIntoViewIfNeeded()
      await expect(pricing.securePayments).toBeVisible()
      await expect(pricing.guarantee).toBeVisible()
      await expect(pricing.cancelAnytime).toBeVisible()
    })
  })

  test.describe('Checkout flow', () => {
    test('Get Started button triggers checkout POST', async ({ page }) => {
      await mockPlansAPI(page, MONTHLY_PLANS)
      await mockNoSubscription(page)

      // Track checkout API calls
      let checkoutCalled = false
      let checkoutBody: any = null
      await page.route('**/api/payments/checkout', async (route) => {
        checkoutCalled = true
        checkoutBody = route.request().postDataJSON()
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: {
              checkoutUrl: 'https://checkout.stripe.com/test',
              sessionId: 'sess_123',
            },
            success: true,
          }),
        })
      })

      // Prevent actual navigation to Stripe checkout
      await page.route('https://checkout.stripe.com/**', (route) => {
        route.abort()
      })

      await pricing.goto()
      await expect(pricing.title).toBeVisible({ timeout: 15000 })

      // Click the first "Get Started" button (Basic plan)
      const getStartedButton = pricing.getGetStartedButton(0)
      await expect(getStartedButton).toBeVisible()
      await getStartedButton.click()

      // Wait a moment for the API call to be made
      await page.waitForTimeout(1000)

      expect(checkoutCalled).toBe(true)
      expect(checkoutBody).toBeTruthy()
      expect(checkoutBody.planId).toBe('basic-mo')
    })
  })
})
