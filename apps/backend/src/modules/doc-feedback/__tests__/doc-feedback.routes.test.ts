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
  notifications: { id: 'id', userId: 'userId' },
  docFeedback: { id: 'id', userId: 'userId', pageId: 'pageId', helpful: 'helpful' },
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

vi.mock('../../users/users.repository', () => ({
  usersRepository: {
    findById: vi.fn(),
    findByEmail: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
}))

vi.mock('../doc-feedback.repository', () => ({
  docFeedbackRepository: {
    upsert: vi.fn(),
    getUserVote: vi.fn(),
    getPageStats: vi.fn(),
    getAllStats: vi.fn(),
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
import { usersRepository } from '../../users/users.repository'
import { docFeedbackRepository } from '../doc-feedback.repository'
import jwt from 'jsonwebtoken'

// ─── Helpers ─────────────────────────────────────────────────────────────────

const mockAuthService = vi.mocked(authService)
const mockUsersRepository = vi.mocked(usersRepository)
const mockDocFeedbackRepository = vi.mocked(docFeedbackRepository)

const USER_ID = 'user-test-001'
const ADMIN_USER_ID = 'admin-test-001'

function generateValidJwt(userId = USER_ID, email = 'test@example.com'): string {
  return jwt.sign(
    { sub: userId, email },
    'test-access-secret-key-minimum-32-chars!!',
    { expiresIn: '15m' },
  )
}

// ─── Test suite ──────────────────────────────────────────────────────────────

describe('Doc Feedback Routes — Integration', () => {
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

  // ─── POST /api/doc-feedback ────────────────────────────────────────────────

  describe('POST /api/doc-feedback', () => {
    it('should return 200 when submitting feedback', async () => {
      mockDocFeedbackRepository.upsert.mockResolvedValue('feedback-id-1')
      const token = generateValidJwt()

      const res = await app.inject({
        method: 'POST',
        url: '/api/doc-feedback',
        headers: { authorization: `Bearer ${token}` },
        payload: { pageId: 'getting-started', helpful: true },
      })

      expect(res.statusCode).toBe(200)
      const body = res.json()
      expect(body.data.ok).toBe(true)
      expect(mockDocFeedbackRepository.upsert).toHaveBeenCalledWith(USER_ID, 'getting-started', true)
    })

    it('should return 401 without authorization header', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/doc-feedback',
        payload: { pageId: 'getting-started', helpful: true },
      })

      expect(res.statusCode).toBe(401)
      expect(res.json().error).toBe('UNAUTHORIZED')
    })
  })

  // ─── GET /api/doc-feedback/:pageId ─────────────────────────────────────────

  describe('GET /api/doc-feedback/:pageId', () => {
    it('should return 200 with user vote and page stats', async () => {
      mockDocFeedbackRepository.getUserVote.mockResolvedValue(true)
      mockDocFeedbackRepository.getPageStats.mockResolvedValue({ likes: 10, dislikes: 2 })
      const token = generateValidJwt()

      const res = await app.inject({
        method: 'GET',
        url: '/api/doc-feedback/getting-started',
        headers: { authorization: `Bearer ${token}` },
      })

      expect(res.statusCode).toBe(200)
      const body = res.json()
      expect(body.data.userVote).toBe(true)
      expect(body.data.likes).toBe(10)
      expect(body.data.dislikes).toBe(2)
    })
  })

  // ─── GET /api/doc-feedback/admin/stats ─────────────────────────────────────

  describe('GET /api/doc-feedback/admin/stats', () => {
    it('should return 200 with all stats for admin', async () => {
      // Set up admin auth
      mockAuthService.verifyAccessToken.mockReturnValue({
        sub: ADMIN_USER_ID,
        email: 'admin@example.com',
      } as any)
      mockUsersRepository.findById.mockResolvedValue({
        id: ADMIN_USER_ID,
        email: 'admin@example.com',
        name: 'Admin User',
        role: 'admin',
      } as any)

      const allStats = [
        { pageId: 'getting-started', likes: 10, dislikes: 2, total: 12 },
        { pageId: 'api-reference', likes: 5, dislikes: 1, total: 6 },
      ]
      mockDocFeedbackRepository.getAllStats.mockResolvedValue(allStats)
      const token = generateValidJwt(ADMIN_USER_ID, 'admin@example.com')

      const res = await app.inject({
        method: 'GET',
        url: '/api/doc-feedback/admin/stats',
        headers: { authorization: `Bearer ${token}` },
      })

      expect(res.statusCode).toBe(200)
      const body = res.json()
      expect(body.data).toHaveLength(2)
      expect(body.data[0].pageId).toBe('getting-started')
      expect(mockDocFeedbackRepository.getAllStats).toHaveBeenCalledOnce()
    })

    it('should return 403 for non-admin user', async () => {
      mockUsersRepository.findById.mockResolvedValue({
        id: USER_ID,
        email: 'test@example.com',
        name: 'Regular User',
        role: 'user',
      } as any)
      const token = generateValidJwt()

      const res = await app.inject({
        method: 'GET',
        url: '/api/doc-feedback/admin/stats',
        headers: { authorization: `Bearer ${token}` },
      })

      expect(res.statusCode).toBe(403)
      expect(res.json().error).toBe('FORBIDDEN')
    })
  })
})
