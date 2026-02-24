import { eq, asc, desc } from 'drizzle-orm'
import { db } from '../../config/database'
import { proxies, type NewProxy } from '../../database/schema'

const MASKED_PASSWORD = '••••••••'

function maskPassword<T extends { password: string | null }>(record: T): T {
  if (record.password) {
    return { ...record, password: MASKED_PASSWORD }
  }
  return record
}

export const proxyRepository = {
  async findAll() {
    const rows = await db
      .select()
      .from(proxies)
      .orderBy(asc(proxies.priority), desc(proxies.createdAt))
    return rows.map(maskPassword)
  },

  async findById(id: string) {
    const [row] = await db.select().from(proxies).where(eq(proxies.id, id))
    return row ? maskPassword(row) : null
  },

  async findByIdRaw(id: string) {
    const [row] = await db.select().from(proxies).where(eq(proxies.id, id))
    return row ?? null
  },

  async create(data: Omit<NewProxy, 'id' | 'createdAt' | 'updatedAt'>) {
    const [row] = await db
      .insert(proxies)
      .values({ ...data, lastCheckStatus: 'pending' })
      .returning()
    return maskPassword(row)
  },

  async update(id: string, data: Partial<NewProxy>) {
    // Don't update password if it's the masked value
    if (data.password === MASKED_PASSWORD) {
      delete data.password
    }

    const [row] = await db
      .update(proxies)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(proxies.id, id))
      .returning()
    return row ? maskPassword(row) : null
  },

  async delete(id: string) {
    const [row] = await db.delete(proxies).where(eq(proxies.id, id)).returning()
    return !!row
  },

  async toggleActive(id: string, isActive: boolean) {
    const [row] = await db
      .update(proxies)
      .set({ isActive, updatedAt: new Date() })
      .where(eq(proxies.id, id))
      .returning()
    return row ? maskPassword(row) : null
  },

  async updateCheckStatus(id: string, status: string, message: string) {
    await db
      .update(proxies)
      .set({
        lastCheckStatus: status,
        lastCheckMessage: message,
        lastCheckedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(proxies.id, id))
  },
}
