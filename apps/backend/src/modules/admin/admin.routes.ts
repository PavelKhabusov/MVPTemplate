import { FastifyInstance } from 'fastify'
import fs from 'fs'
import path from 'path'
import { z } from 'zod'
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
    keys: ['PAYMENTS_ENABLED', 'STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET', 'YOOKASSA_SHOP_ID', 'YOOKASSA_SECRET_KEY', 'YOOKASSA_WEBHOOK_SECRET', 'ROBOKASSA_MERCHANT_LOGIN', 'ROBOKASSA_PASSWORD1', 'ROBOKASSA_PASSWORD2', 'ROBOKASSA_TEST_MODE'],
    types: { PAYMENTS_ENABLED: 'boolean', STRIPE_SECRET_KEY: 'secret', STRIPE_WEBHOOK_SECRET: 'secret', YOOKASSA_SHOP_ID: 'secret', YOOKASSA_SECRET_KEY: 'secret', YOOKASSA_WEBHOOK_SECRET: 'secret', ROBOKASSA_MERCHANT_LOGIN: 'secret', ROBOKASSA_PASSWORD1: 'secret', ROBOKASSA_PASSWORD2: 'secret', ROBOKASSA_TEST_MODE: 'boolean' } as Record<string, string>,
  },
  frontend: {
    keys: ['EXPO_PUBLIC_DOCS_ENABLED', 'EXPO_PUBLIC_COOKIE_BANNER', 'EXPO_PUBLIC_COLOR_SCHEME', 'EXPO_PUBLIC_CUSTOM_COLOR'],
    types: { EXPO_PUBLIC_DOCS_ENABLED: 'boolean', EXPO_PUBLIC_COOKIE_BANNER: 'boolean', EXPO_PUBLIC_COLOR_SCHEME: 'string', EXPO_PUBLIC_CUSTOM_COLOR: 'string' } as Record<string, string>,
  },
} as const

const ALL_ALLOWED_KEYS: string[] = Object.values(ENV_GROUPS).flatMap((g) => [...g.keys])

const updateEnvSchema = z.record(z.string(), z.union([z.string(), z.boolean(), z.null()]))

function getEnvFilePath(): string {
  return path.resolve(process.cwd(), '.env')
}

function parseEnvFile(filePath: string): { lines: string[]; values: Record<string, string | null> } {
  const content = fs.readFileSync(filePath, 'utf-8')
  const lines = content.split('\n')
  const values: Record<string, string | null> = {}

  for (const line of lines) {
    const trimmed = line.trim()
    // Active variable: KEY=VALUE
    const activeMatch = trimmed.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/)
    if (activeMatch) {
      values[activeMatch[1]] = activeMatch[2]
      continue
    }
    // Commented variable: # KEY=VALUE
    const commentMatch = trimmed.match(/^#\s*([A-Z_][A-Z0-9_]*)=(.*)$/)
    if (commentMatch) {
      if (!(commentMatch[1] in values)) {
        values[commentMatch[1]] = null // null means commented out
      }
    }
  }
  return { lines, values }
}

function updateEnvFile(filePath: string, updates: Record<string, string | boolean | null>): Record<string, string | null> {
  const content = fs.readFileSync(filePath, 'utf-8')
  const lines = content.split('\n')
  const updatedKeys = new Set<string>()

  const newLines = lines.map((line) => {
    const trimmed = line.trim()

    // Check active variable
    const activeMatch = trimmed.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/)
    if (activeMatch && activeMatch[1] in updates) {
      const key = activeMatch[1]
      const newValue = updates[key]
      updatedKeys.add(key)
      if (newValue === null || newValue === '') {
        // Comment out
        return `# ${key}=${activeMatch[2]}`
      }
      const val = typeof newValue === 'boolean' ? String(newValue) : newValue
      return `${key}=${val}`
    }

    // Check commented variable
    const commentMatch = trimmed.match(/^#\s*([A-Z_][A-Z0-9_]*)=(.*)$/)
    if (commentMatch && commentMatch[1] in updates) {
      const key = commentMatch[1]
      if (updatedKeys.has(key)) return line // already handled
      const newValue = updates[key]
      updatedKeys.add(key)
      if (newValue === null || newValue === '') {
        return line // keep commented
      }
      // __TOGGLE_ON__ means uncomment with existing placeholder value
      if (newValue === '__TOGGLE_ON__') {
        return `${key}=${commentMatch[2]}`
      }
      const val = typeof newValue === 'boolean' ? String(newValue) : newValue
      return `${key}=${val}`
    }

    return line
  })

  // Add any new keys that weren't found in the file
  for (const [key, value] of Object.entries(updates)) {
    if (!updatedKeys.has(key) && value !== null && value !== '') {
      const val = typeof value === 'boolean' ? String(value) : value
      newLines.push(`${key}=${val}`)
    }
  }

  fs.writeFileSync(filePath, newLines.join('\n'), 'utf-8')

  // Return the updated values
  return parseEnvFile(filePath).values
}

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

  // GET /api/admin/env — read current .env values (only allowed keys)
  app.get('/env', async (_request, reply) => {
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

  // PATCH /api/admin/env — update .env values
  app.patch('/env', async (request, reply) => {
    try {
      const body = updateEnvSchema.parse(request.body)

      // Filter to only allowed keys
      const filtered: Record<string, string | boolean | null> = {}
      for (const [key, value] of Object.entries(body)) {
        if (ALL_ALLOWED_KEYS.includes(key)) {
          filtered[key] = value
        }
      }

      if (Object.keys(filtered).length === 0) {
        throw AppError.badRequest('No valid environment keys provided')
      }

      const envPath = getEnvFilePath()
      updateEnvFile(envPath, filtered)

      // Re-read and return updated state
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
      if (err instanceof AppError) throw err
      throw AppError.internal('Failed to update environment file')
    }
  })
}
