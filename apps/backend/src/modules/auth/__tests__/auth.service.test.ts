import { vi, describe, it, expect, beforeEach } from 'vitest'

vi.mock('../../config/env', () => ({
  env: {
    JWT_ACCESS_SECRET: 'test-secret-key-for-unit-tests',
    JWT_REFRESH_EXPIRY: '30d',
    JWT_ACCESS_EXPIRY: '15m',
    EMAIL_ENABLED: false,
    EMAIL_VERIFICATION_REQUIRED: false,
    SMS_ENABLED: false,
    GOOGLE_CLIENT_ID: '',
  },
}))

vi.mock('../auth.repository', () => ({
  authRepository: {
    findUserByEmail: vi.fn(),
    findUserById: vi.fn(),
    createUser: vi.fn(),
    updateUser: vi.fn(),
    saveRefreshToken: vi.fn(),
    findRefreshToken: vi.fn(),
    deleteRefreshToken: vi.fn(),
    deleteAllUserRefreshTokens: vi.fn(),
    saveEmailVerificationToken: vi.fn(),
    findEmailVerificationToken: vi.fn(),
    markEmailVerified: vi.fn(),
    savePasswordResetToken: vi.fn(),
    findPasswordResetToken: vi.fn(),
    markPasswordResetUsed: vi.fn(),
    updateUserPassword: vi.fn(),
    savePhoneVerificationCode: vi.fn(),
    findPhoneVerificationCode: vi.fn(),
    markPhoneVerified: vi.fn(),
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
  smsService: {
    send: vi.fn().mockResolvedValue(undefined),
  },
}))

vi.mock('bcrypt', () => ({
  default: {
    hash: vi.fn().mockResolvedValue('$2b$12$mocked_hash'),
    compare: vi.fn(),
  },
}))

vi.mock('jsonwebtoken', () => ({
  default: {
    sign: vi.fn().mockReturnValue('mock.access.token'),
    verify: vi.fn(),
  },
}))

import { authService } from '../auth.service'
import { authRepository } from '../auth.repository'
import bcrypt from 'bcrypt'

const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
  passwordHash: '$2b$12$mocked_hash',
  name: 'Test User',
  avatarUrl: null as string | null,
  bio: null as string | null,
  phone: null as string | null,
  location: null as string | null,
  emailVerified: true,
  phoneVerified: false,
  role: 'user' as const,
  features: [] as string[],
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
}

const mockRefreshTokenRecord = {
  id: 'token-rec-1',
  userId: 'user-123',
  tokenHash: 'hashed-refresh-token',
  expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  createdAt: new Date(),
}

