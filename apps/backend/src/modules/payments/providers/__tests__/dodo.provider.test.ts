import { describe, it, expect, vi, beforeEach } from 'vitest'
import crypto from 'crypto'
import { DodoProvider } from '../dodo.provider'

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

describe('DodoProvider', () => {
  let provider: DodoProvider
  const webhookSecret = 'whsec_dGVzdHNlY3JldA==' // base64-encoded "testsecret"

  beforeEach(() => {
    vi.clearAllMocks()
    provider = new DodoProvider('dodo_api_key', webhookSecret)
  })

  const baseParams = {
    userId: 'user_1',
    userEmail: 'test@test.com',
    planId: 'plan_pro',
    priceId: 'prod_123',
    planName: 'Pro Plan',
    amount: 1999,
    currency: 'usd',
    interval: 'one_time' as const,
    successUrl: 'https://example.com/success',
    cancelUrl: 'https://example.com/cancel',
  }

  describe('createCheckoutSession', () => {
    it('should create a payment and return checkout URL', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            payment_link: 'https://checkout.dodopayments.com/xxx',
            payment_id: 'pay_123',
          }),
      })

      const result = await provider.createCheckoutSession(baseParams)

      expect(result.checkoutUrl).toBe('https://checkout.dodopayments.com/xxx')
      expect(result.sessionId).toBe('pay_123')

      const [url, options] = mockFetch.mock.calls[0]
      expect(url).toBe('https://api.dodopayments.com/payments')
      expect(options.headers.Authorization).toBe('Bearer dodo_api_key')
    })

    it('should throw on API error', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        text: () => Promise.resolve('Internal error'),
      })

      await expect(provider.createCheckoutSession(baseParams)).rejects.toThrow(
        'Dodo API error 500',
      )
    })
  })

  describe('parseWebhook', () => {
    function buildSignedBody(body: string): { rawBody: string; headers: Record<string, string> } {
      const webhookId = 'msg_test123'
      const webhookTimestamp = Math.floor(Date.now() / 1000).toString()
      const signedContent = `${webhookId}.${webhookTimestamp}.${body}`
      const secretBytes = Buffer.from(webhookSecret.replace(/^whsec_/, ''), 'base64')
      const hmac = crypto.createHmac('sha256', secretBytes)
      hmac.update(signedContent)
      const sig = `v1,${hmac.digest('base64')}`

      return {
        rawBody: body,
        headers: {
          'webhook-id': webhookId,
          'webhook-timestamp': webhookTimestamp,
          'webhook-signature': sig,
        },
      }
    }

    it('should parse payment.succeeded event', async () => {
      const body = JSON.stringify({
        type: 'payment.succeeded',
        data: {
          payment_id: 'pay_123',
          total_amount: 1999,
          currency: 'USD',
          metadata: { userId: 'user_1', planId: 'plan_pro' },
        },
      })
      const { rawBody, headers } = buildSignedBody(body)

      const event = await provider.parseWebhook(rawBody, headers)

      expect(event.type).toBe('payment.succeeded')
      expect(event.providerPaymentId).toBe('pay_123')
      expect(event.amount).toBe(1999)
      expect(event.userId).toBe('user_1')
    })

    it('should reject invalid signature', async () => {
      const body = JSON.stringify({
        type: 'payment.succeeded',
        data: { payment_id: 'pay_x' },
      })

      await expect(
        provider.parseWebhook(body, {
          'webhook-id': 'msg_x',
          'webhook-timestamp': '12345',
          'webhook-signature': 'v1,invalidsig',
        }),
      ).rejects.toThrow('Invalid Dodo webhook signature')
    })

    it('should throw on missing signature headers', async () => {
      const body = JSON.stringify({
        type: 'payment.succeeded',
        data: { payment_id: 'pay_x' },
      })

      await expect(provider.parseWebhook(body, {})).rejects.toThrow(
        'Missing Dodo webhook signature headers',
      )
    })

    it('should parse subscription.cancelled event', async () => {
      const body = JSON.stringify({
        type: 'subscription.cancelled',
        data: { subscription_id: 'sub_cancel' },
      })
      const { rawBody, headers } = buildSignedBody(body)

      const event = await provider.parseWebhook(rawBody, headers)

      expect(event.type).toBe('subscription.canceled')
      expect(event.providerSubscriptionId).toBe('sub_cancel')
    })

    it('should throw on unhandled event type', async () => {
      const body = JSON.stringify({
        type: 'unknown.event',
        data: {},
      })
      const { rawBody, headers } = buildSignedBody(body)

      await expect(provider.parseWebhook(rawBody, headers)).rejects.toThrow(
        'Unhandled Dodo event type',
      )
    })
  })

  describe('cancelSubscription', () => {
    it('should POST to cancel endpoint', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}),
      })

      await provider.cancelSubscription({ providerSubscriptionId: 'sub_123' })

      const [url, options] = mockFetch.mock.calls[0]
      expect(url).toBe('https://api.dodopayments.com/subscriptions/sub_123/cancel')
      expect(options.method).toBe('POST')
    })
  })
})
