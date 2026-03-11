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
  updatePlanSchema,
} from './payments.schema'
import { env } from '../../config/env'

const DEFAULT_YOOKASSA_IP_ALLOWLIST = [
  '185.71.76.0/27',
  '185.71.77.0/27',
  '77.75.153.0/25',
  '77.75.156.11',
  '77.75.156.35',
  '77.75.154.128/25',
  '2a02:5180::/32',
] as const

function parseAllowlist(value?: string | null): string[] {
  if (!value) return [...DEFAULT_YOOKASSA_IP_ALLOWLIST]
  const list = value
    .split(/[,\s]+/)
    .map((s) => s.trim())
    .filter(Boolean)
  return list.length > 0 ? list : [...DEFAULT_YOOKASSA_IP_ALLOWLIST]
}

function normalizeIp(ip: string | undefined | null): string | null {
  if (!ip) return null
  const trimmed = ip.trim()
  const v4Mapped = trimmed.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/i)
  if (v4Mapped) return v4Mapped[1]
  return trimmed
}

function ipv4ToInt(ip: string): number | null {
  const parts = ip.split('.')
  if (parts.length !== 4) return null
  let acc = 0
  for (const part of parts) {
    if (part === '' || part.length > 3) return null
    const n = Number(part)
    if (!Number.isInteger(n) || n < 0 || n > 255) return null
    acc = (acc << 8) | n
  }
  return acc >>> 0
}

function ipv6ToBigInt(ip: string): bigint | null {
  const zoneIndex = ip.indexOf('%')
  const addr = zoneIndex >= 0 ? ip.slice(0, zoneIndex) : ip

  let ipv4Part: string | null = null
  if (addr.includes('.')) {
    const lastColon = addr.lastIndexOf(':')
    if (lastColon === -1) return null
    ipv4Part = addr.slice(lastColon + 1)
  }

  const ipv6Only = ipv4Part ? addr.slice(0, addr.lastIndexOf(':')) : addr
  const halves = ipv6Only.split('::')
  if (halves.length > 2) return null

  const leftParts = halves[0] ? halves[0].split(':').filter(Boolean) : []
  const rightParts = halves[1] ? halves[1].split(':').filter(Boolean) : []
  const missing = 8 - (leftParts.length + rightParts.length + (ipv4Part ? 2 : 0))
  if (missing < 0) return null
  if (halves.length === 1 && missing !== 0) return null

  const parts = halves.length === 2
    ? [...leftParts, ...Array(missing).fill('0'), ...rightParts]
    : [...leftParts, ...rightParts]

  if (ipv4Part) {
    const v4 = ipv4ToInt(ipv4Part)
    if (v4 === null) return null
    parts.push(((v4 >>> 16) & 0xffff).toString(16))
    parts.push((v4 & 0xffff).toString(16))
  }

  if (parts.length !== 8) return null
  let acc = 0n
  for (const part of parts) {
    const n = parseInt(part, 16)
    if (!Number.isFinite(n) || n < 0 || n > 0xffff) return null
    acc = (acc << 16n) + BigInt(n)
  }
  return acc
}

function cidrContains(ip: string, cidr: string): boolean {
  const [range, bitsRaw] = cidr.split('/')
  const bits = bitsRaw ? Number(bitsRaw) : (range.includes(':') ? 128 : 32)
  if (range.includes(':') || ip.includes(':')) {
    const ipBig = ipv6ToBigInt(ip)
    const rangeBig = ipv6ToBigInt(range)
    if (ipBig === null || rangeBig === null || bits < 0 || bits > 128) return false
    if (bits === 0) return true
    const shift = 128n - BigInt(bits)
    return (ipBig >> shift) === (rangeBig >> shift)
  }

  const ipInt = ipv4ToInt(ip)
  const rangeInt = ipv4ToInt(range)
  if (ipInt === null || rangeInt === null || bits < 0 || bits > 32) return false
  if (bits === 0) return true
  const mask = bits === 32 ? 0xffffffff : ((0xffffffff << (32 - bits)) >>> 0)
  return (ipInt & mask) === (rangeInt & mask)
}

