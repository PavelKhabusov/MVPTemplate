import { FastifyInstance } from 'fastify'
import rateLimit from '@fastify/rate-limit'
import { authService } from './auth.service'
import {
  registerSchema, loginSchema, refreshSchema, googleAuthSchema,
  verifyEmailSchema, requestPasswordResetSchema, resetPasswordSchema, resendVerificationSchema,
  sendPhoneCodeSchema, verifyPhoneSchema,
} from './auth.schema'
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
    const locale = (request.headers['accept-language']?.split(',')[0]?.split('-')[0]) || 'en'
    const tokens = await authService.register({ ...body, locale })
    return sendSuccess(reply, tokens, 201)
  })

  // POST /api/auth/login
  app.post('/login', async (request, reply) => {
    const body = loginSchema.parse(request.body)
    const tokens = await authService.login(body)
    return sendSuccess(reply, tokens)
  })

  // POST /api/auth/google
  app.post('/google', async (request, reply) => {
    const body = googleAuthSchema.parse(request.body)
    const tokens = await authService.googleAuth(body)
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

  // POST /api/auth/verify-email
  app.post('/verify-email', async (request, reply) => {
    const { token } = verifyEmailSchema.parse(request.body)
    const result = await authService.verifyEmail(token)
    return sendSuccess(reply, result)
  })

  // POST /api/auth/request-password-reset
  app.post('/request-password-reset', async (request, reply) => {
    const { email } = requestPasswordResetSchema.parse(request.body)
    const locale = (request.headers['accept-language']?.split(',')[0]?.split('-')[0]) || 'en'
    const result = await authService.requestPasswordReset(email, locale)
    return sendSuccess(reply, result)
  })

  // POST /api/auth/reset-password
  app.post('/reset-password', async (request, reply) => {
    const body = resetPasswordSchema.parse(request.body)
    const result = await authService.resetPassword(body.token, body.password)
    return sendSuccess(reply, result)
  })

  // POST /api/auth/resend-verification (authenticated)
  app.post('/resend-verification', { preHandler: [authenticate] }, async (request, reply) => {
    const { locale } = resendVerificationSchema.parse(request.body)
    const result = await authService.resendVerification(request.userId, locale)
    return sendSuccess(reply, result)
  })

  // POST /api/auth/send-phone-code (authenticated)
  app.post('/send-phone-code', { preHandler: [authenticate] }, async (request, reply) => {
    const input = sendPhoneCodeSchema.parse(request.body)
    const result = await authService.sendPhoneCode(request.userId, input)
    return sendSuccess(reply, result)
  })

  // POST /api/auth/verify-phone (authenticated)
  app.post('/verify-phone', { preHandler: [authenticate] }, async (request, reply) => {
    const input = verifyPhoneSchema.parse(request.body)
    const result = await authService.verifyPhone(request.userId, input)
    return sendSuccess(reply, result)
  })
}
