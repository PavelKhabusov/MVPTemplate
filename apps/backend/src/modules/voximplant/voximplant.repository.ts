import { eq } from 'drizzle-orm'
import { db } from '../../config/database'
import { users } from '../../database/schema'
import { encrypt } from '../../common/utils/crypto'

export const voximplantRepository = {
  async saveCredentials(userId: string, login: string, password: string, appId: string | null) {
    const result = await db
      .update(users)
      .set({
        voximplantLogin: login,
        voximplantPassword: encrypt(password),
        voximplantAppId: appId,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning({ voximplantLogin: users.voximplantLogin, voximplantAppId: users.voximplantAppId })
    return result[0]
  },

  async getConfig(userId: string) {
    const result = await db
      .select({
        voximplantLogin: users.voximplantLogin,
        voximplantAppId: users.voximplantAppId,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)
    return result[0] ?? null
  },
}