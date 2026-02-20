import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { sql } from 'drizzle-orm'
import rateLimit from '@fastify/rate-limit'
import { authenticate } from '../../common/middleware/authenticate'
import { sendSuccess } from '../../common/utils/response'
import { db } from '../../config/database'
import { redis } from '../../config/redis'

const searchQuerySchema = z.object({
  q: z.string().min(2).max(100),
  type: z.enum(['all', 'users']).default('all'),
  limit: z.coerce.number().int().positive().max(50).default(20),
})

export async function searchRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authenticate)

  // Stricter rate limit for search (20 req/min)
  await app.register(rateLimit, {
    max: 20,
    timeWindow: '1 minute',
    redis,
    keyGenerator: (request) => request.ip,
  })

  // GET /api/search?q=query&type=users
  app.get('/', async (request, reply) => {
    const parsed = searchQuerySchema.safeParse(request.query)
    if (!parsed.success) {
      return sendSuccess(reply, [])
    }
    const { q, limit: searchLimit } = parsed.data

    // PostgreSQL full-text search (no email in results)
    const results = await db.execute(sql`
      SELECT id, name, avatar_url,
             ts_rank(to_tsvector('english', name), plainto_tsquery('english', ${q})) AS rank
      FROM users
      WHERE to_tsvector('english', name) @@ plainto_tsquery('english', ${q})
      ORDER BY rank DESC
      LIMIT ${searchLimit}
    `)

    return sendSuccess(reply, results)
  })
}
