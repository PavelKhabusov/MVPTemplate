import { FastifyInstance } from 'fastify'
import { eq, desc } from 'drizzle-orm'
import { authenticate } from '../../common/middleware/authenticate.js'
import { sendSuccess, sendPaginated } from '../../common/utils/response.js'
import { db } from '../../config/database.js'
import { notifications } from '../../database/schema/index.js'

export async function notificationsRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authenticate)

  // GET /api/notifications
  app.get('/', async (request, reply) => {
    const { page = '1', limit = '20' } = request.query as Record<string, string>
    const p = Math.max(1, parseInt(page))
    const l = Math.min(50, Math.max(1, parseInt(limit)))

    const result = await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, request.userId))
      .orderBy(desc(notifications.createdAt))
      .limit(l)
      .offset((p - 1) * l)

    return sendPaginated(reply, result, { page: p, limit: l, total: result.length })
  })

  // PATCH /api/notifications/:id/read
  app.patch('/:id/read', async (request, reply) => {
    const { id } = request.params as { id: string }
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, id))
    return sendSuccess(reply, { read: true })
  })

  // POST /api/notifications/read-all
  app.post('/read-all', async (request, reply) => {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.userId, request.userId))
    return sendSuccess(reply, { readAll: true })
  })
}
