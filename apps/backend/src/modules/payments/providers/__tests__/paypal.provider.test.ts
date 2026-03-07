import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PayPalProvider } from '../paypal.provider'

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

function mockTokenResponse() {
  return {
    ok: true,
    json: () => Promise.resolve({ access_token: 'test_token', expires_in: 3600 }),
  }
}

describe('PayPalProvider', () => {
  let provider: PayPalProvider

  beforeEach(() => {
    vi.clearAllMocks()
    provider = new PayPalProvider('client_id', 'client_secret', 'webhook_id', 'sandbox')
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
    it('should create a one-time order', async () => {
      // First call: token, second call: create order
      mockFetch
        .mockResolvedValueOnce(mockTokenResponse())
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              id: 'ORDER_123',
              links: [{ href: 'https://paypal.com/approve/xxx', rel: 'approve' }],
            }),
        })

      const result = await provider.createCheckoutSession(baseParams)

      expect(result.checkoutUrl).toBe('https://paypal.com/approve/xxx')
      expect(result.sessionId).toBe('ORDER_123')
    })

    it('should throw when no approve link in response', async () => {
      mockFetch
        .mockResolvedValueOnce(mockTokenResponse())
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({ id: 'ORDER_X', links: [] }),
        })

      await expect(provider.createCheckoutSession(baseParams)).rejects.toThrow(
        'no approve link',
      )
    })

    it('should require priceId for subscriptions', async () => {
      await expect(
        provider.createCheckoutSession({ ...baseParams, interval: 'month' }),
      ).rejects.toThrow('pre-created billing plan ID')
    })

    it('should create subscription when priceId is provided', async () => {
      mockFetch
        .mockResolvedValueOnce(mockTokenResponse())
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              id: 'SUB_123',
              links: [{ href: 'https://paypal.com/subscribe/yyy', rel: 'approve' }],
            }),
        })

      const result = await provider.createCheckoutSession({
        ...baseParams,
        interval: 'month',
        priceId: 'P-PLAN_123',
      })

      expect(result.checkoutUrl).toBe('https://paypal.com/subscribe/yyy')
      expect(result.sessionId).toBe('SUB_123')
    })
  })

  describe('parseWebhook', () => {
    it('should parse PAYMENT.CAPTURE.COMPLETED', async () => {
      // Token call for webhook verification, then verification API call
      mockFetch
        .mockResolvedValueOnce(mockTokenResponse())
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ verification_status: 'SUCCESS' }),
        })

      const rawBody = JSON.stringify({
        event_type: 'PAYMENT.CAPTURE.COMPLETED',
        resource: {
          id: 'CAP_123',
          amount: { value: '19.99', currency_code: 'USD' },
          custom_id: JSON.stringify({ userId: 'user_1', planId: 'plan_pro' }),
        },
      })

      const event = await provider.parseWebhook(rawBody, {
        'paypal-auth-algo': 'algo',
        'paypal-cert-url': 'cert',
        'paypal-transmission-id': 'tid',
        'paypal-transmission-sig': 'sig',
        'paypal-transmission-time': 'time',
      })

      expect(event.type).toBe('payment.succeeded')
      expect(event.providerPaymentId).toBe('CAP_123')
      expect(event.amount).toBe(1999)
      expect(event.currency).toBe('usd')
    })

    it('should throw on failed webhook verification', async () => {
      mockFetch
        .mockResolvedValueOnce(mockTokenResponse())
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ verification_status: 'FAILURE' }),
        })

      const rawBody = JSON.stringify({
        event_type: 'PAYMENT.CAPTURE.COMPLETED',
        resource: { id: 'x', amount: { value: '1', currency_code: 'USD' } },
      })

      await expect(
        provider.parseWebhook(rawBody, {
          'paypal-auth-algo': 'a',
          'paypal-cert-url': 'c',
          'paypal-transmission-id': 't',
          'paypal-transmission-sig': 's',
          'paypal-transmission-time': 't',
        }),
      ).rejects.toThrow('webhook signature verification failed')
    })

    it('should throw on unhandled event type', async () => {
      mockFetch
        .mockResolvedValueOnce(mockTokenResponse())
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ verification_status: 'SUCCESS' }),
        })

      const rawBody = JSON.stringify({
        event_type: 'SOME.UNKNOWN.EVENT',
        resource: {},
      })

      await expect(
        provider.parseWebhook(rawBody, {
          'paypal-auth-algo': 'a',
          'paypal-cert-url': 'c',
          'paypal-transmission-id': 't',
          'paypal-transmission-sig': 's',
          'paypal-transmission-time': 't',
        }),
      ).rejects.toThrow('Unhandled PayPal event type')
    })
  })

  describe('cancelSubscription', () => {
    it('should POST to cancel endpoint', async () => {
      mockFetch
        .mockResolvedValueOnce(mockTokenResponse())
        .mockResolvedValueOnce({ ok: true, status: 204 })

      await provider.cancelSubscription({ providerSubscriptionId: 'SUB_123' })

      const [url, options] = mockFetch.mock.calls[1]
      expect(url).toContain('/v1/billing/subscriptions/SUB_123/cancel')
      expect(options.method).toBe('POST')
    })
  })
})
