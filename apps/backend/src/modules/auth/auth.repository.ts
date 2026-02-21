import { eq } from 'drizzle-orm'
import { db } from '../../config/database'
import { users, refreshTokens, emailVerificationTokens, passwordResetTokens } from '../../database/schema/index'
import type { NewUser } from '../../database/schema/index'

export const authRepository = {
  async findUserByEmail(email: string) {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1)
    return result[0] ?? null
  },

  async findUserById(id: string) {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1)
    return result[0] ?? null
  },

  async createUser(data: NewUser) {
    const result = await db.insert(users).values(data).returning()
    return result[0]
  },

  async updateUser(id: string, data: Partial<{ emailVerified: boolean; passwordHash: string }>) {
    const result = await db
      .update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning()
    return result[0]
  },

  // Refresh tokens
  async saveRefreshToken(userId: string, tokenHash: string, expiresAt: Date) {
    await db.insert(refreshTokens).values({ userId, tokenHash, expiresAt })
  },

  async findRefreshToken(tokenHash: string) {
    const result = await db
      .select()
      .from(refreshTokens)
      .where(eq(refreshTokens.tokenHash, tokenHash))
      .limit(1)
    return result[0] ?? null
  },

  async deleteRefreshToken(tokenHash: string) {
    await db.delete(refreshTokens).where(eq(refreshTokens.tokenHash, tokenHash))
  },

  async deleteAllUserRefreshTokens(userId: string) {
    await db.delete(refreshTokens).where(eq(refreshTokens.userId, userId))
  },

  // Email verification tokens
  async saveEmailVerificationToken(userId: string, tokenHash: string, expiresAt: Date) {
    await db.delete(emailVerificationTokens).where(eq(emailVerificationTokens.userId, userId))
    await db.insert(emailVerificationTokens).values({ userId, tokenHash, expiresAt })
  },

  async findEmailVerificationToken(tokenHash: string) {
    const result = await db
      .select()
      .from(emailVerificationTokens)
      .where(eq(emailVerificationTokens.tokenHash, tokenHash))
      .limit(1)
    return result[0] ?? null
  },

  async markEmailVerified(tokenHash: string, userId: string) {
    await db
      .update(emailVerificationTokens)
      .set({ verifiedAt: new Date() })
      .where(eq(emailVerificationTokens.tokenHash, tokenHash))
    await db
      .update(users)
      .set({ emailVerified: true, updatedAt: new Date() })
      .where(eq(users.id, userId))
  },

  // Password reset tokens
  async savePasswordResetToken(userId: string, tokenHash: string, expiresAt: Date) {
    await db.delete(passwordResetTokens).where(eq(passwordResetTokens.userId, userId))
    await db.insert(passwordResetTokens).values({ userId, tokenHash, expiresAt })
  },

  async findPasswordResetToken(tokenHash: string) {
    const result = await db
      .select()
      .from(passwordResetTokens)
      .where(eq(passwordResetTokens.tokenHash, tokenHash))
      .limit(1)
    return result[0] ?? null
  },

  async markPasswordResetUsed(tokenHash: string) {
    await db
      .update(passwordResetTokens)
      .set({ usedAt: new Date() })
      .where(eq(passwordResetTokens.tokenHash, tokenHash))
  },

  async updateUserPassword(userId: string, passwordHash: string) {
    await db
      .update(users)
      .set({ passwordHash, updatedAt: new Date() })
      .where(eq(users.id, userId))
  },
}
