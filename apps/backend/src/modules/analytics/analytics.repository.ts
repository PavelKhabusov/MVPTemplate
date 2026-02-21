import { sql, count, countDistinct, desc } from 'drizzle-orm'
import { db } from '../../config/database'
import { analyticsEvents, users } from '../../database/schema/index'

export const analyticsRepository = {
  async insertEvents(events: Array<{
    userId?: string | null
    deviceId: string
    event: string
    eventType: string
    properties?: Record<string, unknown>
    screenName?: string
    sessionDuration?: number
    clientTimestamp: Date
  }>) {
    if (events.length === 0) return
    await db.insert(analyticsEvents).values(events)
  },

  async getActiveUsers() {
    const now = new Date()

    const dauDate = new Date(now)
    dauDate.setDate(dauDate.getDate() - 1)

    const wauDate = new Date(now)
    wauDate.setDate(wauDate.getDate() - 7)

    const mauDate = new Date(now)
    mauDate.setDate(mauDate.getDate() - 30)

    const [dau, wau, mau] = await Promise.all([
      db.select({ count: countDistinct(analyticsEvents.userId) })
        .from(analyticsEvents)
        .where(sql`${analyticsEvents.createdAt} >= ${dauDate.toISOString()} AND ${analyticsEvents.userId} IS NOT NULL`),
      db.select({ count: countDistinct(analyticsEvents.userId) })
        .from(analyticsEvents)
        .where(sql`${analyticsEvents.createdAt} >= ${wauDate.toISOString()} AND ${analyticsEvents.userId} IS NOT NULL`),
      db.select({ count: countDistinct(analyticsEvents.userId) })
        .from(analyticsEvents)
        .where(sql`${analyticsEvents.createdAt} >= ${mauDate.toISOString()} AND ${analyticsEvents.userId} IS NOT NULL`),
    ])

    return { dau: dau[0].count, wau: wau[0].count, mau: mau[0].count }
  },

  async getRegistrations(days: number) {
    const since = new Date()
    since.setDate(since.getDate() - days)

    return db
      .select({
        day: sql<string>`date_trunc('day', ${users.createdAt})::date`.as('day'),
        count: count(),
      })
      .from(users)
      .where(sql`${users.createdAt} >= ${since.toISOString()}`)
      .groupBy(sql`date_trunc('day', ${users.createdAt})::date`)
      .orderBy(sql`day`)
  },

  async getPopularScreens(days: number, limit = 10) {
    const since = new Date()
    since.setDate(since.getDate() - days)

    return db
      .select({
        screenName: analyticsEvents.screenName,
        views: count(),
      })
      .from(analyticsEvents)
      .where(sql`${analyticsEvents.eventType} = 'screen' AND ${analyticsEvents.createdAt} >= ${since.toISOString()} AND ${analyticsEvents.screenName} IS NOT NULL`)
      .groupBy(analyticsEvents.screenName)
      .orderBy(desc(count()))
      .limit(limit)
  },

  async getDailyActivity(days: number) {
    const since = new Date()
    since.setDate(since.getDate() - days)

    return db
      .select({
        day: sql<string>`date_trunc('day', ${analyticsEvents.createdAt})::date`.as('day'),
        events: count(),
        uniqueUsers: countDistinct(analyticsEvents.userId),
      })
      .from(analyticsEvents)
      .where(sql`${analyticsEvents.createdAt} >= ${since.toISOString()}`)
      .groupBy(sql`date_trunc('day', ${analyticsEvents.createdAt})::date`)
      .orderBy(sql`day`)
  },

  async getRetention(weeks = 4) {
    return db.execute(sql`
      WITH cohort AS (
        SELECT id, date_trunc('week', created_at)::date AS cohort_week
        FROM users
        WHERE created_at >= now() - make_interval(weeks => ${weeks})
      ),
      activity AS (
        SELECT DISTINCT user_id, date_trunc('week', created_at)::date AS activity_week
        FROM analytics_events
        WHERE user_id IS NOT NULL AND created_at >= now() - make_interval(weeks => ${weeks})
      )
      SELECT
        c.cohort_week,
        COUNT(DISTINCT c.id) AS cohort_size,
        COUNT(DISTINCT CASE WHEN a.activity_week = c.cohort_week THEN c.id END) AS week_0,
        COUNT(DISTINCT CASE WHEN a.activity_week = c.cohort_week + interval '1 week' THEN c.id END) AS week_1,
        COUNT(DISTINCT CASE WHEN a.activity_week = c.cohort_week + interval '2 weeks' THEN c.id END) AS week_2,
        COUNT(DISTINCT CASE WHEN a.activity_week = c.cohort_week + interval '3 weeks' THEN c.id END) AS week_3
      FROM cohort c
      LEFT JOIN activity a ON a.user_id = c.id
      GROUP BY c.cohort_week
      ORDER BY c.cohort_week
    `)
  },

  async getAverageSessionTime(days: number) {
    const since = new Date()
    since.setDate(since.getDate() - days)

    const result = await db
      .select({
        avgSeconds: sql<number>`COALESCE(AVG(${analyticsEvents.sessionDuration}), 0)`.as('avg_seconds'),
      })
      .from(analyticsEvents)
      .where(sql`${analyticsEvents.eventType} = 'session_end' AND ${analyticsEvents.sessionDuration} IS NOT NULL AND ${analyticsEvents.createdAt} >= ${since.toISOString()}`)

    return Math.round(result[0].avgSeconds)
  },
}
