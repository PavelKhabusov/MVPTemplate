import { FastifyRequest, FastifyReply } from 'fastify'
import { usersRepository } from '../../modules/users/users.repository'
import { AppError } from '../errors/app-error'

export async function requireAdmin(request: FastifyRequest, _reply: FastifyReply) {
  const user = await usersRepository.findById(request.userId)
  if (!user || user.role !== 'admin') {
    throw AppError.forbidden('Admin access required')
  }
}
