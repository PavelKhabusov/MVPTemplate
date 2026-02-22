import { sql, eq, and, count } from 'drizzle-orm'
import { db } from '../../config/database'
import { docFeedback } from '../../database/schema/index'

export const docFeedbackRepository = {
  async upsert(userId: string, pageId: string, helpful: boolean) {
    // One feedback per user per page — upsert
    const existing = await db
      .select()
      .from(docFeedback)
      .where(and(eq(docFeedback.userId, userId), eq(docFeedback.pageId, pageId)))
      .limit(1)

    if (existing.length > 0) {
      await db
        .update(docFeedback)
        .set({ helpful, createdAt: new Date() })
        .where(eq(docFeedback.id, existing[0].id))
      return existing[0].id
    }

    const [row] = await db
      .insert(docFeedback)
      .values({ userId, pageId, helpful })
      .returning({ id: docFeedback.id })
    return row.id
  },

  async getUserVote(userId: string, pageId: string) {
    const [row] = await db
      .select({ helpful: docFeedback.helpful })
      .from(docFeedback)
      .where(and(eq(docFeedback.userId, userId), eq(docFeedback.pageId, pageId)))
      .limit(1)
    return row?.helpful ?? null
  },

  async getPageStats(pageId: string) {
    const [likes] = await db
      .select({ count: count() })
      .from(docFeedback)
      .where(and(eq(docFeedback.pageId, pageId), eq(docFeedback.helpful, true)))

    const [dislikes] = await db
      .select({ count: count() })
      .from(docFeedback)
      .where(and(eq(docFeedback.pageId, pageId), eq(docFeedback.helpful, false)))

    return { likes: likes.count, dislikes: dislikes.count }
  },

  async getAllStats() {
    const rows = await db
      .select({
        pageId: docFeedback.pageId,
        helpful: docFeedback.helpful,
        count: count(),
      })
      .from(docFeedback)
      .groupBy(docFeedback.pageId, docFeedback.helpful)

    const statsMap: Record<string, { likes: number; dislikes: number }> = {}
    for (const row of rows) {
      if (!statsMap[row.pageId]) statsMap[row.pageId] = { likes: 0, dislikes: 0 }
      if (row.helpful) {
        statsMap[row.pageId].likes = row.count
      } else {
        statsMap[row.pageId].dislikes = row.count
      }
    }

    return Object.entries(statsMap)
      .map(([pageId, stats]) => ({ pageId, ...stats, total: stats.likes + stats.dislikes }))
      .sort((a, b) => b.total - a.total)
  },
}
