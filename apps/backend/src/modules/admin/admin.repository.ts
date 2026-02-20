import { eq, sql, ilike, or, count } from 'drizzle-orm'
import { db } from '../../config/database'
import { users } from '../../database/schema/index'

export const adminRepository = {
  async listUsers(page: number, limit: number, search?: string) {
    const offset = (page - 1) * limit

    let whereClause
    if (search) {
      whereClause = or(
        ilike(users.name, `%${search}%`),
        ilike(users.email, `%${search}%`)
      )
    }

    const [items, [{ total }]] = await Promise.all([
      db
        .select({
          id: users.id,
          email: users.email,
          name: users.name,
          avatarUrl: users.avatarUrl,
          bio: users.bio,
          phone: users.phone,
          location: users.location,
          role: users.role,
          features: users.features,
          createdAt: users.createdAt,
        })
        .from(users)
        .where(whereClause)
        .orderBy(users.createdAt)
        .limit(limit)
        .offset(offset),
      db
        .select({ total: count() })
        .from(users)
        .where(whereClause),
    ])

    return { items, total }
  },

  async getUserById(id: string) {
    const result = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        avatarUrl: users.avatarUrl,
        bio: users.bio,
        phone: users.phone,
        location: users.location,
        role: users.role,
        features: users.features,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .where(eq(users.id, id))
      .limit(1)
    return result[0] ?? null
  },

  async updateUserAdmin(id: string, data: { role?: string; features?: string[] }) {
    const result = await db
      .update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
        features: users.features,
      })
    return result[0] ?? null
  },

  async getStats() {
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

    const [totalResult, newResult] = await Promise.all([
      db.select({ total: count() }).from(users),
      db
        .select({ total: count() })
        .from(users)
        .where(sql`${users.createdAt} >= ${oneWeekAgo}`),
    ])

    return {
      totalUsers: totalResult[0].total,
      newThisWeek: newResult[0].total,
    }
  },
}
