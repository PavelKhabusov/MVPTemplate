import { FastifyInstance } from 'fastify'
import { authenticate } from '../../common/middleware/authenticate'
import { requireAdmin } from '../../common/middleware/require-admin'
import { sendSuccess, sendPaginated } from '../../common/utils/response'
import { paymentsService } from './payments.service'
import { getPaymentProvider } from './providers/provider-factory'
import {
  checkoutSchema,
  paginationSchema,
  createPlanSchema,
} from './payments.schema'

export async function paymentsRoutes(app: FastifyInstance) {
  // --- Public ---

  app.get('/plans', async (_request, reply) => {
    const plans = await paymentsService.getPlans()
    return sendSuccess(reply, plans)
  })

  // --- Authenticated ---

  app.post('/checkout', { preHandler: [authenticate] }, async (request, reply) => {
    const input = checkoutSchema.parse(request.body)
    const result = await paymentsService.createCheckout(request.userId, request.userEmail, input)
    return sendSuccess(reply, result)
  })

  app.get('/subscription', { preHandler: [authenticate] }, async (request, reply) => {
    const subscription = await paymentsService.getSubscription(request.userId)
    return sendSuccess(reply, subscription)
  })

  app.post('/cancel', { preHandler: [authenticate] }, async (request, reply) => {
    const result = await paymentsService.cancelSubscription(request.userId)
    return sendSuccess(reply, result)
  })

  app.get('/history', { preHandler: [authenticate] }, async (request, reply) => {
    const { page, limit } = paginationSchema.parse(request.query)
    const { data, total } = await paymentsService.getPaymentHistory(request.userId, page, limit)
    return sendPaginated(reply, data, { page, limit, total })
  })

  // --- Webhooks (isolated plugin scope so raw body parser doesn't affect other routes) ---

  await app.register(async function webhookRoutes(webhook) {
    webhook.addContentTypeParser(
      'application/json',
      { parseAs: 'string' },
      (_req, body, done) => {
        done(null, body)
      },
    )

    webhook.post('/webhook/stripe', async (request, reply) => {
      try {
        const provider = getPaymentProvider('stripe')
        const event = await provider.parseWebhook(
          request.body as string,
          request.headers as Record<string, string>,
        )
        await paymentsService.handleWebhookEvent(event)
        return reply.status(200).send({ received: true })
      } catch (err: any) {
        request.log.error(err, 'Stripe webhook error')
        return reply.status(400).send({ error: err.message })
      }
    })

    webhook.post('/webhook/yookassa', async (request, reply) => {
      try {
        const provider = getPaymentProvider('yookassa')
        const event = await provider.parseWebhook(
          request.body as string,
          request.headers as Record<string, string>,
        )
        await paymentsService.handleWebhookEvent(event)
        return reply.status(200).send({ received: true })
      } catch (err: any) {
        request.log.error(err, 'YooKassa webhook error')
        return reply.status(400).send({ error: err.message })
      }
    })
  })

  // --- Admin ---

  app.get('/admin/stats', { preHandler: [authenticate, requireAdmin] }, async (_request, reply) => {
    const stats = await paymentsService.getAdminStats(30)
    return sendSuccess(reply, stats)
  })

  app.post(
    '/admin/plans',
    { preHandler: [authenticate, requireAdmin] },
    async (request, reply) => {
      const input = createPlanSchema.parse(request.body)
      const plan = await paymentsService.createPlan(input)
      return sendSuccess(reply, plan, 201)
    },
  )
}
