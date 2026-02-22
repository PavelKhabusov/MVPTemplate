import { FastifyInstance } from 'fastify'
import { env } from '../../config/env'

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
}