describe('authService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(authRepository.saveRefreshToken).mockResolvedValue(undefined)
    vi.mocked(authRepository.deleteRefreshToken).mockResolvedValue(undefined)
  })

  // ─── register ───────────────────────────────────────────────────────────────

  describe('register', () => {
    it('creates a new user and returns an access/refresh token pair', async () => {
      vi.mocked(authRepository.findUserByEmail).mockResolvedValue(null)
      vi.mocked(authRepository.createUser).mockResolvedValue(mockUser)

      const result = await authService.register({
        email: 'test@example.com',
        password: 'SecurePass1!',
        name: 'Test User',
      })

      expect(authRepository.createUser).toHaveBeenCalledOnce()
      expect(result).toHaveProperty('accessToken')
      expect(result).toHaveProperty('refreshToken')
    })

    it('throws 409 Conflict when email is already registered', async () => {
      vi.mocked(authRepository.findUserByEmail).mockResolvedValue(mockUser)

      await expect(
        authService.register({ email: 'test@example.com', password: 'pass', name: 'Test' }),
      ).rejects.toMatchObject({ statusCode: 409 })

      expect(authRepository.createUser).not.toHaveBeenCalled()
    })

    it('hashes the password with bcrypt before saving', async () => {
      vi.mocked(authRepository.findUserByEmail).mockResolvedValue(null)
      vi.mocked(authRepository.createUser).mockResolvedValue(mockUser)

      await authService.register({ email: 'new@example.com', password: 'plain-text', name: 'New' })

      expect(bcrypt.hash).toHaveBeenCalledWith('plain-text', 12)
    })
  })

  // ─── login ───────────────────────────────────────────────────────────────────

  describe('login', () => {
    it('returns tokens when credentials are correct', async () => {
      vi.mocked(authRepository.findUserByEmail).mockResolvedValue(mockUser)
      vi.mocked(bcrypt.compare).mockResolvedValue(true as never)

      const result = await authService.login({
        email: 'test@example.com',
        password: 'correct-password',
      })

      expect(result).toHaveProperty('accessToken')
      expect(result).toHaveProperty('refreshToken')
    })

    it('throws 401 Unauthorized when email is not found', async () => {
      vi.mocked(authRepository.findUserByEmail).mockResolvedValue(null)

      await expect(
        authService.login({ email: 'ghost@example.com', password: 'pass' }),
      ).rejects.toMatchObject({ statusCode: 401 })
    })

    it('throws 401 Unauthorized when password is wrong', async () => {
      vi.mocked(authRepository.findUserByEmail).mockResolvedValue(mockUser)
      vi.mocked(bcrypt.compare).mockResolvedValue(false as never)

      await expect(
        authService.login({ email: 'test@example.com', password: 'wrong-password' }),
      ).rejects.toMatchObject({ statusCode: 401 })
    })

    it('does NOT gate login behind emailVerified when EMAIL_VERIFICATION_REQUIRED=false', async () => {
      // With the default mock (EMAIL_ENABLED=false), an unverified user can still log in
      vi.mocked(authRepository.findUserByEmail).mockResolvedValue({
        ...mockUser,
        emailVerified: false,
      })
      vi.mocked(bcrypt.compare).mockResolvedValue(true as never)

      // Should resolve, not throw
      const result = await authService.login({ email: 'test@example.com', password: 'pass' })
      expect(result).toHaveProperty('accessToken')
    })
  })

  // ─── refresh ─────────────────────────────────────────────────────────────────

  describe('refresh', () => {
    it('rotates refresh token and returns a new token pair', async () => {
      vi.mocked(authRepository.findRefreshToken).mockResolvedValue(mockRefreshTokenRecord)
      vi.mocked(authRepository.findUserById).mockResolvedValue(mockUser)

      const result = await authService.refresh('valid-refresh-token')

      expect(authRepository.deleteRefreshToken).toHaveBeenCalledOnce()
      expect(authRepository.saveRefreshToken).toHaveBeenCalledOnce()
      expect(result).toHaveProperty('accessToken')
      expect(result).toHaveProperty('refreshToken')
    })

    it('throws 401 Unauthorized when token is not found', async () => {
      vi.mocked(authRepository.findRefreshToken).mockResolvedValue(null)

      await expect(authService.refresh('unknown-token')).rejects.toMatchObject({ statusCode: 401 })
    })

    it('throws 401 Unauthorized when token is expired', async () => {
      vi.mocked(authRepository.findRefreshToken).mockResolvedValue({
        ...mockRefreshTokenRecord,
        expiresAt: new Date(Date.now() - 1000), // expired
      })

      await expect(authService.refresh('expired-token')).rejects.toMatchObject({ statusCode: 401 })
    })
  })

  // ─── logout ──────────────────────────────────────────────────────────────────

  describe('logout', () => {
    it('deletes the refresh token from the database', async () => {
      await authService.logout('some-refresh-token')

      expect(authRepository.deleteRefreshToken).toHaveBeenCalledOnce()
    })
  })

  // ─── verifyAccessToken ───────────────────────────────────────────────────────

  describe('verifyAccessToken', () => {
    it('throws 401 when token is invalid', async () => {
      const jwt = await import('jsonwebtoken')
      vi.mocked(jwt.default.verify).mockImplementation(() => {
        throw new Error('invalid token')
      })

      expect(() => authService.verifyAccessToken('bad-token')).toThrow()
    })
  })
})
