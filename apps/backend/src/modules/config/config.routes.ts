import { FastifyInstance } from 'fastify'
import { env } from '../../config/env'
import { db } from '../../config/database'
import { companyInfo } from '../../database/schema/index'
import { eq } from 'drizzle-orm'

const DEFAULT_COMPANY_INFO = {
  id: 1,
  appName: 'CallSheet',
  companyName: '',
  tagline: '',
  supportEmail: '',
  website: '',
  phone: '',
  address: '',
  updatedAt: new Date(0),
}

/**
 * Public config endpoint — tells the frontend which backend-controlled
 * feature flags are active based on environment variables.
 */
export async function configRoutes(app: FastifyInstance) {
  app.get('/flags', async (_request, reply) => {
    return reply.send({
      data: {
        email: env.EMAIL_ENABLED,
        emailVerification: env.EMAIL_VERIFICATION_REQUIRED,
        googleAuth: !!env.GOOGLE_CLIENT_ID,
        requestLogging: env.REQUEST_LOGGING,
        analytics: env.ANALYTICS_ENABLED,
        pushNotifications: !!env.EXPO_ACCESS_TOKEN,
        payments: env.PAYMENTS_ENABLED,
      },
    })
  })

  // GET /api/config/company — public company info for the app
  app.get('/company', async (_request, reply) => {
    const [info] = await db.select().from(companyInfo).where(eq(companyInfo.id, 1))
    return reply.send({ data: info ?? DEFAULT_COMPANY_INFO })
  })
}
