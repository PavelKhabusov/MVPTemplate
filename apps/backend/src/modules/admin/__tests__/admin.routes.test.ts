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
    onConflictDoUpdate: vi.fn().mockReturnThis(),
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

vi.mock('../../users/users.repository', () => ({
  usersRepository: {
    findById: vi.fn(),
    findByEmail: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
}))

vi.mock('../admin.repository', () => ({
  adminRepository: {
    listUsers: vi.fn(),
    getUserById: vi.fn(),
    updateUserAdmin: vi.fn(),
    getStats: vi.fn(),
  },
}))

vi.mock('../../../common/utils/env-file', () => ({
  getEnvFilePath: vi.fn().mockReturnValue('/tmp/.env.test'),
  parseEnvFile: vi.fn().mockReturnValue({ values: {} }),
  updateEnvFile: vi.fn(),
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
import { adminRepository } from '../admin.repository'
import { db } from '../../../config/database'
import jwt from 'jsonwebtoken'

// ─── Helpers ─────────────────────────────────────────────────────────────────

const mockAuthService = vi.mocked(authService)
const mockUsersRepository = vi.mocked(usersRepository)
const mockAdminRepository = vi.mocked(adminRepository)
const mockDb = vi.mocked(db) as any

const ADMIN_USER_ID = 'admin-test-001'
const REGULAR_USER_ID = 'user-test-002'

function generateValidJwt(userId = ADMIN_USER_ID, email = 'admin@example.com'): string {
  return jwt.sign(
    { sub: userId, email },
    'test-access-secret-key-minimum-32-chars!!',
    { expiresIn: '15m' },
  )
}

// ─── Test suite ──────────────────────────────────────────────────────────────

describe('Admin Routes — Integration', () => {
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
    // Default: verifyAccessToken returns valid admin payload
    mockAuthService.verifyAccessToken.mockReturnValue({
      sub: ADMIN_USER_ID,
      email: 'admin@example.com',
    } as any)
    // Default: requireAdmin passes — user has admin role
    mockUsersRepository.findById.mockResolvedValue({
      id: ADMIN_USER_ID,
      email: 'admin@example.com',
      name: 'Admin User',
      role: 'admin',
    } as any)
  })

  // ─── GET /api/admin/users ──────────────────────────────────────────────────

  describe('GET /api/admin/users', () => {
    it('should return 200 with paginated users for admin', async () => {
      const mockUsers = [
        { id: 'u1', email: 'user1@example.com', name: 'User 1', role: 'user' },
        { id: 'u2', email: 'user2@example.com', name: 'User 2', role: 'user' },
      ]
      mockAdminRepository.listUsers.mockResolvedValue({ items: mockUsers, total: 2 })
      const token = generateValidJwt()

      const res = await app.inject({
        method: 'GET',
        url: '/api/admin/users',
        headers: { authorization: `Bearer ${token}` },
      })

      expect(res.statusCode).toBe(200)
      const body = res.json()
      expect(body.data).toHaveLength(2)
      expect(body.pagination.total).toBe(2)
      expect(mockAdminRepository.listUsers).toHaveBeenCalledOnce()
    })

    it('should return 403 for non-admin user', async () => {
      mockAuthService.verifyAccessToken.mockReturnValue({
        sub: REGULAR_USER_ID,
        email: 'user@example.com',
      } as any)
      mockUsersRepository.findById.mockResolvedValue({
        id: REGULAR_USER_ID,
        email: 'user@example.com',
        name: 'Regular User',
        role: 'user',
      } as any)

      const token = generateValidJwt(REGULAR_USER_ID, 'user@example.com')

      const res = await app.inject({
        method: 'GET',
        url: '/api/admin/users',
        headers: { authorization: `Bearer ${token}` },
      })

      expect(res.statusCode).toBe(403)
      expect(res.json().error).toBe('FORBIDDEN')
    })

    it('should return 401 without authorization header', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/admin/users',
      })

      expect(res.statusCode).toBe(401)
      expect(res.json().error).toBe('UNAUTHORIZED')
    })
  })

  // ─── GET /api/admin/users/:id ──────────────────────────────────────────────

  describe('GET /api/admin/users/:id', () => {
    it('should return 200 with user details', async () => {
      const mockUser = {
        id: 'u1',
        email: 'user1@example.com',
        name: 'User One',
        role: 'user',
        features: [],
      }
      mockAdminRepository.getUserById.mockResolvedValue(mockUser as any)
      const token = generateValidJwt()

      const res = await app.inject({
        method: 'GET',
        url: '/api/admin/users/u1',
        headers: { authorization: `Bearer ${token}` },
      })

      expect(res.statusCode).toBe(200)
      const body = res.json()
      expect(body.data.id).toBe('u1')
      expect(body.data.email).toBe('user1@example.com')
    })

    it('should return 404 when user is not found', async () => {
      mockAdminRepository.getUserById.mockResolvedValue(null as any)
      const token = generateValidJwt()

      const res = await app.inject({
        method: 'GET',
        url: '/api/admin/users/nonexistent',
        headers: { authorization: `Bearer ${token}` },
      })

      expect(res.statusCode).toBe(404)
      expect(res.json().error).toBe('NOT_FOUND')
    })
  })

  // ─── PATCH /api/admin/users/:id ────────────────────────────────────────────

  describe('PATCH /api/admin/users/:id', () => {
    it('should return 200 when updating user role', async () => {
      const updatedUser = {
        id: 'u1',
        email: 'user1@example.com',
        name: 'User One',
        role: 'moderator',
        features: [],
      }
      mockAdminRepository.updateUserAdmin.mockResolvedValue(updatedUser as any)
      const token = generateValidJwt()

      const res = await app.inject({
        method: 'PATCH',
        url: '/api/admin/users/u1',
        headers: { authorization: `Bearer ${token}` },
        payload: { role: 'moderator' },
      })

      expect(res.statusCode).toBe(200)
      const body = res.json()
      expect(body.data.role).toBe('moderator')
      expect(mockAdminRepository.updateUserAdmin).toHaveBeenCalledWith('u1', { role: 'moderator' })
    })
  })

  // ─── GET /api/admin/stats ──────────────────────────────────────────────────

  describe('GET /api/admin/stats', () => {
    it('should return 200 with stats for admin', async () => {
      const mockStats = { totalUsers: 42, newUsersToday: 3, activeUsers: 15 }
      mockAdminRepository.getStats.mockResolvedValue(mockStats as any)
      const token = generateValidJwt()

      const res = await app.inject({
        method: 'GET',
        url: '/api/admin/stats',
        headers: { authorization: `Bearer ${token}` },
      })

      expect(res.statusCode).toBe(200)
      const body = res.json()
      expect(body.data.totalUsers).toBe(42)
      expect(mockAdminRepository.getStats).toHaveBeenCalledOnce()
    })
  })

  // ─── GET /api/admin/config ─────────────────────────────────────────────────

  describe('GET /api/admin/config', () => {
    it('should return 200 with roles and features', async () => {
      const token = generateValidJwt()

      const res = await app.inject({
        method: 'GET',
        url: '/api/admin/config',
        headers: { authorization: `Bearer ${token}` },
      })

      expect(res.statusCode).toBe(200)
      const body = res.json()
      expect(body.data.roles).toContain('admin')
      expect(body.data.roles).toContain('user')
      expect(body.data.features).toContain('premium')
    })
  })

  // ─── GET /api/admin/company-info ───────────────────────────────────────────

  describe('GET /api/admin/company-info', () => {
    it('should return 200 with company info', async () => {
      const companyData = {
        id: 1,
        appName: 'TestApp',
        companyName: 'Test Co',
        tagline: 'Best app',
        supportEmail: 'support@test.com',
        website: 'https://test.com',
        phone: '+1234567890',
        address: '123 Test St',
        updatedAt: new Date(),
      }
      // Mock the chainable db calls: db.select().from().where() → [companyData]
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([companyData]),
        }),
      })
      const token = generateValidJwt()

      const res = await app.inject({
        method: 'GET',
        url: '/api/admin/company-info',
        headers: { authorization: `Bearer ${token}` },
      })

      expect(res.statusCode).toBe(200)
      const body = res.json()
      expect(body.data.appName).toBe('TestApp')
      expect(body.data.companyName).toBe('Test Co')
    })
  })

  // ─── PUT /api/admin/company-info ───────────────────────────────────────────

  describe('PUT /api/admin/company-info', () => {
    it('should return 200 when upserting company info', async () => {
      const updatedInfo = {
        id: 1,
        appName: 'UpdatedApp',
        companyName: 'Updated Co',
        tagline: 'New tagline',
        supportEmail: 'new@test.com',
        website: 'https://updated.com',
        phone: '+9876543210',
        address: '456 New St',
        updatedAt: new Date(),
      }
      // Mock: db.insert().values().onConflictDoUpdate().returning() → [updatedInfo]
      mockDb.insert.mockReturnValue({
        values: vi.fn().mockReturnValue({
          onConflictDoUpdate: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([updatedInfo]),
          }),
        }),
      })
      const token = generateValidJwt()

      const res = await app.inject({
        method: 'PUT',
        url: '/api/admin/company-info',
        headers: { authorization: `Bearer ${token}` },
        payload: {
          appName: 'UpdatedApp',
          companyName: 'Updated Co',
          tagline: 'New tagline',
          supportEmail: 'new@test.com',
          website: 'https://updated.com',
          phone: '+9876543210',
          address: '456 New St',
        },
      })

      expect(res.statusCode).toBe(200)
      const body = res.json()
      expect(body.data.appName).toBe('UpdatedApp')
    })
  })
})
