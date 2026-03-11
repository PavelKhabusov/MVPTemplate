/**
 * API Contract Tests — Snapshot-based regression tests for response shapes.
 *
 * These tests verify that API response structures don't change unexpectedly.
 * If a response shape changes intentionally, update the snapshots:
 *   npx vitest -u --project backend -- api-contracts
 */
import { vi, describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import type { FastifyInstance } from 'fastify'

// ─── Mocks ───────────────────────────────────────────────────────────────────

const { testEnv, mockDbWhere } = vi.hoisted(() => {
  return {
    testEnv: {
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
      EXPO_ACCESS_TOKEN: undefined as string | undefined,
      GOOGLE_CLIENT_ID: undefined as string | undefined,
    },
    mockDbWhere: vi.fn().mockResolvedValue([]),
  }
})

vi.mock('../../config/redis', () => ({
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

vi.mock('../../config/env', () => ({ env: testEnv }))

vi.mock('../../config/database', () => ({
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

vi.mock('../../database/schema/index', () => ({
  users: { id: 'id', email: 'email' },
  refreshTokens: { tokenHash: 'tokenHash', userId: 'userId' },
  emailVerificationTokens: { tokenHash: 'tokenHash', userId: 'userId' },
  passwordResetTokens: { tokenHash: 'tokenHash', userId: 'userId' },
  phoneVerificationCodes: { userId: 'userId' },
  companyInfo: { id: 'id' },
  userSettings: { userId: 'userId' },
}))

vi.mock('../../modules/auth/auth.service', () => ({
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

vi.mock('../../modules/users/users.repository', () => ({
  usersRepository: {
    findById: vi.fn(),
    updateProfile: vi.fn(),
    getSettings: vi.fn(),
    upsertSettings: vi.fn(),
  },
}))

vi.mock('../../modules/email/email.service', () => ({
  emailService: {
    sendVerificationEmail: vi.fn().mockResolvedValue(undefined),
    sendWelcomeEmail: vi.fn().mockResolvedValue(undefined),
    sendPasswordResetEmail: vi.fn().mockResolvedValue(undefined),
  },
}))

vi.mock('../../modules/sms/sms.service', () => ({
  smsService: { send: vi.fn().mockResolvedValue(undefined) },
}))

// ─── Imports ─────────────────────────────────────────────────────────────────

import { buildApp } from '../../app'
import { authService } from '../../modules/auth/auth.service'
import { usersRepository } from '../../modules/users/users.repository'
import jwt from 'jsonwebtoken'

// ─── Helpers ─────────────────────────────────────────────────────────────────

const mockAuth = vi.mocked(authService)
const mockUsersRepo = vi.mocked(usersRepository)

function generateValidJwt(userId = 'user-test-001', email = 'test@example.com'): string {
  return jwt.sign(
    { sub: userId, email },
    'test-access-secret-key-minimum-32-chars!!',
    { expiresIn: '15m' },
  )
}

/** Replace volatile values (dates, tokens, IDs) with stable placeholders */
function stabilize(obj: any): any {
  const json = JSON.stringify(obj)
  return JSON.parse(
    json
      .replace(/"\d{4}-\d{2}-\d{2}T[\d:.]+Z"/g, '"__ISO_DATE__"')
      .replace(/"[a-f0-9-]{36}"/g, '"__UUID__"')
      .replace(/"ey[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+"/g, '"__JWT__"'),
  )
}

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
} as any

const MOCK_TOKENS = {
  accessToken: 'mock.jwt.access-token',
  refreshToken: 'abcdef1234567890',
}

// ─── Contract tests ─────────────────────────────────────────────────────────

describe('API Contract Tests — Response Shape Snapshots', () => {
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
    mockAuth.verifyAccessToken.mockReturnValue({
      sub: 'user-test-001',
      email: 'test@example.com',
    } as any)
  })

  // ─── Auth contracts ─────────────────────────────────────────────────────────

  describe('Auth response contracts', () => {
    it('POST /api/auth/register — 201 response shape', async () => {
      mockAuth.register.mockResolvedValue(MOCK_TOKENS)

      const res = await app.inject({
        method: 'POST',
        url: '/api/auth/register',
        payload: { email: 'new@example.com', password: 'StrongPass1!', name: 'New User' },
      })

      expect(res.statusCode).toBe(201)
      expect(Object.keys(res.json().data).sort()).toMatchSnapshot()
    })

    it('POST /api/auth/login — 200 response shape', async () => {
      mockAuth.login.mockResolvedValue(MOCK_TOKENS)

      const res = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: { email: 'test@example.com', password: 'CorrectPass1!' },
      })

      expect(res.statusCode).toBe(200)
      expect(Object.keys(res.json().data).sort()).toMatchSnapshot()
    })

    it('GET /api/auth/me — 200 response shape', async () => {
      mockAuth.getMe.mockResolvedValue(MOCK_USER)
      const token = generateValidJwt()

      const res = await app.inject({
        method: 'GET',
        url: '/api/auth/me',
        headers: { authorization: `Bearer ${token}` },
      })

      expect(res.statusCode).toBe(200)
      expect(Object.keys(res.json().data).sort()).toMatchSnapshot()
    })

    it('POST /api/auth/register — 400 error shape', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/auth/register',
        payload: { email: 'bad' }, // invalid
      })

      expect(res.statusCode).toBe(400)
      const body = res.json()
      expect(Object.keys(body).sort()).toMatchSnapshot()
      expect(body.error).toBe('VALIDATION_ERROR')
    })
  })

  // ─── Users contracts ────────────────────────────────────────────────────────

  describe('Users response contracts', () => {
    it('GET /api/users/profile — 200 response shape', async () => {
      mockUsersRepo.findById.mockResolvedValue({
        ...MOCK_USER,
        passwordHash: '$2b$12$hash',
        voximplantLogin: null,
        voximplantPassword: null,
        voximplantAppId: null,
      })
      const token = generateValidJwt()

      const res = await app.inject({
        method: 'GET',
        url: '/api/users/profile',
        headers: { authorization: `Bearer ${token}` },
      })

      expect(res.statusCode).toBe(200)
      expect(Object.keys(res.json().data).sort()).toMatchSnapshot()
    })

    it('GET /api/users/profile — 401 error shape', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/users/profile',
      })

      expect(res.statusCode).toBe(401)
      expect(Object.keys(res.json()).sort()).toMatchSnapshot()
    })
  })

  // ─── Config contracts ───────────────────────────────────────────────────────

  describe('Config response contracts', () => {
    it('GET /api/config/flags — 200 response shape', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/config/flags',
      })

      expect(res.statusCode).toBe(200)
      expect(Object.keys(res.json().data).sort()).toMatchSnapshot()
    })

    it('GET /api/config/company — 200 response shape', async () => {
      mockDbWhere.mockResolvedValueOnce([{
        id: 1,
        appName: 'TestApp',
        companyName: 'TestCo',
        tagline: 'Build fast',
        supportEmail: 'support@test.com',
        website: 'https://test.com',
        phone: '+1234567890',
        address: '123 Test St',
        updatedAt: new Date('2024-06-01'),
      }])

      const res = await app.inject({
        method: 'GET',
        url: '/api/config/company',
      })

      expect(res.statusCode).toBe(200)
      expect(Object.keys(stabilize(res.json().data)).sort()).toMatchSnapshot()
    })
  })

  // ─── Health ─────────────────────────────────────────────────────────────────

  describe('Health response contract', () => {
    it('GET /health — 200 response shape', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/health',
      })

      expect(res.statusCode).toBe(200)
      expect(Object.keys(res.json()).sort()).toMatchSnapshot()
    })
  })
})
