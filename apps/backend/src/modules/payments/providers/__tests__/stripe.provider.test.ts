import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockCheckoutCreate = vi.fn()
const mockSubscriptionsCancel = vi.fn()
const mockSubscriptionsUpdate = vi.fn()
const mockSubscriptionsRetrieve = vi.fn()
const mockRefundsCreate = vi.fn()
const mockConstructEvent = vi.fn()

vi.mock('stripe', () => ({
  default: vi.fn(() => ({
    checkout: { sessions: { create: mockCheckoutCreate } },
    subscriptions: {
      cancel: mockSubscriptionsCancel,
      update: mockSubscriptionsUpdate,
      retrieve: mockSubscriptionsRetrieve,
    },
    refunds: { create: mockRefundsCreate },
    webhooks: { constructEvent: mockConstructEvent },
  })),
}))

import { StripeProvider } from '../stripe.provider'

describe('StripeProvider', () => {
  let provider: StripeProvider

  beforeEach(() => {
    vi.clearAllMocks()
    provider = new StripeProvider('sk_test_xxx', 'whsec_test_xxx')
  })

  const baseParams = {
    userId: 'user_1',
    userEmail: 'test@test.com',
    planId: 'plan_pro',
    priceId: '',
    planName: 'Pro Plan',
    amount: 1999,
    currency: 'usd',
    interval: 'one_time' as const,
    successUrl: 'https://example.com/success',
    cancelUrl: 'https://example.com/cancel',
  }

  describe('createCheckoutSession', () => {
    it('should create a one-time payment session', async () => {
      mockCheckoutCreate.mockResolvedValue({ url: 'https://checkout.stripe.com/xxx', id: 'cs_123' })

      const result = await provider.createCheckoutSession(baseParams)

      expect(result.checkoutUrl).toBe('https://checkout.stripe.com/xxx')
      expect(result.sessionId).toBe('cs_123')
      expect(mockCheckoutCreate).toHaveBeenCalledWith(
        expect.objectContaining({ mode: 'payment' }),
      )
    })

    it('should create a subscription session when interval is month', async () => {
      mockCheckoutCreate.mockResolvedValue({ url: 'https://checkout.stripe.com/sub', id: 'cs_sub' })

      const result = await provider.createCheckoutSession({
        ...baseParams,
        interval: 'month',
      })

      expect(result.sessionId).toBe('cs_sub')
      expect(mockCheckoutCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          mode: 'subscription',
          subscription_data: expect.objectContaining({
            metadata: { userId: 'user_1', planId: 'plan_pro' },
          }),
        }),
      )
    })

    it('should use priceId when provided', async () => {
      mockCheckoutCreate.mockResolvedValue({ url: 'https://checkout.stripe.com/p', id: 'cs_p' })

      await provider.createCheckoutSession({
        ...baseParams,
        priceId: 'price_xxx',
      })

      expect(mockCheckoutCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          line_items: [{ price: 'price_xxx', quantity: 1 }],
        }),
      )
    })
  })

  describe('parseWebhook', () => {
    it('should parse checkout.session.completed for one-time payment', async () => {
      mockConstructEvent.mockReturnValue({
        type: 'checkout.session.completed',
        data: {
          object: {
            mode: 'payment',
            payment_intent: 'pi_123',
            metadata: { userId: 'user_1', planId: 'plan_pro' },
            amount_total: 1999,
            currency: 'usd',
          },
        },
      })

      const event = await provider.parseWebhook('body', { 'stripe-signature': 'sig' })

      expect(event.type).toBe('payment.succeeded')
      expect(event.providerPaymentId).toBe('pi_123')
      expect(event.userId).toBe('user_1')
      expect(event.amount).toBe(1999)
    })

    it('should parse checkout.session.completed for subscription', async () => {
      mockConstructEvent.mockReturnValue({
        type: 'checkout.session.completed',
        data: {
          object: {
            mode: 'subscription',
            subscription: 'sub_123',
            customer: 'cus_456',
            metadata: { userId: 'user_1', planId: 'plan_pro' },
            amount_total: 999,
            currency: 'usd',
          },
        },
      })

      const event = await provider.parseWebhook('body', { 'stripe-signature': 'sig' })

      expect(event.type).toBe('subscription.created')
      expect(event.providerSubscriptionId).toBe('sub_123')
      expect(event.providerCustomerId).toBe('cus_456')
    })

    it('should throw on unhandled event type', async () => {
      mockConstructEvent.mockReturnValue({ type: 'some.unknown.event', data: {} })

      await expect(
        provider.parseWebhook('body', { 'stripe-signature': 'sig' }),
      ).rejects.toThrow('Unhandled Stripe event type')
    })

    it('should parse customer.subscription.deleted', async () => {
      mockConstructEvent.mockReturnValue({
        type: 'customer.subscription.deleted',
        data: {
          object: { id: 'sub_del', metadata: { userId: 'u1' } },
        },
      })

      const event = await provider.parseWebhook('body', { 'stripe-signature': 'sig' })
      expect(event.type).toBe('subscription.canceled')
      expect(event.providerSubscriptionId).toBe('sub_del')
    })
  })

  describe('cancelSubscription', () => {
    it('should cancel immediately when cancelImmediately is true', async () => {
      mockSubscriptionsCancel.mockResolvedValue({})

      await provider.cancelSubscription({
        providerSubscriptionId: 'sub_123',
        cancelImmediately: true,
      })

      expect(mockSubscriptionsCancel).toHaveBeenCalledWith('sub_123')
    })

    it('should set cancel_at_period_end when not immediate', async () => {
      mockSubscriptionsUpdate.mockResolvedValue({})

      await provider.cancelSubscription({
        providerSubscriptionId: 'sub_123',
        cancelImmediately: false,
      })

      expect(mockSubscriptionsUpdate).toHaveBeenCalledWith('sub_123', {
        cancel_at_period_end: true,
      })
    })
  })

  describe('refundPayment', () => {
    it('should create a full refund', async () => {
      mockRefundsCreate.mockResolvedValue({
        id: 're_123',
        amount: 1999,
        currency: 'usd',
        status: 'succeeded',
      })

      const result = await provider.refundPayment('pi_123')

      expect(result.refundId).toBe('re_123')
      expect(result.amount).toBe(1999)
      expect(mockRefundsCreate).toHaveBeenCalledWith({ payment_intent: 'pi_123' })
    })

    it('should create a partial refund with amount', async () => {
      mockRefundsCreate.mockResolvedValue({
        id: 're_456',
        amount: 500,
        currency: 'usd',
        status: 'succeeded',
      })

      const result = await provider.refundPayment('pi_123', 500)

      expect(result.amount).toBe(500)
      expect(mockRefundsCreate).toHaveBeenCalledWith({
        payment_intent: 'pi_123',
        amount: 500,
      })
    })
  })
})
