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
    limit: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    returning: vi.fn().mockResolvedValue([]),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    execute: vi.fn().mockResolvedValue([]),
    groupBy: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    offset: vi.fn().mockResolvedValue([]),
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

vi.mock('../push.service', () => ({
  sendToUsers: vi.fn(),
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
import { usersRepository } from '../../users/users.repository'
import { sendToUsers } from '../push.service'
import jwt from 'jsonwebtoken'

// ─── Helpers ─────────────────────────────────────────────────────────────────

const mockAuthService = vi.mocked(authService)
const mockUsersRepository = vi.mocked(usersRepository)
const mockSendToUsers = vi.mocked(sendToUsers)

function generateValidJwt(userId = 'user-test-001', email = 'test@example.com'): string {
  return jwt.sign(
    { sub: userId, email },
    'test-access-secret-key-minimum-32-chars!!',
    { expiresIn: '15m' },
  )
}

// ─── Test suite ──────────────────────────────────────────────────────────────

describe('Push Routes — Integration', () => {
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

  // ─── POST /api/push/register ────────────────────────────────────────────────

  describe('POST /api/push/register', () => {
    it('should return 200 and register push token when authenticated', async () => {
      const token = generateValidJwt()

      const res = await app.inject({
        method: 'POST',
        url: '/api/push/register',
        headers: { authorization: `Bearer ${token}` },
        payload: { token: 'ExponentPushToken[abc123]', platform: 'ios' },
      })

      expect(res.statusCode).toBe(200)
      const body = res.json()
      expect(body.data).toHaveProperty('registered', true)
    })

    it('should return 401 without authorization header', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/push/register',
        payload: { token: 'ExponentPushToken[abc123]', platform: 'ios' },
      })

      expect(res.statusCode).toBe(401)
      expect(res.json().error).toBe('UNAUTHORIZED')
    })

    it('should return 400 when platform is invalid', async () => {
      const token = generateValidJwt()

      const res = await app.inject({
        method: 'POST',
        url: '/api/push/register',
        headers: { authorization: `Bearer ${token}` },
        payload: { token: 'ExponentPushToken[abc123]', platform: 'windows' },
      })

      expect(res.statusCode).toBe(400)
    })
  })

  // ─── DELETE /api/push/unregister ────────────────────────────────────────────

  describe('DELETE /api/push/unregister', () => {
    it('should return 200 and unregister when authenticated', async () => {
      const token = generateValidJwt()

      const res = await app.inject({
        method: 'DELETE',
        url: '/api/push/unregister',
        headers: { authorization: `Bearer ${token}` },
      })

      expect(res.statusCode).toBe(200)
      const body = res.json()
      expect(body.data).toHaveProperty('unregistered', true)
    })
  })

  // ─── POST /api/push/send ───────────────────────────────────────────────────

  describe('POST /api/push/send', () => {
    it('should return 200 when admin sends notification', async () => {
      const token = generateValidJwt()
      mockUsersRepository.findById.mockResolvedValue({ role: 'admin' } as any)
      mockSendToUsers.mockResolvedValue({ sent: 5, failed: 0, total: 5 })

      const res = await app.inject({
        method: 'POST',
        url: '/api/push/send',
        headers: { authorization: `Bearer ${token}` },
        payload: { title: 'Test Notification', body: 'Hello everyone' },
      })

      expect(res.statusCode).toBe(200)
      const body = res.json()
      expect(body.data).toEqual({ sent: 5, failed: 0, total: 5 })
      expect(mockSendToUsers).toHaveBeenCalledOnce()
    })

    it('should return 403 when non-admin tries to send', async () => {
      const token = generateValidJwt()
      mockUsersRepository.findById.mockResolvedValue({ role: 'user' } as any)

      const res = await app.inject({
        method: 'POST',
        url: '/api/push/send',
        headers: { authorization: `Bearer ${token}` },
        payload: { title: 'Test Notification' },
      })

      expect(res.statusCode).toBe(403)
      expect(res.json().error).toBe('FORBIDDEN')
    })

    it('should return 401 without authorization header', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/push/send',
        payload: { title: 'Test Notification' },
      })

      expect(res.statusCode).toBe(401)
      expect(res.json().error).toBe('UNAUTHORIZED')
    })
  })

  // ─── GET /api/push/history ──────────────────────────────────────────────────

  describe('GET /api/push/history', () => {
    it('should return 200 with paginated history for admin', async () => {
      const token = generateValidJwt()
      mockUsersRepository.findById.mockResolvedValue({ role: 'admin' } as any)

      const res = await app.inject({
        method: 'GET',
        url: '/api/push/history?page=1&limit=10',
        headers: { authorization: `Bearer ${token}` },
      })

      expect(res.statusCode).toBe(200)
      const body = res.json()
      expect(body).toHaveProperty('data')
      expect(body).toHaveProperty('pagination')
    })

    it('should return 403 for non-admin user', async () => {
      const token = generateValidJwt()
      mockUsersRepository.findById.mockResolvedValue({ role: 'user' } as any)

      const res = await app.inject({
        method: 'GET',
        url: '/api/push/history',
        headers: { authorization: `Bearer ${token}` },
      })

      expect(res.statusCode).toBe(403)
      expect(res.json().error).toBe('FORBIDDEN')
    })
  })
})
