import Fastify from 'fastify'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import rateLimit from '@fastify/rate-limit'
import swagger from '@fastify/swagger'
import swaggerUi from '@fastify/swagger-ui'
import { env } from './config/env'
import { loggerConfig } from './config/logger'
import { redis } from './config/redis'
import { errorHandler } from './common/middleware/error-handler'
import { authRoutes } from './modules/auth/auth.routes'
import { usersRoutes } from './modules/users/users.routes'
import { pushRoutes } from './modules/push/push.routes'
import { notificationsRoutes } from './modules/notifications/notifications.routes'
import { searchRoutes } from './modules/search/search.routes'
import { adminRoutes } from './modules/admin/admin.routes'
import { sseRoutes } from './realtime/sse'

export async function buildApp() {
  const app = Fastify({ logger: loggerConfig })

  // Security headers
  await app.register(helmet, {
    global: true,
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"], // unsafe-inline for Swagger UI
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'"],
      },
    },
    hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  })
  await app.register(cors, { origin: env.CORS_ORIGIN, credentials: true })

  // Global rate limiting (100 req/min per IP)
  await app.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
    redis,
    keyGenerator: (request) => request.ip,
  })

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
  await app.register(adminRoutes, { prefix: '/api/admin' })

  // Real-time
  await app.register(sseRoutes, { prefix: '/api/sse' })

  return app
}
