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
}))

vi.mock('../auth.service', () => ({
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
import { authService } from '../auth.service'
import jwt from 'jsonwebtoken'

// ─── Helpers ─────────────────────────────────────────────────────────────────

const mockAuthService = vi.mocked(authService)

const MOCK_USER = {
  id: 'user-test-001',
  email: 'test@example.com',
  name: 'Test User',
  avatarUrl: null,
  bio: null,
  phone: null,
  location: null,
  birthday: null,
  emailVerified: true,
  phoneVerified: false,
  role: 'user',
  features: [],
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  emailEnabled: false,
  smsEnabled: false,
}

const MOCK_TOKENS = {
  accessToken: 'mock.jwt.access-token',
  refreshToken: 'abcdef1234567890',
}

function generateValidJwt(userId = 'user-test-001', email = 'test@example.com'): string {
  return jwt.sign(
    { sub: userId, email },
    'test-access-secret-key-minimum-32-chars!!',
    { expiresIn: '15m' },
  )
}

// ─── Test suite ──────────────────────────────────────────────────────────────

describe('Auth Routes — Integration', () => {
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
  })

  // ─── POST /api/auth/register ────────────────────────────────────────────────

  describe('POST /api/auth/register', () => {
    it('should return 201 with tokens when body is valid', async () => {
      mockAuthService.register.mockResolvedValue(MOCK_TOKENS)

      const res = await app.inject({
        method: 'POST',
        url: '/api/auth/register',
        payload: {
          email: 'new@example.com',
          password: 'StrongPass1!',
          name: 'New User',
        },
      })

      expect(res.statusCode).toBe(201)
      const body = res.json()
      expect(body.data).toHaveProperty('accessToken')
      expect(body.data).toHaveProperty('refreshToken')
      expect(mockAuthService.register).toHaveBeenCalledOnce()
    })

    it('should return 409 when email already exists', async () => {
      const { AppError } = await import('../../../common/errors/app-error')
      mockAuthService.register.mockRejectedValue(
        AppError.conflict('Email already registered'),
      )

      const res = await app.inject({
        method: 'POST',
        url: '/api/auth/register',
        payload: {
          email: 'existing@example.com',
          password: 'StrongPass1!',
          name: 'Existing User',
        },
      })

      expect(res.statusCode).toBe(409)
      const body = res.json()
      expect(body.error).toBe('CONFLICT')
    })

    it('should return 400 when body is invalid (missing name)', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/auth/register',
        payload: {
          email: 'bad@example.com',
          password: 'StrongPass1!',
        },
      })

      expect(res.statusCode).toBe(400)
      expect(res.json().error).toBe('VALIDATION_ERROR')
    })
  })

  // ─── POST /api/auth/login ──────────────────────────────────────────────────

  describe('POST /api/auth/login', () => {
    it('should return 200 with tokens when credentials are valid', async () => {
      mockAuthService.login.mockResolvedValue(MOCK_TOKENS)

      const res = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: {
          email: 'test@example.com',
          password: 'CorrectPassword1!',
        },
      })

      expect(res.statusCode).toBe(200)
      const body = res.json()
      expect(body.data.accessToken).toBe(MOCK_TOKENS.accessToken)
      expect(body.data.refreshToken).toBe(MOCK_TOKENS.refreshToken)
    })

    it('should return 401 when password is wrong', async () => {
      const { AppError } = await import('../../../common/errors/app-error')
      mockAuthService.login.mockRejectedValue(
        AppError.unauthorized('Invalid email or password'),
      )

      const res = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: {
          email: 'test@example.com',
          password: 'WrongPassword!',
        },
      })

      expect(res.statusCode).toBe(401)
      expect(res.json().error).toBe('UNAUTHORIZED')
    })
  })

  // ─── POST /api/auth/refresh ─────────────────────────────────────────────────

  describe('POST /api/auth/refresh', () => {
    it('should return 200 with new tokens when refresh token is valid', async () => {
      const newTokens = {
        accessToken: 'new.access.token',
        refreshToken: 'new-refresh-token',
      }
      mockAuthService.refresh.mockResolvedValue(newTokens)

      const res = await app.inject({
        method: 'POST',
        url: '/api/auth/refresh',
        payload: { refreshToken: 'valid-refresh-token' },
      })

      expect(res.statusCode).toBe(200)
      const body = res.json()
      expect(body.data.accessToken).toBe('new.access.token')
      expect(body.data.refreshToken).toBe('new-refresh-token')
    })

    it('should return 401 when refresh token is invalid', async () => {
      const { AppError } = await import('../../../common/errors/app-error')
      mockAuthService.refresh.mockRejectedValue(
        AppError.unauthorized('Invalid or expired refresh token'),
      )

      const res = await app.inject({
        method: 'POST',
        url: '/api/auth/refresh',
        payload: { refreshToken: 'expired-token' },
      })

      expect(res.statusCode).toBe(401)
    })
  })

  // ─── POST /api/auth/logout ─────────────────────────────────────────────────

  describe('POST /api/auth/logout', () => {
    it('should return 200 when authenticated', async () => {
      mockAuthService.logout.mockResolvedValue(undefined)
      const token = generateValidJwt()

      const res = await app.inject({
        method: 'POST',
        url: '/api/auth/logout',
        headers: { authorization: `Bearer ${token}` },
        payload: { refreshToken: 'some-refresh-token' },
      })

      expect(res.statusCode).toBe(200)
      expect(res.json().data).toHaveProperty('message', 'Logged out')
    })
  })

  // ─── GET /api/auth/me ──────────────────────────────────────────────────────

  describe('GET /api/auth/me', () => {
    it('should return 200 with user profile when JWT is valid', async () => {
      mockAuthService.getMe.mockResolvedValue(MOCK_USER)
      const token = generateValidJwt()

      const res = await app.inject({
        method: 'GET',
        url: '/api/auth/me',
        headers: { authorization: `Bearer ${token}` },
      })

      expect(res.statusCode).toBe(200)
      const body = res.json()
      expect(body.data.email).toBe('test@example.com')
      expect(body.data.name).toBe('Test User')
    })

    it('should return 401 when no Authorization header is provided', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/auth/me',
      })

      expect(res.statusCode).toBe(401)
      expect(res.json().error).toBe('UNAUTHORIZED')
    })

    it('should return 401 when JWT is expired or malformed', async () => {
      const { AppError } = await import('../../../common/errors/app-error')
      mockAuthService.verifyAccessToken.mockImplementation(() => {
        throw AppError.unauthorized('Invalid or expired token')
      })

      const res = await app.inject({
        method: 'GET',
        url: '/api/auth/me',
        headers: { authorization: 'Bearer invalid.jwt.token' },
      })

      expect(res.statusCode).toBe(401)
    })
  })
})
