import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { randomBytes } from 'crypto'
import { env } from '../../config/env'
import { AppError } from '../../common/errors/app-error'
import { hashToken } from '../../common/utils/crypto'
import { emailService } from '../email/email.service'
import { smsService } from '../sms/sms.service'
import { authRepository } from './auth.repository'
import type { RegisterInput, LoginInput, GoogleAuthInput, SendPhoneCodeInput, VerifyPhoneInput } from './auth.schema'

const SALT_ROUNDS = 12

type EmailLocale = 'en' | 'ru' | 'es' | 'ja'

interface TokenPair {
  accessToken: string
  refreshToken: string
}

interface JwtPayload {
  sub: string
  email: string
}

function generateAccessToken(userId: string, email: string): string {
  const options: jwt.SignOptions = { expiresIn: env.JWT_ACCESS_EXPIRY as any }
  return jwt.sign({ sub: userId, email } satisfies JwtPayload, env.JWT_ACCESS_SECRET, options)
}

function generateRefreshToken(): string {
  return randomBytes(40).toString('hex')
}

function parseRefreshExpiry(): Date {
  const match = env.JWT_REFRESH_EXPIRY.match(/^(\d+)([dhms])$/)
  if (!match) return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30d default

  const [, amount, unit] = match
  const ms = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  }[unit]!

  return new Date(Date.now() + Number(amount) * ms)
}

