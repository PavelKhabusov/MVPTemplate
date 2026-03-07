import { vi, describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import type { FastifyInstance } from 'fastify'

// ─── vi.hoisted: variables available inside vi.mock factories ────────────────

const { testEnv, mockDbWhere } = vi.hoisted(() => {
  const testEnv = {
    DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
    REDIS_URL: 'redis://localhost:6379',
    JWT_ACCESS_SECRET: 'test-access-secret-key-minimum-32-chars!!',
    JWT_REFRESH_SECRET: 'test-refresh-secret-key-minimum-32-chars!',
    JWT_ACCESS_EXPIRY: '15m',
    JWT_REFRESH_EXPIRY: '30d',
    PORT: 3000,
    HOST: '0.0.0.0',
    NODE_ENV: 'test' as string,
    CORS_ORIGIN: 'http://localhost:8081',
    EMAIL_ENABLED: false as boolean,
    EMAIL_VERIFICATION_REQUIRED: false as boolean,
    SMS_ENABLED: false,
    SMS_VERIFICATION_REQUIRED: false,
    ANALYTICS_ENABLED: false as boolean,
    REQUEST_LOGGING: false as boolean,
    PAYMENTS_ENABLED: false as boolean,
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
    EXPO_ACCESS_TOKEN: undefined as string | undefined,
    GOOGLE_CLIENT_ID: undefined as string | undefined,
  }

  // We need a reference-stable mock fn that can be used inside vi.mock factory
  // vi.fn() works inside vi.hoisted because vitest injects `vi` globally
  const mockDbWhere = (globalThis as any).__vitest_mocker__
    ? vi.fn().mockResolvedValue([])
    : { mockResolvedValue: () => {}, mockResolvedValueOnce: () => {} }

  return { testEnv, mockDbWhere: vi.fn().mockResolvedValue([]) }
})

// ─── Mocks ───────────────────────────────────────────────────────────────────

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

vi.mock('../../../config/env', () => ({ env: testEnv }))

vi.mock('../../../config/database', () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: mockDbWhere,
      })),
    })),
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

// ─── Imports ─────────────────────────────────────────────────────────────────

import { buildApp } from '../../../app'

// ─── Test suite ──────────────────────────────────────────────────────────────

describe('Config Routes — Integration', () => {
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
  })

  // ─── GET /api/config/flags ──────────────────────────────────────────────────

  describe('GET /api/config/flags', () => {
    it('should return 200 with feature flags based on env', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/config/flags',
      })

      expect(res.statusCode).toBe(200)
      const body = res.json()
      expect(body.data).toEqual({
        email: false,
        emailVerification: false,
        googleAuth: false,
        requestLogging: false,
        analytics: false,
        pushNotifications: false,
        payments: false,
      })
    })

    it('should reflect changed env values', async () => {
      // Temporarily enable some flags
      testEnv.EMAIL_ENABLED = true
      testEnv.PAYMENTS_ENABLED = true
      testEnv.GOOGLE_CLIENT_ID = 'some-client-id'
      testEnv.EXPO_ACCESS_TOKEN = 'some-expo-token'

      const res = await app.inject({
        method: 'GET',
        url: '/api/config/flags',
      })

      expect(res.statusCode).toBe(200)
      const body = res.json()
      expect(body.data.email).toBe(true)
      expect(body.data.payments).toBe(true)
      expect(body.data.googleAuth).toBe(true)
      expect(body.data.pushNotifications).toBe(true)

      // Restore
      testEnv.EMAIL_ENABLED = false
      testEnv.PAYMENTS_ENABLED = false
      testEnv.GOOGLE_CLIENT_ID = undefined
      testEnv.EXPO_ACCESS_TOKEN = undefined
    })
  })

  // ─── GET /api/config/company ────────────────────────────────────────────────

  describe('GET /api/config/company', () => {
    it('should return 200 with company info from database', async () => {
      const mockCompanyInfo = {
        id: 1,
        appName: 'TestApp',
        companyName: 'TestCo',
        tagline: 'Build fast',
        supportEmail: 'support@test.com',
        website: 'https://test.com',
        phone: '+1234567890',
        address: '123 Test St',
        updatedAt: new Date('2024-06-01'),
      }
      mockDbWhere.mockResolvedValueOnce([mockCompanyInfo])

      const res = await app.inject({
        method: 'GET',
        url: '/api/config/company',
      })

      expect(res.statusCode).toBe(200)
      const body = res.json()
      expect(body.data.appName).toBe('TestApp')
      expect(body.data.companyName).toBe('TestCo')
    })

    it('should return default company info when database row is empty', async () => {
      mockDbWhere.mockResolvedValueOnce([])

      const res = await app.inject({
        method: 'GET',
        url: '/api/config/company',
      })

      expect(res.statusCode).toBe(200)
      const body = res.json()
      expect(body.data.id).toBe(1)
      expect(body.data.appName).toBe('CallSheet')
    })
  })
})
