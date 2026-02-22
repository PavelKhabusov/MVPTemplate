import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { eq, and } from 'drizzle-orm'
import { authenticate } from '../../common/middleware/authenticate'
import { requireAdmin } from '../../common/middleware/require-admin'
import { sendSuccess } from '../../common/utils/response'
import { db } from '../../config/database'
import { pushTokens } from '../../database/schema/index'
import { sendToUsers } from './push.service'

const registerTokenSchema = z.object({
  token: z.string().min(1).max(500),
  platform: z.enum(['ios', 'android', 'web']),
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
}
