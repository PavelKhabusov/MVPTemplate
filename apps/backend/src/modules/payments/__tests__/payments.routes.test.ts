import { vi, describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import type { FastifyInstance } from 'fastify'

// ─── Mocks: vi.mock factories are hoisted — no references to outer variables ─

vi.mock('../../../config/redis', () => ({
  redis: {
    get: vi.fn(async () => null),
    set: vi.fn(async () => 'OK'),
    del: vi.fn(async () => 1),
    incr: vi.fn(async () => 1),
    pttl: vi.fn(async () => -1),
    eval: vi.fn(async () => [0, -1]),
    on: vi.fn().mockReturnThis(),
    status: 'ready',
    disconnect: vi.fn(),
    quit: vi.fn(),
    defineCommand: vi.fn(),
    rateLimit: vi.fn((_key: string, _tw: number, _max: number, _ce: boolean, _eb: boolean, cb: Function) => cb(null, [1, -1])),
  },
}))

vi.mock('../../../config/env', () => ({
  env: {
    DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
    REDIS_URL: 'redis://localhost:6379',
    JWT_ACCESS_SECRET: 'test-access-secret-key-minimum-32-chars!!',
    JWT_REFRESH_SECRET: 'test-refresh-secret-key-minimum-32-chars!',
    JWT_ACCESS_EXPIRY: '15m',
    JWT_REFRESH_EXPIRY: '30d',
    PORT: 3000,
    HOST: '0.0.0.0',
    NODE_ENV: 'test',
    CORS_ORIGIN: 'http://localhost:8081',
    EMAIL_ENABLED: false,
    EMAIL_VERIFICATION_REQUIRED: false,
    SMS_ENABLED: false,
    SMS_VERIFICATION_REQUIRED: false,
    ANALYTICS_ENABLED: false,
    REQUEST_LOGGING: false,
    PAYMENTS_ENABLED: true,
    STRIPE_ENABLED: false,
    YOOKASSA_ENABLED: false,
    ROBOKASSA_ENABLED: false,
    ROBOKASSA_TEST_MODE: true,
    PAYPAL_ENABLED: false,
    PAYPAL_MODE: 'sandbox',
    POLAR_ENABLED: false,
    DODO_ENABLED: false,
    PADDLE_ENABLED: false,
    PADDLE_SANDBOX: true,
    PROXY_ENABLED: false,
    AI_PROXY_ENABLED: false,
    STORAGE_TYPE: 'local',
    S3_REGION: 'us-east-1',
    SMTP_PORT: 587,
    SMTP_FROM: 'noreply@example.com',
    APP_URL: 'http://localhost:8081',
    SMS_PROVIDER: 'twilio',
    GEMINI_MODEL: 'gemini-2.5-flash',
    GEMINI_CONCURRENT_LIMIT: 3,
    OPENAI_MODEL: 'gpt-4o-mini',
    OPENAI_MAX_TOKENS: 4096,
  },
}))

vi.mock('../../../config/database', () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue([]),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    returning: vi.fn().mockResolvedValue([]),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
  },
}))

vi.mock('../../../database/schema/index', () => ({
  users: { id: 'id', email: 'email' },
  refreshTokens: { tokenHash: 'tokenHash', userId: 'userId' },
  emailVerificationTokens: { tokenHash: 'tokenHash', userId: 'userId' },
  passwordResetTokens: { tokenHash: 'tokenHash', userId: 'userId' },
  phoneVerificationCodes: { userId: 'userId' },
  companyInfo: { id: 'id' },
  userSettings: { userId: 'userId' },
  plans: { id: 'id' },
  subscriptions: { id: 'id' },
  payments: { id: 'id' },
}))

vi.mock('../../auth/auth.service', () => ({
  authService: {
    register: vi.fn(),
    login: vi.fn(),
    googleAuth: vi.fn(),
    refresh: vi.fn(),
    logout: vi.fn(),
    getMe: vi.fn(),
    verifyEmail: vi.fn(),
    requestPasswordReset: vi.fn(),
    resetPassword: vi.fn(),
    resendVerification: vi.fn(),
    sendPhoneCode: vi.fn(),
    verifyPhone: vi.fn(),
    verifyAccessToken: vi.fn(),
    createTokenPair: vi.fn(),
  },
}))

