import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { authenticate } from '../../common/middleware/authenticate'
import { requireAdmin } from '../../common/middleware/require-admin'
import { emailService } from './email.service'
import { sendSuccess } from '../../common/utils/response'
import { db } from '../../config/database'
import { users } from '../../database/schema/index'
import { isNotNull } from 'drizzle-orm'

const broadcastSchema = z.object({
  template: z.enum(['welcome', 'announcement']),
  subject: z.string().min(1).max(255).optional(),
  title: z.string().min(1).max(255).optional(),
  body: z.string().min(1).optional(),
  footer: z.string().max(500).optional(),
  buttonText: z.string().max(100).optional(),
  buttonUrl: z.string().url().optional(),
})

export async function emailRoutes(app: FastifyInstance) {
  // POST /api/email/broadcast — send template email to all users (admin only)
  app.post('/broadcast', { preHandler: [authenticate, requireAdmin] }, async (request, reply) => {
    const body = broadcastSchema.parse(request.body)

    const recipients = await db
      .select({ email: users.email, name: users.name })
      .from(users)
      .where(isNotNull(users.email))

    const validRecipients = recipients.filter((r) => r.email) as Array<{ email: string; name: string }>

    let result: { sent: number; failed: number; total: number }

    if (body.template === 'welcome') {
      result = await emailService.broadcastWelcome(validRecipients)
    } else {
      if (!body.subject || !body.title || !body.body) {
        reply.code(400)
        return reply.send({ error: 'subject, title and body are required for announcement' })
      }
      result = await emailService.broadcastAnnouncement(validRecipients, {
        subject: body.subject,
        title: body.title,
        body: body.body,
        footer: body.footer,
        buttonText: body.buttonText,
        buttonUrl: body.buttonUrl,
      })
    }

    return sendSuccess(reply, result)
  })
}
