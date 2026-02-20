import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { eq, desc, and } from 'drizzle-orm'
import { authenticate } from '../../common/middleware/authenticate'
import { sendSuccess, sendPaginated } from '../../common/utils/response'
import { db } from '../../config/database'
import { notifications } from '../../database/schema/index'

const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(20),
})

export async function notificationsRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authenticate)

  // GET /api/notifications
  app.get('/', async (request, reply) => {
    const { page: p, limit: l } = paginationSchema.parse(request.query)

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
    const result = await db
      .update(notifications)
      .set({ isRead: true })
      .where(and(eq(notifications.id, id), eq(notifications.userId, request.userId)))
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