vi.mock('../payments.service', () => ({
  paymentsService: {
    getPlans: vi.fn(),
    createCheckout: vi.fn(),
    getSubscription: vi.fn(),
    cancelSubscription: vi.fn(),
    getPaymentHistory: vi.fn(),
    handleWebhookEvent: vi.fn(),
    getAdminStats: vi.fn(),
    getAllPlans: vi.fn(),
    createPlan: vi.fn(),
    updatePlan: vi.fn(),
    deletePlan: vi.fn(),
    refundPayment: vi.fn(),
  },
}))

vi.mock('../providers/provider-factory', () => ({
  getPaymentProvider: vi.fn(() => ({
    parseWebhook: vi.fn(),
  })),
}))

vi.mock('../../users/users.repository', () => ({
  usersRepository: {
    findById: vi.fn(),
    findByEmail: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
}))

vi.mock('../../email/email.service', () => ({
  emailService: {
    sendVerificationEmail: vi.fn().mockResolvedValue(undefined),
    sendWelcomeEmail: vi.fn().mockResolvedValue(undefined),
    sendPasswordResetEmail: vi.fn().mockResolvedValue(undefined),
  },
}))

vi.mock('../../sms/sms.service', () => ({
  smsService: { send: vi.fn().mockResolvedValue(undefined) },
}))

// ─── Imports (after mocks) ───────────────────────────────────────────────────

import { buildApp } from '../../../app'
import { authService } from '../../auth/auth.service'
import { paymentsService } from '../payments.service'
import { getPaymentProvider } from '../providers/provider-factory'
import { usersRepository } from '../../users/users.repository'
import jwt from 'jsonwebtoken'

// ─── Helpers ─────────────────────────────────────────────────────────────────

const mockAuthService = vi.mocked(authService)
const mockPaymentsService = vi.mocked(paymentsService)
const mockGetPaymentProvider = vi.mocked(getPaymentProvider)
const mockUsersRepository = vi.mocked(usersRepository)

function generateValidJwt(userId = 'user-test-001', email = 'test@example.com'): string {
  return jwt.sign(
    { sub: userId, email },
    'test-access-secret-key-minimum-32-chars!!',
    { expiresIn: '15m' },
  )
}

const MOCK_PLAN = {
  id: 'plan-001',
  name: 'Pro Monthly',
  description: 'Pro plan billed monthly',
  priceAmount: 999,
  currency: 'usd',
  interval: 'month',
  features: ['feature1', 'feature2'],
  provider: 'stripe',
  providerPriceId: 'price_xxx',
  isActive: true,
  sortOrder: 0,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
}

const MOCK_SUBSCRIPTION = {
  id: 'sub-001',
  userId: 'user-test-001',
  planId: 'plan-001',
  provider: 'stripe',
  providerSubscriptionId: 'sub_xxx',
  status: 'active',
  currentPeriodStart: '2024-01-01T00:00:00.000Z',
  currentPeriodEnd: '2024-02-01T00:00:00.000Z',
  cancelAtPeriodEnd: false,
}

const MOCK_CHECKOUT_RESULT = {
  checkoutUrl: 'https://checkout.stripe.com/session_xxx',
  sessionId: 'session_xxx',
}

// ─── Test suite ──────────────────────────────────────────────────────────────

describe('Payments Routes — Integration', () => {
  let app: FastifyInstance

  beforeAll(async () => {
    app = await buildApp()
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })

  beforeEach(() => {
    vi.clearAllMocks()
    // Default: verifyAccessToken returns valid payload for authenticated routes
    mockAuthService.verifyAccessToken.mockReturnValue({
      sub: 'user-test-001',
      email: 'test@example.com',
    } as any)
    // Default: admin check returns admin user
    mockUsersRepository.findById.mockResolvedValue({
      id: 'user-test-001',
      role: 'admin',
    } as any)
  })

  // ─── GET /api/payments/plans (Public) ───────────────────────────────────────

  describe('GET /api/payments/plans', () => {
    it('should return 200 with plans array', async () => {
      mockPaymentsService.getPlans.mockResolvedValue([MOCK_PLAN] as any)

      const res = await app.inject({
        method: 'GET',
        url: '/api/payments/plans',
      })

      expect(res.statusCode).toBe(200)
      const body = res.json()
      expect(body.data).toHaveLength(1)
      expect(body.data[0].name).toBe('Pro Monthly')
      expect(mockPaymentsService.getPlans).toHaveBeenCalledOnce()
    })

    it('should return 200 with empty array when no plans', async () => {
      mockPaymentsService.getPlans.mockResolvedValue([])

      const res = await app.inject({
        method: 'GET',
        url: '/api/payments/plans',
      })

      expect(res.statusCode).toBe(200)
      const body = res.json()
      expect(body.data).toEqual([])
    })
  })

  // ─── POST /api/payments/checkout (Authenticated) ───────────────────────────

  describe('POST /api/payments/checkout', () => {
    const validCheckoutBody = {
      planId: '550e8400-e29b-41d4-a716-446655440000',
      successUrl: 'https://example.com/success',
      cancelUrl: 'https://example.com/cancel',
    }

    it('should return 200 with checkout result', async () => {
      mockPaymentsService.createCheckout.mockResolvedValue(MOCK_CHECKOUT_RESULT as any)
      const token = generateValidJwt()

      const res = await app.inject({
        method: 'POST',
        url: '/api/payments/checkout',
        headers: { authorization: `Bearer ${token}` },
        payload: validCheckoutBody,
      })

      expect(res.statusCode).toBe(200)
      const body = res.json()
      expect(body.data.checkoutUrl).toBe('https://checkout.stripe.com/session_xxx')
      expect(mockPaymentsService.createCheckout).toHaveBeenCalledWith(
        'user-test-001',
        'test@example.com',
        validCheckoutBody,
      )
    })

    it('should return 401 without auth', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/payments/checkout',
        payload: validCheckoutBody,
      })

      expect(res.statusCode).toBe(401)
      expect(res.json().error).toBe('UNAUTHORIZED')
    })

    it('should return 400 with invalid body (missing planId)', async () => {
      const token = generateValidJwt()

      const res = await app.inject({
        method: 'POST',
        url: '/api/payments/checkout',
        headers: { authorization: `Bearer ${token}` },
        payload: {
          successUrl: 'https://example.com/success',
          cancelUrl: 'https://example.com/cancel',
        },
      })

      expect(res.statusCode).toBe(400)
    })

    it('should return 400 with invalid body (planId not uuid)', async () => {
      const token = generateValidJwt()

      const res = await app.inject({
        method: 'POST',
        url: '/api/payments/checkout',
        headers: { authorization: `Bearer ${token}` },
        payload: {
          planId: 'not-a-uuid',
          successUrl: 'https://example.com/success',
          cancelUrl: 'https://example.com/cancel',
        },
      })

      expect(res.statusCode).toBe(400)
    })
  })

  // ─── GET /api/payments/subscription (Authenticated) ────────────────────────

  describe('GET /api/payments/subscription', () => {
    it('should return 200 with subscription', async () => {
      mockPaymentsService.getSubscription.mockResolvedValue(MOCK_SUBSCRIPTION as any)
      const token = generateValidJwt()

      const res = await app.inject({
        method: 'GET',
        url: '/api/payments/subscription',
        headers: { authorization: `Bearer ${token}` },
      })

      expect(res.statusCode).toBe(200)
      const body = res.json()
      expect(body.data.id).toBe('sub-001')
      expect(body.data.status).toBe('active')
    })

    it('should return 200 with null when no subscription', async () => {
      mockPaymentsService.getSubscription.mockResolvedValue(null as any)
      const token = generateValidJwt()

      const res = await app.inject({
        method: 'GET',
        url: '/api/payments/subscription',
        headers: { authorization: `Bearer ${token}` },
      })

      expect(res.statusCode).toBe(200)
      const body = res.json()
      expect(body.data).toBeNull()
    })
  })

  // ─── POST /api/payments/cancel (Authenticated) ─────────────────────────────

  describe('POST /api/payments/cancel', () => {
    it('should return 200 and cancel subscription', async () => {
      mockPaymentsService.cancelSubscription.mockResolvedValue({ message: 'Subscription cancelled' } as any)
      const token = generateValidJwt()

      const res = await app.inject({
        method: 'POST',
        url: '/api/payments/cancel',
        headers: { authorization: `Bearer ${token}` },
      })

      expect(res.statusCode).toBe(200)
      expect(mockPaymentsService.cancelSubscription).toHaveBeenCalledWith('user-test-001')
    })
  })

  // ─── GET /api/payments/history (Authenticated) ─────────────────────────────

  describe('GET /api/payments/history', () => {
    it('should return 200 with paginated history', async () => {
      mockPaymentsService.getPaymentHistory.mockResolvedValue({
        data: [{ id: 'pay-001', amount: 999 }],
        total: 1,
      } as any)
      const token = generateValidJwt()

      const res = await app.inject({
        method: 'GET',
        url: '/api/payments/history?page=1&limit=10',
        headers: { authorization: `Bearer ${token}` },
      })

      expect(res.statusCode).toBe(200)
      const body = res.json()
      expect(body.data).toHaveLength(1)
      expect(body.pagination).toBeDefined()
      expect(body.pagination.page).toBe(1)
      expect(body.pagination.limit).toBe(10)
      expect(body.pagination.total).toBe(1)
    })
  })

  // ─── Webhooks ──────────────────────────────────────────────────────────────

  describe('POST /api/payments/webhook/stripe', () => {
    it('should return 200 with received: true', async () => {
      const mockEvent = { type: 'checkout.session.completed', data: {} }
      const mockProvider = { parseWebhook: vi.fn().mockResolvedValue(mockEvent) }
      mockGetPaymentProvider.mockReturnValue(mockProvider as any)
      mockPaymentsService.handleWebhookEvent.mockResolvedValue(undefined as any)

      const res = await app.inject({
        method: 'POST',
        url: '/api/payments/webhook/stripe',
        headers: { 'content-type': 'application/json' },
        payload: JSON.stringify({ type: 'checkout.session.completed' }),
      })

      expect(res.statusCode).toBe(200)
      expect(res.json()).toEqual({ received: true })
      expect(mockGetPaymentProvider).toHaveBeenCalledWith('stripe')
    })

    it('should return 400 when parseWebhook throws', async () => {
      const mockProvider = { parseWebhook: vi.fn().mockRejectedValue(new Error('Invalid signature')) }
      mockGetPaymentProvider.mockReturnValue(mockProvider as any)

      const res = await app.inject({
        method: 'POST',
        url: '/api/payments/webhook/stripe',
        headers: { 'content-type': 'application/json' },
        payload: JSON.stringify({ type: 'bad' }),
      })

      expect(res.statusCode).toBe(400)
      expect(res.json().error).toBe('Invalid signature')
    })
  })

  describe('POST /api/payments/webhook/yookassa', () => {
    it('should return 200 with received: true', async () => {
      const mockEvent = { type: 'payment.succeeded', data: {} }
      const mockProvider = { parseWebhook: vi.fn().mockResolvedValue(mockEvent) }
      mockGetPaymentProvider.mockReturnValue(mockProvider as any)
      mockPaymentsService.handleWebhookEvent.mockResolvedValue(undefined as any)

      const res = await app.inject({
        method: 'POST',
        url: '/api/payments/webhook/yookassa',
        headers: { 'content-type': 'application/json' },
        payload: JSON.stringify({ event: 'payment.succeeded' }),
      })

      expect(res.statusCode).toBe(200)
      expect(res.json()).toEqual({ received: true })
      expect(mockGetPaymentProvider).toHaveBeenCalledWith('yookassa')
    })
  })

  describe('POST /api/payments/webhook/robokassa', () => {
    it('should return 200 with OK{InvId}', async () => {
      const mockEvent = { type: 'payment.success', data: {} }
      const mockProvider = { parseWebhook: vi.fn().mockResolvedValue(mockEvent) }
      mockGetPaymentProvider.mockReturnValue(mockProvider as any)
      mockPaymentsService.handleWebhookEvent.mockResolvedValue(undefined as any)

      const formBody = 'InvId=12345&OutSum=1000&SignatureValue=abc123'

      const res = await app.inject({
        method: 'POST',
        url: '/api/payments/webhook/robokassa',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        payload: formBody,
      })

      expect(res.statusCode).toBe(200)
      expect(res.payload).toBe('OK12345')
      expect(mockGetPaymentProvider).toHaveBeenCalledWith('robokassa')
    })
  })

  // ─── Admin routes ──────────────────────────────────────────────────────────

  describe('GET /api/payments/admin/stats', () => {
    it('should return 200 for admin', async () => {
      const mockStats = { totalRevenue: 10000, activeSubscriptions: 5 }
      mockPaymentsService.getAdminStats.mockResolvedValue(mockStats as any)
      const token = generateValidJwt()

      const res = await app.inject({
        method: 'GET',
        url: '/api/payments/admin/stats',
        headers: { authorization: `Bearer ${token}` },
      })

      expect(res.statusCode).toBe(200)
      const body = res.json()
      expect(body.data.totalRevenue).toBe(10000)
      expect(body.data.activeSubscriptions).toBe(5)
    })

    it('should return 403 for non-admin user', async () => {
      mockUsersRepository.findById.mockResolvedValue({
        id: 'user-test-001',
        role: 'user',
      } as any)
      const token = generateValidJwt()

      const res = await app.inject({
        method: 'GET',
        url: '/api/payments/admin/stats',
        headers: { authorization: `Bearer ${token}` },
      })

      expect(res.statusCode).toBe(403)
    })
  })

  describe('GET /api/payments/admin/plans', () => {
    it('should return 200 with all plans for admin', async () => {
      mockPaymentsService.getAllPlans.mockResolvedValue([MOCK_PLAN] as any)
      const token = generateValidJwt()

      const res = await app.inject({
        method: 'GET',
        url: '/api/payments/admin/plans',
        headers: { authorization: `Bearer ${token}` },
      })

      expect(res.statusCode).toBe(200)
      const body = res.json()
      expect(body.data).toHaveLength(1)
      expect(body.data[0].name).toBe('Pro Monthly')
    })
  })

  describe('POST /api/payments/admin/plans', () => {
    it('should return 201 and create plan', async () => {
      const newPlan = {
        name: 'Enterprise',
        priceAmount: 4999,
        currency: 'usd',
        interval: 'month' as const,
        provider: 'stripe' as const,
        features: ['all'],
      }
      mockPaymentsService.createPlan.mockResolvedValue({ id: 'plan-new', ...newPlan } as any)
      const token = generateValidJwt()

      const res = await app.inject({
        method: 'POST',
        url: '/api/payments/admin/plans',
        headers: { authorization: `Bearer ${token}` },
        payload: newPlan,
      })

      expect(res.statusCode).toBe(201)
      const body = res.json()
      expect(body.data.name).toBe('Enterprise')
      expect(mockPaymentsService.createPlan).toHaveBeenCalledOnce()
    })
  })

  describe('PATCH /api/payments/admin/plans/:id', () => {
    it('should return 200 and update plan', async () => {
      mockPaymentsService.updatePlan.mockResolvedValue({ ...MOCK_PLAN, name: 'Pro Plus' } as any)
      const token = generateValidJwt()

      const res = await app.inject({
        method: 'PATCH',
        url: '/api/payments/admin/plans/plan-001',
        headers: { authorization: `Bearer ${token}` },
        payload: { name: 'Pro Plus' },
      })

      expect(res.statusCode).toBe(200)
      const body = res.json()
      expect(body.data.name).toBe('Pro Plus')
      expect(mockPaymentsService.updatePlan).toHaveBeenCalledWith('plan-001', { name: 'Pro Plus' })
    })
  })

  describe('DELETE /api/payments/admin/plans/:id', () => {
    it('should return 200 and delete plan', async () => {
      mockPaymentsService.deletePlan.mockResolvedValue(undefined as any)
      const token = generateValidJwt()

      const res = await app.inject({
        method: 'DELETE',
        url: '/api/payments/admin/plans/plan-001',
        headers: { authorization: `Bearer ${token}` },
      })

      expect(res.statusCode).toBe(200)
      const body = res.json()
      expect(body.data.message).toBe('Plan deleted')
      expect(mockPaymentsService.deletePlan).toHaveBeenCalledWith('plan-001')
    })
  })

  describe('POST /api/payments/admin/refund/:paymentId', () => {
    it('should return 200 and refund payment', async () => {
      mockPaymentsService.refundPayment.mockResolvedValue({ refunded: true, amount: 999 } as any)
      const token = generateValidJwt()

      const res = await app.inject({
        method: 'POST',
        url: '/api/payments/admin/refund/pay-001',
        headers: { authorization: `Bearer ${token}` },
        payload: { amount: 500 },
      })

      expect(res.statusCode).toBe(200)
      const body = res.json()
      expect(body.data.refunded).toBe(true)
      expect(mockPaymentsService.refundPayment).toHaveBeenCalledWith('pay-001', 500)
    })
  })
})
