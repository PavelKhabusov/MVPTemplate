import { eq } from 'drizzle-orm'
import { db } from '../../config/database'
import { users, refreshTokens } from '../../database/schema/index'
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
}
