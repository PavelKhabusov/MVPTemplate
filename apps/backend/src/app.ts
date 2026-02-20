import Fastify from 'fastify'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import swagger from '@fastify/swagger'
import swaggerUi from '@fastify/swagger-ui'
import { env } from './config/env.js'
import { logger } from './config/logger.js'
import { errorHandler } from './common/middleware/error-handler.js'
import { authRoutes } from './modules/auth/auth.routes.js'
import { usersRoutes } from './modules/users/users.routes.js'
import { pushRoutes } from './modules/push/push.routes.js'
import { notificationsRoutes } from './modules/notifications/notifications.routes.js'
import { searchRoutes } from './modules/search/search.routes.js'
import { sseRoutes } from './realtime/sse.js'

export async function buildApp() {
  const app = Fastify({ logger })

  // Security
  await app.register(helmet, { global: true })
  await app.register(cors, { origin: env.CORS_ORIGIN, credentials: true })

  // Documentation
  await app.register(swagger, {
    openapi: {
      info: {
        title: 'MVP Template API',
        version: '1.0.0',
        description: 'API documentation for MVP Template',
      },
      servers: [
        { url: `http://${env.HOST}:${env.PORT}`, description: 'Development' },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
      },
    },
  })
  await app.register(swaggerUi, {
    routePrefix: '/docs',
    uiConfig: { docExpansion: 'list' },
  })

  // Error handler
  app.setErrorHandler(errorHandler)

  // Health check
  app.get('/health', async () => ({
    status: 'ok',
    timestamp: new Date().toISOString(),
  }))

  // API routes
  await app.register(authRoutes, { prefix: '/api/auth' })
  await app.register(usersRoutes, { prefix: '/api/users' })
  await app.register(pushRoutes, { prefix: '/api/push' })
  await app.register(notificationsRoutes, { prefix: '/api/notifications' })
  await app.register(searchRoutes, { prefix: '/api/search' })

  // Real-time
  await app.register(sseRoutes, { prefix: '/api/sse' })

  return app
}
