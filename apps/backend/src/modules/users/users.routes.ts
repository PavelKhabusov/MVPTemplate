import { FastifyInstance } from 'fastify'
import { authenticate } from '../../common/middleware/authenticate'
import { usersRepository } from './users.repository'
import { updateProfileSchema, updateSettingsSchema } from './users.schema'
import { sendSuccess } from '../../common/utils/response'
import { AppError } from '../../common/errors/app-error'

export async function usersRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authenticate)

  // GET /api/users/profile
  app.get('/profile', async (request, reply) => {
    const user = await usersRepository.findById(request.userId)
    if (!user) throw AppError.notFound('User not found')

    const { passwordHash, ...profile } = user
    return sendSuccess(reply, profile)
  })

  // PATCH /api/users/profile
  app.patch('/profile', async (request, reply) => {
    const body = updateProfileSchema.parse(request.body)
    const user = await usersRepository.updateProfile(request.userId, body)
    if (!user) throw AppError.notFound('User not found')

    const { passwordHash, ...profile } = user
    return sendSuccess(reply, profile)
  })

  // GET /api/users/settings
  app.get('/settings', async (request, reply) => {
    const settings = await usersRepository.getSettings(request.userId)
    return sendSuccess(reply, settings?.settings ?? {})
  })

  // PATCH /api/users/settings
  app.patch('/settings', async (request, reply) => {
    const body = updateSettingsSchema.parse(request.body)
    const result = await usersRepository.upsertSettings(request.userId, body)
    return sendSuccess(reply, result.settings)
  })
}
