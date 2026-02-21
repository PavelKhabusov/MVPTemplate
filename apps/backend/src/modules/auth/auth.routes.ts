import { FastifyInstance } from 'fastify'
import rateLimit from '@fastify/rate-limit'
import { authService } from './auth.service'
import { registerSchema, loginSchema, refreshSchema } from './auth.schema'
import { authenticate } from '../../common/middleware/authenticate'
import { sendSuccess } from '../../common/utils/response'
import { redis } from '../../config/redis'

export async function authRoutes(app: FastifyInstance) {
  // Rate limit auth endpoints
  await app.register(rateLimit, {
    max: 30,
    timeWindow: '1 minute',
    redis,
    keyGenerator: (request) => request.ip,
  })

  // POST /api/auth/register
  app.post('/register', async (request, reply) => {
    const body = registerSchema.parse(request.body)
    const tokens = await authService.register(body)
    return sendSuccess(reply, tokens, 201)
  })

  // POST /api/auth/login
  app.post('/login', async (request, reply) => {
    const body = loginSchema.parse(request.body)
    const tokens = await authService.login(body)
    return sendSuccess(reply, tokens)
  })

  // POST /api/auth/refresh
  app.post('/refresh', async (request, reply) => {
    const body = refreshSchema.parse(request.body)
    const tokens = await authService.refresh(body.refreshToken)
    return sendSuccess(reply, tokens)
  })

  // POST /api/auth/logout
  app.post('/logout', { preHandler: [authenticate] }, async (request, reply) => {
    const { refreshToken } = refreshSchema.parse(request.body)
    await authService.logout(refreshToken)
    return sendSuccess(reply, { message: 'Logged out' })
  })

  // GET /api/auth/me
  app.get('/me', { preHandler: [authenticate] }, async (request, reply) => {
    const user = await authService.getMe(request.userId)
    return sendSuccess(reply, user)
  })
}
