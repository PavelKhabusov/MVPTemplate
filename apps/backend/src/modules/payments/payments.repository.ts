import { eq, desc, and, sql, count } from 'drizzle-orm'
import { db } from '../../config/database'
import { plans, subscriptions, payments } from '../../database/schema/index'

export const paymentsRepository = {
  // --- Plans ---
  async getActivePlans(providers?: string[]) {
    if (providers && providers.length > 0) {
      const results = await Promise.all(
        providers.map((p) =>
          db
            .select()
            .from(plans)
            .where(and(eq(plans.isActive, true), eq(plans.provider, p)))
            .orderBy(plans.sortOrder),
        ),
      )
      return results.flat()
    }
    return db.select().from(plans).where(eq(plans.isActive, true)).orderBy(plans.sortOrder)
  },

  async getPlanById(id: string) {
    const result = await db.select().from(plans).where(eq(plans.id, id)).limit(1)
    return result[0] ?? null
  },

  async createPlan(data: typeof plans.$inferInsert) {
    const result = await db.insert(plans).values(data).returning()
    return result[0]
  },

  async getAllPlans() {
    return db.select().from(plans).orderBy(plans.sortOrder, plans.createdAt)
  },

  async updatePlan(id: string, data: Partial<typeof plans.$inferInsert>) {
    const result = await db
      .update(plans)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(plans.id, id))
      .returning()
    return result[0] ?? null
  },

  async deactivatePlan(id: string) {
    const result = await db
      .update(plans)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(plans.id, id))
      .returning()
    return result[0] ?? null
  },

  async deletePlan(id: string) {
    const result = await db
      .delete(plans)
      .where(eq(plans.id, id))
      .returning({ id: plans.id })
    return result[0] ?? null
  },

  async getPlanSubscriptionCount(planId: string): Promise<number> {
    const result = await db
      .select({ count: count() })
      .from(subscriptions)
      .where(eq(subscriptions.planId, planId))
    return result[0]?.count ?? 0
  },

  // --- Subscriptions ---
  async getActiveSubscription(userId: string) {
    const result = await db
      .select({
        subscription: subscriptions,
        planName: plans.name,
      })
      .from(subscriptions)
      .innerJoin(plans, eq(subscriptions.planId, plans.id))
      .where(and(eq(subscriptions.userId, userId), eq(subscriptions.status, 'active')))
      .limit(1)
    return result[0] ?? null
  },

  async createSubscription(data: typeof subscriptions.$inferInsert) {
    const result = await db.insert(subscriptions).values(data).returning()
    return result[0]
  },

  async updateSubscriptionByProviderId(
    providerSubscriptionId: string,
    data: Partial<typeof subscriptions.$inferInsert>,
  ) {
    const result = await db
      .update(subscriptions)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(subscriptions.providerSubscriptionId, providerSubscriptionId))
      .returning()
    return result[0] ?? null
  },

  async cancelSubscription(userId: string) {
    const result = await db
      .update(subscriptions)
      .set({ cancelAtPeriodEnd: true, updatedAt: new Date() })
      .where(and(eq(subscriptions.userId, userId), eq(subscriptions.status, 'active')))
      .returning()
    return result[0] ?? null
  },

  async findSubscriptionByProviderId(providerSubscriptionId: string) {
    const result = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.providerSubscriptionId, providerSubscriptionId))
      .limit(1)
    return result[0] ?? null
  },

  // --- Payments ---
  async createPayment(data: typeof payments.$inferInsert) {
    const result = await db.insert(payments).values(data).returning()
    return result[0]
  },

  async updatePaymentByProviderId(
    providerPaymentId: string,
    data: Partial<typeof payments.$inferInsert>,
  ) {
    const result = await db
      .update(payments)
      .set(data)
      .where(eq(payments.providerPaymentId, providerPaymentId))
      .returning()
    return result[0] ?? null
  },

  async getPaymentHistory(userId: string, page: number, limit: number) {
    const offset = (page - 1) * limit
    const [data, totalResult] = await Promise.all([
      db
        .select()
        .from(payments)
        .where(eq(payments.userId, userId))
        .orderBy(desc(payments.createdAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ count: count() })
        .from(payments)
        .where(eq(payments.userId, userId)),
    ])
    return { data, total: totalResult[0].count }
  },

  // --- Admin Stats ---
  async getRevenueStats(days: number) {
    const since = new Date()
    since.setDate(since.getDate() - days)

    const [totalRevenue, activeSubs, recentPayments] = await Promise.all([
      db
        .select({
          total: sql<number>`COALESCE(SUM(${payments.amount}), 0)`.as('total'),
          currency: payments.currency,
        })
        .from(payments)
        .where(
          and(
            eq(payments.status, 'succeeded'),
            sql`${payments.createdAt} >= ${since.toISOString()}`,
          ),
        )
        .groupBy(payments.currency),
      db
        .select({ count: count() })
        .from(subscriptions)
        .where(eq(subscriptions.status, 'active')),
      db
        .select()
        .from(payments)
        .where(sql`${payments.createdAt} >= ${since.toISOString()}`)
        .orderBy(desc(payments.createdAt))
        .limit(50),
    ])

    return {
      totalRevenue,
      activeSubscriptions: activeSubs[0].count,
      recentPayments,
    }
  },
}
