import { eq, and, gte, lte, count, desc } from 'drizzle-orm'
import { db } from '../../config/database'
import { calls, subscriptions, plans } from '../../database/schema'
import type { NewCall } from '../../database/schema'

const FREE_MONTHLY_LIMIT = 30

export const callsRepository = {
  async create(data: NewCall) {
    const result = await db.insert(calls).values(data).returning()
    return result[0]
  },

  async findById(id: string, userId: string) {
    const result = await db
      .select()
      .from(calls)
      .where(and(eq(calls.id, id), eq(calls.userId, userId)))
      .limit(1)
    return result[0] ?? null
  },

  async findByVoximplantCallId(voximplantCallId: string) {
    const result = await db
      .select()
      .from(calls)
      .where(eq(calls.voximplantCallId, voximplantCallId))
      .limit(1)
    return result[0] ?? null
  },

  async list(
    userId: string,
    opts: { sheetId?: string; dateFrom?: string; dateTo?: string; page: number; limit: number }
  ) {
    const conditions = [eq(calls.userId, userId)]
    if (opts.sheetId) conditions.push(eq(calls.sheetId, opts.sheetId))
    if (opts.dateFrom) conditions.push(gte(calls.startedAt, new Date(opts.dateFrom)))
    if (opts.dateTo) conditions.push(lte(calls.startedAt, new Date(opts.dateTo)))

    const where = and(...conditions)
    const offset = (opts.page - 1) * opts.limit

    const [rows, totalResult] = await Promise.all([
      db.select().from(calls).where(where).orderBy(desc(calls.startedAt)).offset(offset).limit(opts.limit),
      db.select({ count: count() }).from(calls).where(where),
    ])

    return { rows, total: totalResult[0]?.count ?? 0 }
  },

  async update(id: string, data: Partial<Pick<NewCall, 'duration' | 'recordingUrl' | 'status' | 'endedAt'>>) {
    const result = await db.update(calls).set(data).where(eq(calls.id, id)).returning()
    return result[0]
  },

  async countThisMonth(userId: string): Promise<number> {
    const firstOfMonth = new Date()
    firstOfMonth.setDate(1)
    firstOfMonth.setHours(0, 0, 0, 0)

    const result = await db
      .select({ count: count() })
      .from(calls)
      .where(and(eq(calls.userId, userId), gte(calls.startedAt, firstOfMonth)))
    return result[0]?.count ?? 0
  },

  /** Check if user has an active paid subscription */
  async hasActiveSubscription(userId: string): Promise<boolean> {
    const result = await db
      .select({ priceAmount: plans.priceAmount })
      .from(subscriptions)
      .innerJoin(plans, eq(subscriptions.planId, plans.id))
      .where(
        and(
          eq(subscriptions.userId, userId),
          eq(subscriptions.status, 'active'),
          gte(subscriptions.currentPeriodEnd, new Date())
        )
      )
      .limit(1)
    // Paid plan = priceAmount > 0
    return (result[0]?.priceAmount ?? 0) > 0
  },

  FREE_MONTHLY_LIMIT,
}