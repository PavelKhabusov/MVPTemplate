import { FastifyInstance } from 'fastify'
import { authenticate } from '../../common/middleware/authenticate'
import { requireAdmin } from '../../common/middleware/require-admin'
import { adminRepository } from './admin.repository'
import {
  listUsersQuerySchema,
  updateUserAdminSchema,
  AVAILABLE_ROLES,
  AVAILABLE_FEATURES,
} from './admin.schema'
import { sendSuccess, sendPaginated } from '../../common/utils/response'
import { AppError } from '../../common/errors/app-error'
import { env } from '../../config/env'
import { getEnvFilePath, parseEnvFile } from '../../common/utils/env-file'

// Keys exposed via the admin env API, grouped by category
const ENV_GROUPS = {
  analytics: {
    keys: ['ANALYTICS_ENABLED', 'REQUEST_LOGGING', 'EXPO_PUBLIC_POSTHOG_KEY'],
    types: { ANALYTICS_ENABLED: 'boolean', REQUEST_LOGGING: 'boolean', EXPO_PUBLIC_POSTHOG_KEY: 'secret' } as Record<string, string>,
  },
  email: {
    keys: ['EMAIL_ENABLED', 'EMAIL_VERIFICATION_REQUIRED', 'SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'SMTP_FROM'],
    types: { EMAIL_ENABLED: 'boolean', EMAIL_VERIFICATION_REQUIRED: 'boolean', SMTP_HOST: 'string', SMTP_PORT: 'string', SMTP_USER: 'string', SMTP_PASS: 'secret', SMTP_FROM: 'string' } as Record<string, string>,
  },
  auth: {
    keys: ['GOOGLE_CLIENT_ID'],
    types: { GOOGLE_CLIENT_ID: 'secret' } as Record<string, string>,
  },
  pushNotifications: {
    keys: ['EXPO_ACCESS_TOKEN'],
    types: { EXPO_ACCESS_TOKEN: 'secret' } as Record<string, string>,
  },
  payments: {
    keys: ['PAYMENTS_ENABLED', 'STRIPE_ENABLED', 'STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET', 'YOOKASSA_ENABLED', 'YOOKASSA_SHOP_ID', 'YOOKASSA_SECRET_KEY', 'YOOKASSA_WEBHOOK_SECRET', 'ROBOKASSA_ENABLED', 'ROBOKASSA_MERCHANT_LOGIN', 'ROBOKASSA_PASSWORD1', 'ROBOKASSA_PASSWORD2', 'ROBOKASSA_TEST_MODE', 'PAYPAL_ENABLED', 'PAYPAL_CLIENT_ID', 'PAYPAL_CLIENT_SECRET', 'PAYPAL_WEBHOOK_ID', 'PAYPAL_MODE'],
    types: { PAYMENTS_ENABLED: 'boolean', STRIPE_ENABLED: 'boolean', STRIPE_SECRET_KEY: 'secret', STRIPE_WEBHOOK_SECRET: 'secret', YOOKASSA_ENABLED: 'boolean', YOOKASSA_SHOP_ID: 'secret', YOOKASSA_SECRET_KEY: 'secret', YOOKASSA_WEBHOOK_SECRET: 'secret', ROBOKASSA_ENABLED: 'boolean', ROBOKASSA_MERCHANT_LOGIN: 'secret', ROBOKASSA_PASSWORD1: 'secret', ROBOKASSA_PASSWORD2: 'secret', ROBOKASSA_TEST_MODE: 'boolean', PAYPAL_ENABLED: 'boolean', PAYPAL_CLIENT_ID: 'secret', PAYPAL_CLIENT_SECRET: 'secret', PAYPAL_WEBHOOK_ID: 'secret', PAYPAL_MODE: 'string' } as Record<string, string>,
  },
  frontend: {
    keys: ['EXPO_PUBLIC_DOCS_ENABLED', 'EXPO_PUBLIC_COOKIE_BANNER', 'EXPO_PUBLIC_COLOR_SCHEME', 'EXPO_PUBLIC_CUSTOM_COLOR'],
    types: { EXPO_PUBLIC_DOCS_ENABLED: 'boolean', EXPO_PUBLIC_COOKIE_BANNER: 'boolean', EXPO_PUBLIC_COLOR_SCHEME: 'string', EXPO_PUBLIC_CUSTOM_COLOR: 'string' } as Record<string, string>,
  },
  storage: {
    keys: ['STORAGE_TYPE', 'S3_ENDPOINT', 'S3_BUCKET', 'S3_ACCESS_KEY', 'S3_SECRET_KEY', 'S3_REGION', 'S3_PUBLIC_URL'],
    types: { STORAGE_TYPE: 'string', S3_ENDPOINT: 'string', S3_BUCKET: 'string', S3_ACCESS_KEY: 'secret', S3_SECRET_KEY: 'secret', S3_REGION: 'string', S3_PUBLIC_URL: 'string' } as Record<string, string>,
  },
  ai: {
    keys: ['GEMINI_API_KEY', 'GEMINI_MODEL', 'GEMINI_CONCURRENT_LIMIT', 'OPENAI_API_KEY', 'OPENAI_MODEL', 'OPENAI_MAX_TOKENS', 'AI_PROXY_ENABLED'],
    types: { GEMINI_API_KEY: 'secret', GEMINI_MODEL: 'string', GEMINI_CONCURRENT_LIMIT: 'string', OPENAI_API_KEY: 'secret', OPENAI_MODEL: 'string', OPENAI_MAX_TOKENS: 'string', AI_PROXY_ENABLED: 'boolean' } as Record<string, string>,
  },
} as const

const ALL_ENV_KEYS: string[] = Object.values(ENV_GROUPS).flatMap((g) => [...g.keys])

export async function adminRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authenticate)
  app.addHook('preHandler', requireAdmin)

  // GET /api/admin/users
  app.get('/users', async (request, reply) => {
    const query = listUsersQuerySchema.parse(request.query)
    const { items, total } = await adminRepository.listUsers(query.page, query.limit, query.search)
    return sendPaginated(reply, items, { page: query.page, limit: query.limit, total })
  })

  // GET /api/admin/users/:id
  app.get('/users/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    const user = await adminRepository.getUserById(id)
    if (!user) throw AppError.notFound('User not found')
    return sendSuccess(reply, user)
  })

  // PATCH /api/admin/users/:id
  app.patch('/users/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    const body = updateUserAdminSchema.parse(request.body)
    const user = await adminRepository.updateUserAdmin(id, body)
    if (!user) throw AppError.notFound('User not found')
    return sendSuccess(reply, user)
  })

  // GET /api/admin/stats
  app.get('/stats', async (_request, reply) => {
    const stats = await adminRepository.getStats()
    return sendSuccess(reply, stats)
  })

  // GET /api/admin/config — available roles & features
  app.get('/config', async (_request, reply) => {
    return sendSuccess(reply, {
      roles: AVAILABLE_ROLES,
      features: AVAILABLE_FEATURES,
    })
  })

  // GET /api/admin/env — read current .env values (only allowed keys, disabled in production)
  app.get('/env', async (_request, reply) => {
    if (env.NODE_ENV === 'production') {
      throw AppError.forbidden('Environment configuration is not accessible via API in production')
    }
    try {
      const envPath = getEnvFilePath()
      const { values } = parseEnvFile(envPath)

      const result: Record<string, Record<string, { value: string | null; type: string }>> = {}
      for (const [group, config] of Object.entries(ENV_GROUPS)) {
        result[group] = {}
        for (const key of config.keys) {
          result[group][key] = {
            value: key in values ? values[key] : null,
            type: config.types[key] || 'string',
          }
        }
      }

      return sendSuccess(reply, result)
    } catch (err: any) {
      throw AppError.internal('Failed to read environment file')
    }
  })
}
