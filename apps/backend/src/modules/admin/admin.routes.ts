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
}
