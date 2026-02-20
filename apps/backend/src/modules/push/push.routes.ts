import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { eq, and } from 'drizzle-orm'
import { authenticate } from '../../common/middleware/authenticate.js'
import { sendSuccess } from '../../common/utils/response.js'
import { db } from '../../config/database.js'
import { pushTokens } from '../../database/schema/index.js'

const registerTokenSchema = z.object({
  token: z.string(),
  platform: z.enum(['ios', 'android', 'web']),
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
}
