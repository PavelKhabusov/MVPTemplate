import { FastifyRequest, FastifyReply } from 'fastify'
import { authService } from '../../modules/auth/auth.service'
import { AppError } from '../errors/app-error'

declare module 'fastify' {
  interface FastifyRequest {
    userId: string
    userEmail: string
  }
}

export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  const authHeader = request.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    throw AppError.unauthorized('Missing authorization header')
  }

  const token = authHeader.slice(7)
  const payload = authService.verifyAccessToken(token)

  request.userId = payload.sub
  request.userEmail = payload.email
}
