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
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    offset: vi.fn().mockResolvedValue([]),
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
  notifications: { id: 'id', userId: 'userId', createdAt: 'createdAt', isRead: 'isRead' },
  docFeedback: { id: 'id' },
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

// ─── Imports (after mocks) ───────────────────────────────────────────────────

import { buildApp } from '../../../app'
import { authService } from '../../auth/auth.service'
import { db } from '../../../config/database'
import jwt from 'jsonwebtoken'

// ─── Helpers ─────────────────────────────────────────────────────────────────

const mockAuthService = vi.mocked(authService)
const mockDb = vi.mocked(db) as any

const USER_ID = 'user-test-001'

function generateValidJwt(userId = USER_ID, email = 'test@example.com'): string {
  return jwt.sign(
    { sub: userId, email },
    'test-access-secret-key-minimum-32-chars!!',
    { expiresIn: '15m' },
  )
}

// ─── Test suite ──────────────────────────────────────────────────────────────

describe('Notifications Routes — Integration', () => {
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
    // Default: verifyAccessToken returns valid payload
    mockAuthService.verifyAccessToken.mockReturnValue({
      sub: USER_ID,
      email: 'test@example.com',
    } as any)
  })

  // ─── GET /api/notifications ────────────────────────────────────────────────

  describe('GET /api/notifications', () => {
    it('should return 200 with notifications list', async () => {
      const mockNotifications = [
        { id: 'n1', userId: USER_ID, title: 'Welcome', body: 'Hello!', isRead: false, createdAt: new Date().toISOString() },
        { id: 'n2', userId: USER_ID, title: 'Update', body: 'New feature', isRead: true, createdAt: new Date().toISOString() },
      ]
      // Mock chainable: db.select().from().where().orderBy().limit().offset() → mockNotifications
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue({
                offset: vi.fn().mockResolvedValue(mockNotifications),
              }),
            }),
          }),
        }),
      })
      const token = generateValidJwt()

      const res = await app.inject({
        method: 'GET',
        url: '/api/notifications',
        headers: { authorization: `Bearer ${token}` },
      })

      expect(res.statusCode).toBe(200)
      const body = res.json()
      expect(body.data).toHaveLength(2)
      expect(body.data[0].title).toBe('Welcome')
    })

    it('should return 401 without authorization header', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/notifications',
      })

      expect(res.statusCode).toBe(401)
      expect(res.json().error).toBe('UNAUTHORIZED')
    })

    it('should return 200 with pagination params', async () => {
      const mockNotifications = [
        { id: 'n3', userId: USER_ID, title: 'Page 2 item', body: 'Content', isRead: false, createdAt: new Date().toISOString() },
      ]
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue({
                offset: vi.fn().mockResolvedValue(mockNotifications),
              }),
            }),
          }),
        }),
      })
      const token = generateValidJwt()

      const res = await app.inject({
        method: 'GET',
        url: '/api/notifications?page=2&limit=5',
        headers: { authorization: `Bearer ${token}` },
      })

      expect(res.statusCode).toBe(200)
      const body = res.json()
      expect(body.data).toHaveLength(1)
      expect(body.meta.page).toBe(2)
      expect(body.meta.limit).toBe(5)
    })
  })

  // ─── PATCH /api/notifications/:id/read ─────────────────────────────────────

  describe('PATCH /api/notifications/:id/read', () => {
    it('should return 200 and mark notification as read', async () => {
      // Mock chainable: db.update().set().where() → result
      mockDb.update.mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue({ rowCount: 1 }),
        }),
      })
      const token = generateValidJwt()

      const res = await app.inject({
        method: 'PATCH',
        url: '/api/notifications/n1/read',
        headers: { authorization: `Bearer ${token}` },
      })

      expect(res.statusCode).toBe(200)
      const body = res.json()
      expect(body.data.read).toBe(true)
    })
  })

  // ─── POST /api/notifications/read-all ──────────────────────────────────────

  describe('POST /api/notifications/read-all', () => {
    it('should return 200 and mark all notifications as read', async () => {
      // Mock chainable: db.update().set().where() → result
      mockDb.update.mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue({ rowCount: 5 }),
        }),
      })
      const token = generateValidJwt()

      const res = await app.inject({
        method: 'POST',
        url: '/api/notifications/read-all',
        headers: { authorization: `Bearer ${token}` },
      })

      expect(res.statusCode).toBe(200)
      const body = res.json()
      expect(body.data.readAll).toBe(true)
    })
  })
})
