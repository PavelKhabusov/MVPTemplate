import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { eq, and, desc, sql, count } from 'drizzle-orm'
import { authenticate } from '../../common/middleware/authenticate'
import { requireAdmin } from '../../common/middleware/require-admin'
import { sendSuccess, sendPaginated } from '../../common/utils/response'
import { db } from '../../config/database'
import { pushTokens, notifications } from '../../database/schema/index'
import { users } from '../../database/schema/users'
import { sendToUsers } from './push.service'

const registerTokenSchema = z.object({
  token: z.string().min(1).max(500),
  platform: z.enum(['ios', 'android', 'web']),
})

const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(20),
})

const sendNotificationSchema = z.object({
  title: z.string().min(1).max(255),
  body: z.string().max(1000).optional(),
  userIds: z.array(z.string().uuid()).optional(),
})

export async function pushRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authenticate)

  // POST /api/push/register
  app.post('/register', async (request, reply) => {
    const { token, platform } = registerTokenSchema.parse(request.body)

    // Upsert: delete existing token for this user+platform, then insert
    await db
      .delete(pushTokens)
      .where(
        and(eq(pushTokens.userId, request.userId), eq(pushTokens.platform, platform))
      )

    await db.insert(pushTokens).values({
      userId: request.userId,
      token,
      platform,
    })

    return sendSuccess(reply, { registered: true })
  })

  // DELETE /api/push/unregister
  app.delete('/unregister', async (request, reply) => {
    await db.delete(pushTokens).where(eq(pushTokens.userId, request.userId))
    return sendSuccess(reply, { unregistered: true })
  })

  // POST /api/push/send — admin sends notification to users
  app.post('/send', { preHandler: [authenticate, requireAdmin] }, async (request, reply) => {
    const { title, body, userIds } = sendNotificationSchema.parse(request.body)
    const result = await sendToUsers(userIds ?? null, { title, body })
    return sendSuccess(reply, result)
  })

  // GET /api/push/history — admin notification send history (grouped by title+body+createdAt)
  app.get('/history', { preHandler: [authenticate, requireAdmin] }, async (request, reply) => {
    const { page: p, limit: l } = paginationSchema.parse(request.query)

    // Get distinct notification sends grouped by title, body, type, and approximate time
    const result = await db
      .select({
        title: notifications.title,
        body: notifications.body,
        type: notifications.type,
        createdAt: sql<string>`MIN(${notifications.createdAt})`.as('created_at'),
        recipientCount: count(notifications.id).as('recipient_count'),
      })
      .from(notifications)
      .where(eq(notifications.type, 'general'))
      .groupBy(notifications.title, notifications.body, notifications.type)
      .orderBy(desc(sql`MIN(${notifications.createdAt})`))
      .limit(l)
      .offset((p - 1) * l)

    return sendPaginated(reply, result, { page: p, limit: l, total: result.length })
  })
}
