import { describe, it, expect, vi, beforeEach } from 'vitest'
import crypto from 'crypto'
import { PaddleProvider } from '../paddle.provider'

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

describe('PaddleProvider', () => {
  let provider: PaddleProvider
  const webhookSecret = 'pdl_whsec_test'

  beforeEach(() => {
    vi.clearAllMocks()
    provider = new PaddleProvider('pad_test_key', webhookSecret, true)
  })

  const baseParams = {
    userId: 'user_1',
    userEmail: 'test@test.com',
    planId: 'plan_pro',
    priceId: 'pri_123',
    planName: 'Pro Plan',
    amount: 1999,
    currency: 'usd',
    interval: 'one_time' as const,
    successUrl: 'https://example.com/success',
    cancelUrl: 'https://example.com/cancel',
  }

  describe('createCheckoutSession', () => {
    it('should create a transaction and return checkout URL', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            data: {
              id: 'txn_123',
              checkout: { url: 'https://checkout.paddle.com/xxx' },
            },
          }),
      })

      const result = await provider.createCheckoutSession(baseParams)

      expect(result.checkoutUrl).toBe('https://checkout.paddle.com/xxx')
      expect(result.sessionId).toBe('txn_123')

      const [url, options] = mockFetch.mock.calls[0]
      expect(url).toBe('https://sandbox-api.paddle.com/transactions')
      expect(options.headers.Authorization).toBe('Bearer pad_test_key')
    })

    it('should throw on API error', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 422,
        text: () => Promise.resolve('Validation error'),
      })

      await expect(provider.createCheckoutSession(baseParams)).rejects.toThrow(
        'Paddle API error 422',
      )
    })
  })

  describe('parseWebhook', () => {
    function buildSignedBody(body: string): { rawBody: string; headers: Record<string, string> } {
      const ts = Math.floor(Date.now() / 1000).toString()
      const signedContent = `${ts}:${body}`
      const h1 = crypto
        .createHmac('sha256', webhookSecret)
        .update(signedContent)
        .digest('hex')

      return {
        rawBody: body,
        headers: { 'paddle-signature': `ts=${ts};h1=${h1}` },
      }
    }

    it('should parse transaction.completed event', async () => {
      const body = JSON.stringify({
        event_type: 'transaction.completed',
        data: {
          id: 'txn_123',
          custom_data: { userId: 'user_1', planId: 'plan_pro' },
          details: { totals: { grand_total: 1999 } },
          currency_code: 'USD',
        },
      })
      const { rawBody, headers } = buildSignedBody(body)

      const event = await provider.parseWebhook(rawBody, headers)

      expect(event.type).toBe('payment.succeeded')
      expect(event.providerPaymentId).toBe('txn_123')
      expect(event.amount).toBe(1999)
      expect(event.currency).toBe('usd')
    })

    it('should reject invalid signature', async () => {
      const body = JSON.stringify({
        event_type: 'transaction.completed',
        data: { id: 'txn_x' },
      })
      const ts = Math.floor(Date.now() / 1000).toString()

      await expect(
        provider.parseWebhook(body, { 'paddle-signature': `ts=${ts};h1=invalidsig` }),
      ).rejects.toThrow('Invalid Paddle webhook signature')
    })

    it('should reject missing signature header', async () => {
      const body = JSON.stringify({
        event_type: 'transaction.completed',
        data: { id: 'txn_x' },
      })

      await expect(provider.parseWebhook(body, {})).rejects.toThrow(
        'Missing Paddle-Signature header',
      )
    })

    it('should parse subscription.canceled event', async () => {
      const body = JSON.stringify({
        event_type: 'subscription.canceled',
        data: { id: 'sub_cancel' },
      })
      const { rawBody, headers } = buildSignedBody(body)

      const event = await provider.parseWebhook(rawBody, headers)

      expect(event.type).toBe('subscription.canceled')
      expect(event.providerSubscriptionId).toBe('sub_cancel')
    })

    it('should throw on unhandled event type', async () => {
      const body = JSON.stringify({
        event_type: 'unknown.event',
        data: {},
      })
      const { rawBody, headers } = buildSignedBody(body)

      await expect(provider.parseWebhook(rawBody, headers)).rejects.toThrow(
        'Unhandled Paddle event type',
      )
    })
  })

  describe('cancelSubscription', () => {
    it('should cancel immediately', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: {} }),
      })

      await provider.cancelSubscription({
        providerSubscriptionId: 'sub_123',
        cancelImmediately: true,
      })

      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.effective_from).toBe('immediately')
    })

    it('should cancel at next billing period by default', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: {} }),
      })

      await provider.cancelSubscription({
        providerSubscriptionId: 'sub_123',
      })

      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.effective_from).toBe('next_billing_period')
    })
  })
})