export const authService = {
  async register(input: RegisterInput & { locale?: string }): Promise<TokenPair> {
    const existing = await authRepository.findUserByEmail(input.email)
    if (existing) {
      throw AppError.conflict('Email already registered')
    }

    const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS)
    const user = await authRepository.createUser({
      email: input.email,
      passwordHash,
      name: input.name,
      emailVerified: !env.EMAIL_ENABLED,
    })

    if (env.EMAIL_ENABLED) {
      const token = randomBytes(32).toString('hex')
      const tokenHash = hashToken(token)
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
      await authRepository.saveEmailVerificationToken(user.id, tokenHash, expiresAt)

      const locale = (input.locale as EmailLocale) || 'en'
      emailService.sendVerificationEmail(user.email, token, user.name, locale)
        .catch((err) => console.error('Failed to send verification email:', err))
    }

    return this.createTokenPair(user.id, user.email)
  },

  async login(input: LoginInput): Promise<TokenPair> {
    const user = await authRepository.findUserByEmail(input.email)
    if (!user) {
      throw AppError.unauthorized('Invalid email or password')
    }

    if (!user.passwordHash) {
      throw AppError.unauthorized('This account uses Google sign-in')
    }

    const valid = await bcrypt.compare(input.password, user.passwordHash)
    if (!valid) {
      throw AppError.unauthorized('Invalid email or password')
    }

    if (env.EMAIL_ENABLED && env.EMAIL_VERIFICATION_REQUIRED && !user.emailVerified) {
      throw AppError.forbidden('Please verify your email address before signing in')
    }

    return this.createTokenPair(user.id, user.email)
  },

  async googleAuth(input: GoogleAuthInput): Promise<TokenPair> {
    // Verify Google ID token
    const res = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${input.idToken}`,
    )
    if (!res.ok) {
      throw AppError.unauthorized('Invalid Google token')
    }

    const payload = await res.json() as {
      aud: string
      sub: string
      email: string
      email_verified: string
      name: string
      picture?: string
    }

    if (env.GOOGLE_CLIENT_ID && payload.aud !== env.GOOGLE_CLIENT_ID) {
      throw AppError.unauthorized('Invalid Google token audience')
    }

    if (payload.email_verified !== 'true') {
      throw AppError.unauthorized('Google email not verified')
    }

    // Find existing user or create new one
    let user = await authRepository.findUserByEmail(payload.email)

    if (!user) {
      user = await authRepository.createUser({
        email: payload.email,
        name: payload.name || payload.email.split('@')[0],
        avatarUrl: payload.picture ?? null,
        emailVerified: true,
      })
    } else if (!user.emailVerified) {
      await authRepository.updateUser(user.id, { emailVerified: true })
    }

    return this.createTokenPair(user.id, user.email)
  },

  async verifyEmail(token: string): Promise<{ message: string }> {
    if (!env.EMAIL_ENABLED) {
      throw AppError.badRequest('Email is not enabled')
    }

    const tokenHash = hashToken(token)
    const stored = await authRepository.findEmailVerificationToken(tokenHash)

    if (!stored || stored.verifiedAt || stored.expiresAt < new Date()) {
      throw AppError.badRequest('Invalid or expired verification token')
    }

    await authRepository.markEmailVerified(tokenHash, stored.userId)

    const user = await authRepository.findUserById(stored.userId)
    if (user) {
      emailService.sendWelcomeEmail(user.email, user.name)
        .catch((err) => console.error('Failed to send welcome email:', err))
    }

    return { message: 'Email verified successfully' }
  },

  async requestPasswordReset(email: string, locale: string = 'en'): Promise<{ message: string }> {
    if (!env.EMAIL_ENABLED) {
      throw AppError.badRequest('Email is not enabled')
    }

    const message = 'If that email is registered, you will receive a reset link'

    const user = await authRepository.findUserByEmail(email)
    if (!user) {
      return { message }
    }

    const token = randomBytes(32).toString('hex')
    const tokenHash = hashToken(token)
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

    await authRepository.savePasswordResetToken(user.id, tokenHash, expiresAt)

    emailService.sendPasswordResetEmail(user.email, token, user.name, (locale as EmailLocale) || 'en')
      .catch((err) => console.error('Failed to send password reset email:', err))

    return { message }
  },

  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    if (!env.EMAIL_ENABLED) {
      throw AppError.badRequest('Email is not enabled')
    }

    const tokenHash = hashToken(token)
    const stored = await authRepository.findPasswordResetToken(tokenHash)

    if (!stored || stored.usedAt || stored.expiresAt < new Date()) {
      throw AppError.badRequest('Invalid or expired reset token')
    }

    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS)
    await authRepository.updateUserPassword(stored.userId, passwordHash)
    await authRepository.markPasswordResetUsed(tokenHash)
    await authRepository.deleteAllUserRefreshTokens(stored.userId)

    return { message: 'Password reset successfully' }
  },

  async resendVerification(userId: string, locale: string = 'en'): Promise<{ message: string }> {
    if (!env.EMAIL_ENABLED) {
      throw AppError.badRequest('Email is not enabled')
    }

    const user = await authRepository.findUserById(userId)
    if (!user) throw AppError.notFound('User not found')

    if (user.emailVerified) {
      throw AppError.badRequest('Email is already verified')
    }

    const token = randomBytes(32).toString('hex')
    const tokenHash = hashToken(token)
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)

    await authRepository.saveEmailVerificationToken(user.id, tokenHash, expiresAt)
    await emailService.sendVerificationEmail(user.email, token, user.name, (locale as EmailLocale) || 'en')

    return { message: 'Verification email sent' }
  },

  async refresh(refreshToken: string): Promise<TokenPair> {
    const tokenHash = hashToken(refreshToken)
    const stored = await authRepository.findRefreshToken(tokenHash)

    if (!stored || stored.expiresAt < new Date()) {
      if (stored) await authRepository.deleteRefreshToken(tokenHash)
      throw AppError.unauthorized('Invalid or expired refresh token')
    }

    // Rotate: delete old, create new
    await authRepository.deleteRefreshToken(tokenHash)

    const user = await authRepository.findUserById(stored.userId)
    if (!user) throw AppError.unauthorized('User not found')

    return this.createTokenPair(user.id, user.email)
  },

  async logout(refreshToken: string): Promise<void> {
    const tokenHash = hashToken(refreshToken)
    await authRepository.deleteRefreshToken(tokenHash)
  },

  async getMe(userId: string) {
    const user = await authRepository.findUserById(userId)
    if (!user) throw AppError.notFound('User not found')

    const { passwordHash, ...profile } = user
    return { ...profile, emailEnabled: env.EMAIL_ENABLED, smsEnabled: env.SMS_ENABLED }
  },

  async sendPhoneCode(userId: string, input: SendPhoneCodeInput): Promise<{ message: string }> {
    if (!env.SMS_ENABLED) {
      throw AppError.badRequest('SMS is not enabled')
    }

    const user = await authRepository.findUserById(userId)
    if (!user) throw AppError.notFound('User not found')

    if (user.phoneVerified && user.phone === input.phone) {
      throw AppError.badRequest('Phone number is already verified')
    }

    // Generate 6-digit OTP
    const code = String(Math.floor(100000 + Math.random() * 900000))
    const codeHash = hashToken(code)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

    await authRepository.savePhoneVerificationCode(userId, input.phone, codeHash, expiresAt)

    await smsService.send({
      to: input.phone,
      text: `Your verification code: ${code}. Valid for 10 minutes.`,
    })

    return { message: 'Verification code sent' }
  },

  async verifyPhone(userId: string, input: VerifyPhoneInput): Promise<{ message: string }> {
    if (!env.SMS_ENABLED) {
      throw AppError.badRequest('SMS is not enabled')
    }

    const stored = await authRepository.findPhoneVerificationCode(userId)

    if (!stored || stored.expiresAt < new Date()) {
      throw AppError.badRequest('Verification code expired. Please request a new one.')
    }

    if (stored.phone !== input.phone) {
      throw AppError.badRequest('Phone number does not match')
    }

    const codeHash = hashToken(input.code)
    if (stored.codeHash !== codeHash) {
      throw AppError.badRequest('Invalid verification code')
    }

    await authRepository.markPhoneVerified(userId, input.phone)

    return { message: 'Phone verified successfully' }
  },

  verifyAccessToken(token: string): JwtPayload {
    try {
      return jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtPayload
    } catch {
      throw AppError.unauthorized('Invalid or expired token')
    }
  },

  async createTokenPair(userId: string, email: string): Promise<TokenPair> {
    const accessToken = generateAccessToken(userId, email)
    const refreshToken = generateRefreshToken()
    const tokenHash = hashToken(refreshToken)
    const expiresAt = parseRefreshExpiry()

    await authRepository.saveRefreshToken(userId, tokenHash, expiresAt)

    return { accessToken, refreshToken }
  },
}
