import { eq } from 'drizzle-orm'
import { db } from '../../config/database'
import { users, userSettings } from '../../database/schema/index'
import type { UserSettingsData } from '../../database/schema/index'

export const usersRepository = {
  async findById(id: string) {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1)
    return result[0] ?? null
  },

  async updateProfile(id: string, data: { name?: string; avatarUrl?: string | null; bio?: string | null; phone?: string | null; location?: string | null; birthday?: string | null }) {
    const result = await db
      .update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning()
    return result[0]
  },

  async getSettings(userId: string) {
    const result = await db
      .select()
      .from(userSettings)
      .where(eq(userSettings.userId, userId))
      .limit(1)
    return result[0] ?? null
  },

  async upsertSettings(userId: string, settings: UserSettingsData) {
    const existing = await this.getSettings(userId)
    if (existing) {
      const merged = { ...existing.settings, ...settings }
      const result = await db
        .update(userSettings)
        .set({ settings: merged, updatedAt: new Date() })
        .where(eq(userSettings.userId, userId))
        .returning()
      return result[0]
    }
    const result = await db
      .insert(userSettings)
      .values({ userId, settings })
      .returning()
    return result[0]
  },
}
