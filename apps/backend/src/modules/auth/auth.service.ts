import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { randomBytes } from 'crypto'
import { env } from '../../config/env'
import { AppError } from '../../common/errors/app-error'
import { hashToken } from '../../common/utils/crypto'
import { authRepository } from './auth.repository'
import type { RegisterInput, LoginInput, GoogleAuthInput } from './auth.schema'

const SALT_ROUNDS = 12

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
  async register(input: RegisterInput): Promise<TokenPair> {
    const existing = await authRepository.findUserByEmail(input.email)
    if (existing) {
      throw AppError.conflict('Email already registered')
    }

    const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS)
    const user = await authRepository.createUser({
      email: input.email,
      passwordHash,
      name: input.name,
    })

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
      })
    }

    return this.createTokenPair(user.id, user.email)
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
    return profile
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
