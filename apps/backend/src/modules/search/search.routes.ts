import { FastifyInstance } from 'fastify'
import { sql } from 'drizzle-orm'
import { authenticate } from '../../common/middleware/authenticate.js'
import { sendSuccess } from '../../common/utils/response.js'
import { db } from '../../config/database.js'

export async function searchRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authenticate)

  // GET /api/search?q=query&type=users
  app.get('/', async (request, reply) => {
    const { q, type = 'all', limit = '20' } = request.query as Record<string, string>

    if (!q || q.length < 2) {
      return sendSuccess(reply, [])
    }

    const searchLimit = Math.min(50, Math.max(1, parseInt(limit)))

    // PostgreSQL full-text search
    const results = await db.execute(sql`
      SELECT id, name, email, avatar_url,
             ts_rank(to_tsvector('english', name || ' ' || email), plainto_tsquery('english', ${q})) AS rank
      FROM users
      WHERE to_tsvector('english', name || ' ' || email) @@ plainto_tsquery('english', ${q})
      ORDER BY rank DESC
      LIMIT ${searchLimit}
    `)

    return sendSuccess(reply, results)
  })
}
