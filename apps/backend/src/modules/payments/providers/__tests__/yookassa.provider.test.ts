import { describe, it, expect, vi, beforeEach } from 'vitest'
import { YooKassaProvider } from '../yookassa.provider'

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

describe('YooKassaProvider', () => {
  let provider: YooKassaProvider

  beforeEach(() => {
    vi.clearAllMocks()
    provider = new YooKassaProvider('shop_123', 'secret_key')
  })

  const baseParams = {
    userId: 'user_1',
    userEmail: 'test@test.com',
    planId: 'plan_pro',
    priceId: '',
    planName: 'Pro Plan',
    amount: 199900,
    currency: 'rub',
    interval: 'one_time' as const,
    successUrl: 'https://example.com/success',
    cancelUrl: 'https://example.com/cancel',
  }

  describe('createCheckoutSession', () => {
    it('should create a one-time payment', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            id: 'pay_123',
            confirmation: { confirmation_url: 'https://yookassa.ru/checkout/xxx' },
          }),
      })

      const result = await provider.createCheckoutSession(baseParams)

      expect(result.checkoutUrl).toBe('https://yookassa.ru/checkout/xxx')
      expect(result.sessionId).toBe('pay_123')

      const [url, options] = mockFetch.mock.calls[0]
      expect(url).toBe('https://api.yookassa.ru/v3/payments')
      expect(options.method).toBe('POST')

      const body = JSON.parse(options.body)
      expect(body.amount.value).toBe('1999.00')
      expect(body.capture).toBe(true)
      expect(body.save_payment_method).toBeUndefined()
    })

    it('should set save_payment_method for subscriptions', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            id: 'pay_sub',
            confirmation: { confirmation_url: 'https://yookassa.ru/checkout/sub' },
          }),
      })

      await provider.createCheckoutSession({ ...baseParams, interval: 'month' })

      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.save_payment_method).toBe(true)
    })

    it('should throw on API error', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        text: () => Promise.resolve('Bad request'),
      })

      await expect(provider.createCheckoutSession(baseParams)).rejects.toThrow(
        'YooKassa API error: 400',
      )
    })

    it('should send Basic auth header', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            id: 'pay_x',
            confirmation: { confirmation_url: 'https://yookassa.ru/x' },
          }),
      })

      await provider.createCheckoutSession(baseParams)

      const expectedAuth =
        'Basic ' + Buffer.from('shop_123:secret_key').toString('base64')
      expect(mockFetch.mock.calls[0][1].headers.Authorization).toBe(expectedAuth)
    })
  })

  describe('parseWebhook', () => {
    it('should parse payment.succeeded event', async () => {
      const rawBody = JSON.stringify({
        event: 'payment.succeeded',
        object: {
          id: 'pay_123',
          status: 'succeeded',
          amount: { value: '19.99', currency: 'RUB' },
          metadata: { userId: 'user_1', planId: 'plan_pro' },
        },
      })

      const event = await provider.parseWebhook(rawBody, {})

      expect(event.type).toBe('payment.succeeded')
      expect(event.providerPaymentId).toBe('pay_123')
      expect(event.amount).toBe(1999)
      expect(event.currency).toBe('rub')
    })

    it('should parse payment.canceled event as payment.failed', async () => {
      const rawBody = JSON.stringify({
        event: 'payment.canceled',
        object: {
          id: 'pay_456',
          status: 'canceled',
          amount: { value: '10.00', currency: 'RUB' },
          metadata: { userId: 'user_2' },
        },
      })

      const event = await provider.parseWebhook(rawBody, {})

      expect(event.type).toBe('payment.failed')
      expect(event.providerPaymentId).toBe('pay_456')
    })

    it('should throw on unhandled event type', async () => {
      const rawBody = JSON.stringify({
        event: 'some.unknown',
        object: { id: 'x' },
      })

      await expect(provider.parseWebhook(rawBody, {})).rejects.toThrow(
        'Unhandled YooKassa event',
      )
    })
  })
})
