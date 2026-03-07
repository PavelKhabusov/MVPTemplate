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
    PAYMENTS_ENABLED: false,
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
    execute: vi.fn().mockResolvedValue([]),
  },
}))

vi.mock('../../../database/schema/index', () => ({
  users: { id: 'id', email: 'email', name: 'name' },
  refreshTokens: { tokenHash: 'tokenHash', userId: 'userId' },
  emailVerificationTokens: { tokenHash: 'tokenHash', userId: 'userId' },
  passwordResetTokens: { tokenHash: 'tokenHash', userId: 'userId' },
  phoneVerificationCodes: { userId: 'userId' },
  companyInfo: { id: 'id' },
  userSettings: { userId: 'userId' },
  pushTokens: { userId: 'userId', token: 'token', platform: 'platform' },
  notifications: { id: 'id', userId: 'userId', title: 'title', body: 'body', type: 'type', createdAt: 'createdAt' },
}))

vi.mock('../../auth/auth.service', () => ({
  authService: {
    verifyAccessToken: vi.fn(),
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
    createTokenPair: vi.fn(),
  },
}))

vi.mock('../../users/users.repository', () => ({
  usersRepository: {
    findById: vi.fn(),
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

vi.mock('../../push/push.service', () => ({
  sendToUsers: vi.fn(),
}))

// ─── Imports (after mocks) ───────────────────────────────────────────────────

import { buildApp } from '../../../app'
import { authService } from '../../auth/auth.service'
import { db } from '../../../config/database'
import jwt from 'jsonwebtoken'

// ─── Helpers ─────────────────────────────────────────────────────────────────

const mockAuthService = vi.mocked(authService)
const mockDb = vi.mocked(db)

function generateValidJwt(userId = 'user-test-001', email = 'test@example.com'): string {
  return jwt.sign(
    { sub: userId, email },
    'test-access-secret-key-minimum-32-chars!!',
    { expiresIn: '15m' },
  )
}

// ─── Test suite ──────────────────────────────────────────────────────────────

describe('Search Routes — Integration', () => {
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
    mockAuthService.verifyAccessToken.mockReturnValue({
      sub: 'user-test-001',
      email: 'test@example.com',
    } as any)
  })

  // ─── GET /api/search ───────────────────────────────────────────────────────

  describe('GET /api/search', () => {
    it('should return 200 with results when authenticated', async () => {
      const token = generateValidJwt()
      const mockResults = [
        { id: 'u1', name: 'Test User', avatar_url: null, rank: 0.5 },
      ]
      mockDb.execute.mockResolvedValue(mockResults as any)

      const res = await app.inject({
        method: 'GET',
        url: '/api/search?q=test',
        headers: { authorization: `Bearer ${token}` },
      })

      expect(res.statusCode).toBe(200)
      const body = res.json()
      expect(body.data).toEqual(mockResults)
    })

    it('should return 401 without authorization header', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/search?q=test',
      })

      expect(res.statusCode).toBe(401)
      expect(res.json().error).toBe('UNAUTHORIZED')
    })

    it('should return 200 with empty array when q is missing (safeParse fails gracefully)', async () => {
      const token = generateValidJwt()

      const res = await app.inject({
        method: 'GET',
        url: '/api/search',
        headers: { authorization: `Bearer ${token}` },
      })

      // The route uses safeParse and returns empty array on failure
      expect(res.statusCode).toBe(200)
      const body = res.json()
      expect(body.data).toEqual([])
    })

    it('should return 200 with filtered results when type and limit are provided', async () => {
      const token = generateValidJwt()
      const mockResults = [
        { id: 'u1', name: 'Alice', avatar_url: null, rank: 0.8 },
        { id: 'u2', name: 'Bob', avatar_url: null, rank: 0.6 },
      ]
      mockDb.execute.mockResolvedValue(mockResults as any)

      const res = await app.inject({
        method: 'GET',
        url: '/api/search?q=test&type=users&limit=5',
        headers: { authorization: `Bearer ${token}` },
      })

      expect(res.statusCode).toBe(200)
      const body = res.json()
      expect(body.data).toEqual(mockResults)
      expect(mockDb.execute).toHaveBeenCalledOnce()
    })
  })
})