function isIpAllowed(ip: string | null, allowlist: string[]): boolean {
  if (!ip) return false
  const normalized = normalizeIp(ip)
  if (!normalized) return false
  return allowlist.some((cidr) => {
    if (cidr.includes('/')) return cidrContains(normalized, cidr)
    return normalized === cidr
  })
}

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
      if (env.NODE_ENV === 'production') {
        const allowlist = parseAllowlist(env.YOOKASSA_IP_ALLOWLIST)
        if (!isIpAllowed(request.ip, allowlist)) {
          request.log.warn({ ip: request.ip }, 'YooKassa webhook rejected: IP not allowed')
          return reply.status(403).send({ error: 'Forbidden' })
        }
      }

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

    webhook.addContentTypeParser(
      'application/x-www-form-urlencoded',
      { parseAs: 'string' },
      (_req, body, done) => {
        done(null, body)
      },
    )

    webhook.post('/webhook/robokassa', async (request, reply) => {
      try {
        const provider = getPaymentProvider('robokassa')
        const event = await provider.parseWebhook(
          request.body as string,
          request.headers as Record<string, string>,
        )
        await paymentsService.handleWebhookEvent(event)
        // Robokassa requires "OK{InvId}" as the response
        const params = new URLSearchParams(request.body as string)
        const invId = params.get('InvId') ?? ''
        return reply.status(200).type('text/plain').send(`OK${invId}`)
      } catch (err: any) {
        request.log.error(err, 'Robokassa webhook error')
        return reply.status(400).send({ error: err.message })
      }
    })

    webhook.post('/webhook/paypal', async (request, reply) => {
      try {
        const provider = getPaymentProvider('paypal')
        const event = await provider.parseWebhook(
          request.body as string,
          request.headers as Record<string, string>,
        )
        await paymentsService.handleWebhookEvent(event)
        return reply.status(200).send({ received: true })
      } catch (err: any) {
        request.log.error(err, 'PayPal webhook error')
        return reply.status(400).send({ error: err.message })
      }
    })


    webhook.post('/webhook/dodopayment', async (request, reply) => {
      try {
        const provider = getPaymentProvider('dodopayment')
        const event = await provider.parseWebhook(
          request.body as string,
          request.headers as Record<string, string>,
        )
        await paymentsService.handleWebhookEvent(event)
        return reply.status(200).send({ received: true })
      } catch (err: any) {
        request.log.error(err, 'Dodo Payment webhook error')
        return reply.status(400).send({ error: err.message })
      }
    })

    webhook.post('/webhook/paddle', async (request, reply) => {
      try {
        const provider = getPaymentProvider('paddle')
        const event = await provider.parseWebhook(
          request.body as string,
          request.headers as Record<string, string>,
        )
        await paymentsService.handleWebhookEvent(event)
        return reply.status(200).send({ received: true })
      } catch (err: any) {
        request.log.error(err, 'Paddle webhook error')
        return reply.status(400).send({ error: err.message })
      }
    })

    webhook.post('/webhook/polar', async (request, reply) => {
      try {
        const provider = getPaymentProvider('polar')
        const event = await provider.parseWebhook(
          request.body as string,
          request.headers as Record<string, string>,
        )
        await paymentsService.handleWebhookEvent(event)
        return reply.status(200).send({ received: true })
      } catch (err: any) {
        request.log.error(err, 'Polar webhook error')
        return reply.status(400).send({ error: err.message })
      }
    })
  })

  // --- Admin ---

  app.get('/admin/stats', { preHandler: [authenticate, requireAdmin] }, async (_request, reply) => {
    const stats = await paymentsService.getAdminStats(30)
    return sendSuccess(reply, stats)
  })

  app.get('/admin/plans', { preHandler: [authenticate, requireAdmin] }, async (_request, reply) => {
    const plans = await paymentsService.getAllPlans()
    return sendSuccess(reply, plans)
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

  app.patch(
    '/admin/plans/:id',
    { preHandler: [authenticate, requireAdmin] },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      const input = updatePlanSchema.parse(request.body)
      const plan = await paymentsService.updatePlan(id, input)
      return sendSuccess(reply, plan)
    },
  )

  app.delete(
    '/admin/plans/:id',
    { preHandler: [authenticate, requireAdmin] },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      await paymentsService.deletePlan(id)
      return sendSuccess(reply, { message: 'Plan deleted' })
    },
  )

  app.post(
    '/admin/refund/:paymentId',
    { preHandler: [authenticate, requireAdmin] },
    async (request, reply) => {
      const { paymentId } = request.params as { paymentId: string }
      const { amount } = (request.body ?? {}) as { amount?: number }
      const result = await paymentsService.refundPayment(paymentId, amount)
      return sendSuccess(reply, result)
    },
  )
}
