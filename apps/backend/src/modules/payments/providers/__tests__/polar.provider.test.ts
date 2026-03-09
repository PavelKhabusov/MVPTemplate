import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockCheckoutsCreate = vi.fn()
const mockSubscriptionsRevoke = vi.fn()
const mockSubscriptionsGet = vi.fn()
const mockRefundsCreate = vi.fn()
const mockValidateWebhook = vi.fn()

vi.mock('@polar-sh/sdk', () => ({
  Polar: vi.fn(() => ({
    checkouts: { create: mockCheckoutsCreate },
    subscriptions: { revoke: mockSubscriptionsRevoke, get: mockSubscriptionsGet },
    refunds: { create: mockRefundsCreate },
    validateWebhook: mockValidateWebhook,
  })),
}))

import { PolarProvider } from '../polar.provider'

describe('PolarProvider', () => {
  let provider: PolarProvider

  beforeEach(() => {
    vi.clearAllMocks()
    provider = new PolarProvider('pat_test_xxx', 'org_123')
  })

  const baseParams = {
    userId: 'user_1',
    userEmail: 'test@test.com',
    planId: 'plan_pro',
    priceId: 'prod_polar_123',
    planName: 'Pro Plan',
    amount: 1999,
    currency: 'usd',
    interval: 'one_time' as const,
    successUrl: 'https://example.com/success',
    cancelUrl: 'https://example.com/cancel',
  }

  describe('createCheckoutSession', () => {
    it('should create a checkout session with product ID', async () => {
      mockCheckoutsCreate.mockResolvedValue({
        url: 'https://polar.sh/checkout/xxx',
        id: 'chk_123',
      })

      const result = await provider.createCheckoutSession(baseParams)

      expect(result.checkoutUrl).toBe('https://polar.sh/checkout/xxx')
      expect(result.sessionId).toBe('chk_123')
      expect(mockCheckoutsCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          products: ['prod_polar_123'],
          customerEmail: 'test@test.com',
          metadata: expect.objectContaining({ userId: 'user_1', planId: 'plan_pro' }),
        }),
      )
    })
  })

  describe('parseWebhook', () => {
    it('should parse checkout.updated with status succeeded', async () => {
      mockValidateWebhook.mockResolvedValue({
        type: 'checkout.updated',
        data: {
          id: 'chk_123',
          status: 'succeeded',
          amount: 1999,
          currency: 'usd',
          metadata: { userId: 'user_1', planId: 'plan_pro' },
        },
      })

      const event = await provider.parseWebhook('body', { 'x-polar-sig': 'sig' })

      expect(event.type).toBe('payment.succeeded')
      expect(event.providerPaymentId).toBe('chk_123')
      expect(event.amount).toBe(1999)
    })

    it('should parse subscription.created', async () => {
      mockValidateWebhook.mockResolvedValue({
        type: 'subscription.created',
        data: {
          id: 'sub_123',
          metadata: { userId: 'user_1', planId: 'plan_pro' },
          currentPeriodStart: '2026-01-01T00:00:00Z',
          currentPeriodEnd: '2026-02-01T00:00:00Z',
        },
      })

      const event = await provider.parseWebhook('body', {})

      expect(event.type).toBe('subscription.created')
      expect(event.providerSubscriptionId).toBe('sub_123')
      expect(event.userId).toBe('user_1')
    })

    it('should parse subscription.canceled', async () => {
      mockValidateWebhook.mockResolvedValue({
        type: 'subscription.canceled',
        data: { id: 'sub_cancel' },
      })

      const event = await provider.parseWebhook('body', {})

      expect(event.type).toBe('subscription.canceled')
      expect(event.providerSubscriptionId).toBe('sub_cancel')
    })

    it('should throw on unhandled event type', async () => {
      mockValidateWebhook.mockResolvedValue({ type: 'unknown.event', data: {} })

      await expect(provider.parseWebhook('body', {})).rejects.toThrow(
        'Unhandled Polar event type',
      )
    })
  })

  describe('cancelSubscription', () => {
    it('should revoke subscription', async () => {
      mockSubscriptionsRevoke.mockResolvedValue({})

      await provider.cancelSubscription({ providerSubscriptionId: 'sub_123' })

      expect(mockSubscriptionsRevoke).toHaveBeenCalledWith({ id: 'sub_123' })
    })
  })

  describe('refundPayment', () => {
    it('should create a refund', async () => {
      mockRefundsCreate.mockResolvedValue({
        id: 'ref_123',
        amount: 1999,
        currency: 'usd',
        status: 'succeeded',
      })

      const result = await provider.refundPayment('order_123', 1999)

      expect(result.refundId).toBe('ref_123')
      expect(mockRefundsCreate).toHaveBeenCalledWith({
        orderId: 'order_123',
        reason: 'customer_request',
        amount: 1999,
      })
    })
  })
})
