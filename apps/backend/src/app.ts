import { join } from 'path'
import Fastify from 'fastify'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import rateLimit from '@fastify/rate-limit'
import multipart from '@fastify/multipart'
import fastifyStatic from '@fastify/static'
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
import { analyticsRoutes } from './modules/analytics/analytics.routes'
import { docFeedbackRoutes } from './modules/doc-feedback/doc-feedback.routes'
import { sseRoutes } from './realtime/sse'
import { configRoutes } from './modules/config/config.routes'
import { paymentsRoutes } from './modules/payments/payments.routes'
import { StorageService } from './modules/storage/storage.service'
import { storageRoutes } from './modules/storage/storage.routes'
import { proxyRoutes } from './modules/proxy/proxy.routes'
import { emailRoutes } from './modules/email/email.routes'

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
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
  await app.register(cors, {
    origin: env.NODE_ENV === 'development'
      ? ['http://localhost:8081', 'http://localhost:3000', 'http://localhost:19006']
      : env.CORS_ORIGIN,
    credentials: true,
  })

  // Global rate limiting (100 req/min per IP)
  await app.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
    redis,
    keyGenerator: (request) => request.ip,
  })

  // Documentation (development only — disabled in production)
  if (env.NODE_ENV !== 'production') {
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
  }

  // File uploads
  await app.register(multipart, { limits: { fileSize: 5 * 1024 * 1024 } })

  // Serve uploaded files
  await app.register(fastifyStatic, {
    root: join(process.cwd(), 'uploads'),
    prefix: '/uploads/',
    decorateReply: false,
  })

  // Storage service (local / S3)
  const storageService = new StorageService()
  app.decorate('storageService', storageService)

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
  if (env.ANALYTICS_ENABLED) {
    await app.register(analyticsRoutes, { prefix: '/api/analytics' })
  }
  await app.register(docFeedbackRoutes, { prefix: '/api/doc-feedback' })
  await app.register(configRoutes, { prefix: '/api/config' })
  if (env.PAYMENTS_ENABLED) {
    await app.register(paymentsRoutes, { prefix: '/api/payments' })
  }

  if (env.EMAIL_ENABLED) {
    await app.register(emailRoutes, { prefix: '/api/email' })
  }
  await app.register(storageRoutes, { prefix: '/api/admin/storage' })
  await app.register(proxyRoutes, { prefix: '/api/admin/proxies' })

  // Real-time
  await app.register(sseRoutes, { prefix: '/api/sse' })

  return app
}
