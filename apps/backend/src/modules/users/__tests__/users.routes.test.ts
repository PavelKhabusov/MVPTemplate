import { vi, describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import type { FastifyInstance } from 'fastify'

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

vi.mock('../users.repository', () => ({
  usersRepository: {
    findById: vi.fn(),
    updateProfile: vi.fn(),
    getSettings: vi.fn(),
    upsertSettings: vi.fn(),
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
import { authService } from '../../auth/auth.service'
import { usersRepository } from '../users.repository'
import jwt from 'jsonwebtoken'

// ─── Helpers ─────────────────────────────────────────────────────────────────

const mockAuthService = vi.mocked(authService)
const mockUsersRepo = vi.mocked(usersRepository)

const MOCK_USER_FULL = {
  id: 'user-test-001',
  email: 'test@example.com',
  passwordHash: '$2b$12$some_hash',
  name: 'Test User',
  avatarUrl: null as string | null,
  bio: 'Hello world' as string | null,
  phone: null as string | null,
  location: null as string | null,
  birthday: null as string | null,
  emailVerified: true,
  phoneVerified: false,
  role: 'user' as const,
  features: [] as string[],
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
} as any

function generateValidJwt(userId = 'user-test-001', email = 'test@example.com'): string {
  return jwt.sign(
    { sub: userId, email },
    'test-access-secret-key-minimum-32-chars!!',
    { expiresIn: '15m' },
  )
}

// ─── Test suite ──────────────────────────────────────────────────────────────

describe('Users Routes — Integration', () => {
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

  // ─── GET /api/users/profile ─────────────────────────────────────────────────

  describe('GET /api/users/profile', () => {
    it('should return 200 with user profile when authenticated', async () => {
      mockUsersRepo.findById.mockResolvedValue(MOCK_USER_FULL)
      const token = generateValidJwt()

      const res = await app.inject({
        method: 'GET',
        url: '/api/users/profile',
        headers: { authorization: `Bearer ${token}` },
      })

      expect(res.statusCode).toBe(200)
      const body = res.json()
      expect(body.data.email).toBe('test@example.com')
      expect(body.data.name).toBe('Test User')
      // passwordHash must be stripped
      expect(body.data).not.toHaveProperty('passwordHash')
    })

    it('should return 401 when no auth header is provided', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/users/profile',
      })

      expect(res.statusCode).toBe(401)
      expect(res.json().error).toBe('UNAUTHORIZED')
    })

    it('should return 404 when user is not found in database', async () => {
      mockUsersRepo.findById.mockResolvedValue(null as any)
      const token = generateValidJwt()

      const res = await app.inject({
        method: 'GET',
        url: '/api/users/profile',
        headers: { authorization: `Bearer ${token}` },
      })

      expect(res.statusCode).toBe(404)
      expect(res.json().error).toBe('NOT_FOUND')
    })
  })

  // ─── PATCH /api/users/profile ──────────────────────────────────────────────

  describe('PATCH /api/users/profile', () => {
    it('should return 200 with updated profile when body is valid', async () => {
      const updatedUser = { ...MOCK_USER_FULL, name: 'Updated Name' }
      mockUsersRepo.updateProfile.mockResolvedValue(updatedUser)
      const token = generateValidJwt()

      const res = await app.inject({
        method: 'PATCH',
        url: '/api/users/profile',
        headers: { authorization: `Bearer ${token}` },
        payload: { name: 'Updated Name' },
      })

      expect(res.statusCode).toBe(200)
      const body = res.json()
      expect(body.data.name).toBe('Updated Name')
      expect(body.data).not.toHaveProperty('passwordHash')
      expect(mockUsersRepo.updateProfile).toHaveBeenCalledWith(
        'user-test-001',
        { name: 'Updated Name' },
      )
    })

    it('should return 400 when body has invalid fields', async () => {
      const token = generateValidJwt()

      const res = await app.inject({
        method: 'PATCH',
        url: '/api/users/profile',
        headers: { authorization: `Bearer ${token}` },
        payload: {
          name: '', // empty string fails min(1)
        },
      })

      expect(res.statusCode).toBe(400)
      expect(res.json().error).toBe('VALIDATION_ERROR')
    })

    it('should return 401 when unauthenticated', async () => {
      const res = await app.inject({
        method: 'PATCH',
        url: '/api/users/profile',
        payload: { name: 'New Name' },
      })

      expect(res.statusCode).toBe(401)
    })

    it('should accept nullable fields (bio, location, birthday)', async () => {
      const updatedUser = {
        ...MOCK_USER_FULL,
        bio: null,
        location: 'NYC',
        birthday: '1990-05-15',
      }
      mockUsersRepo.updateProfile.mockResolvedValue(updatedUser)
      const token = generateValidJwt()

      const res = await app.inject({
        method: 'PATCH',
        url: '/api/users/profile',
        headers: { authorization: `Bearer ${token}` },
        payload: {
          bio: null,
          location: 'NYC',
          birthday: '1990-05-15',
        },
      })

      expect(res.statusCode).toBe(200)
      expect(res.json().data.location).toBe('NYC')
    })
  })
})
