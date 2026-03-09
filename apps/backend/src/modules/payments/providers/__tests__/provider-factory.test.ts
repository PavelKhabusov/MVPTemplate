import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock env before importing the factory
const mockEnv: Record<string, unknown> = {}
vi.mock('../../../../config/env', () => ({
  get env() {
    return mockEnv
  },
}))

// Mock all provider constructors to avoid real SDK init
vi.mock('../stripe.provider', () => ({
  StripeProvider: vi.fn().mockImplementation(() => ({ name: 'stripe' })),
}))
vi.mock('../yookassa.provider', () => ({
  YooKassaProvider: vi.fn().mockImplementation(() => ({ name: 'yookassa' })),
}))
vi.mock('../robokassa.provider', () => ({
  RobokassaProvider: vi.fn().mockImplementation(() => ({ name: 'robokassa' })),
}))
vi.mock('../paypal.provider', () => ({
  PayPalProvider: vi.fn().mockImplementation(() => ({ name: 'paypal' })),
}))
vi.mock('../polar.provider', () => ({
  PolarProvider: vi.fn().mockImplementation(() => ({ name: 'polar' })),
}))
vi.mock('../dodo.provider', () => ({
  DodoProvider: vi.fn().mockImplementation(() => ({ name: 'dodopayment' })),
}))
vi.mock('../paddle.provider', () => ({
  PaddleProvider: vi.fn().mockImplementation(() => ({ name: 'paddle' })),
}))

// Must use dynamic import to get fresh module state per test
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { getPaymentProvider, getEnabledProviders } = await import('../provider-factory')

describe('provider-factory', () => {
  beforeEach(() => {
    // Reset all env keys
    for (const key of Object.keys(mockEnv)) {
      delete mockEnv[key]
    }
  })

  describe('getPaymentProvider', () => {
    it('should return StripeProvider when stripe is enabled and configured', () => {
      mockEnv.STRIPE_ENABLED = true
      mockEnv.STRIPE_SECRET_KEY = 'sk_test_xxx'
      mockEnv.STRIPE_WEBHOOK_SECRET = 'whsec_xxx'

      const provider = getPaymentProvider('stripe')
      expect(provider.name).toBe('stripe')
    })

    it('should throw when stripe is disabled', () => {
      mockEnv.STRIPE_ENABLED = false
      expect(() => getPaymentProvider('stripe')).toThrow('Stripe is disabled')
    })

    it('should throw when stripe keys are missing', () => {
      mockEnv.STRIPE_ENABLED = true
      mockEnv.STRIPE_SECRET_KEY = ''
      mockEnv.STRIPE_WEBHOOK_SECRET = ''
      expect(() => getPaymentProvider('stripe')).toThrow('Stripe is not configured')
    })

    it('should throw for unknown provider', () => {
      expect(() => getPaymentProvider('nonexistent' as any)).toThrow('Unknown payment provider')
    })

    it('should return PaddleProvider when paddle is enabled and configured', () => {
      mockEnv.PADDLE_ENABLED = true
      mockEnv.PADDLE_API_KEY = 'pad_test_xxx'
      mockEnv.PADDLE_WEBHOOK_SECRET = 'pdl_whsec_xxx'
      mockEnv.PADDLE_SANDBOX = true

      const provider = getPaymentProvider('paddle')
      expect(provider.name).toBe('paddle')
    })

    it('should return YooKassaProvider when yookassa is enabled and configured', () => {
      mockEnv.YOOKASSA_ENABLED = true
      mockEnv.YOOKASSA_SHOP_ID = 'shop_123'
      mockEnv.YOOKASSA_SECRET_KEY = 'secret_xxx'

      const provider = getPaymentProvider('yookassa')
      expect(provider.name).toBe('yookassa')
    })
  })

  describe('getEnabledProviders', () => {
    it('should return empty array when nothing is enabled', () => {
      expect(getEnabledProviders()).toEqual([])
    })

    it('should return only enabled and configured providers', () => {
      mockEnv.STRIPE_ENABLED = true
      mockEnv.STRIPE_SECRET_KEY = 'sk_test_xxx'
      mockEnv.PAYPAL_ENABLED = true
      mockEnv.PAYPAL_CLIENT_ID = 'client_id'
      mockEnv.YOOKASSA_ENABLED = false

      const providers = getEnabledProviders()
      expect(providers).toContain('stripe')
      expect(providers).toContain('paypal')
      expect(providers).not.toContain('yookassa')
    })

    it('should not include provider when enabled but key is missing', () => {
      mockEnv.STRIPE_ENABLED = true
      mockEnv.STRIPE_SECRET_KEY = '' // falsy

      const providers = getEnabledProviders()
      expect(providers).not.toContain('stripe')
    })

    it('should return all 7 providers when all are enabled and configured', () => {
      mockEnv.STRIPE_ENABLED = true
      mockEnv.STRIPE_SECRET_KEY = 'sk_test_xxx'
      mockEnv.YOOKASSA_ENABLED = true
      mockEnv.YOOKASSA_SHOP_ID = 'shop_123'
      mockEnv.ROBOKASSA_ENABLED = true
      mockEnv.ROBOKASSA_MERCHANT_LOGIN = 'merchant'
      mockEnv.PAYPAL_ENABLED = true
      mockEnv.PAYPAL_CLIENT_ID = 'client_id'
      mockEnv.POLAR_ENABLED = true
      mockEnv.POLAR_ACCESS_TOKEN = 'pat_xxx'
      mockEnv.DODO_ENABLED = true
      mockEnv.DODO_API_KEY = 'dodo_xxx'
      mockEnv.PADDLE_ENABLED = true
      mockEnv.PADDLE_API_KEY = 'pad_xxx'

      const providers = getEnabledProviders()
      expect(providers).toHaveLength(7)
    })
  })
})
