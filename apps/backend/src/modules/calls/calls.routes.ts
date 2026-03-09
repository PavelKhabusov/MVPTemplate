import { FastifyInstance } from 'fastify'
import { authenticate } from '../../common/middleware/authenticate'
import { callsRepository } from './calls.repository'
import { initiateCallSchema, callsQuerySchema } from './calls.schema'
import { sendSuccess, sendPaginated } from '../../common/utils/response'
import { AppError } from '../../common/errors/app-error'

export async function callsRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authenticate)

  // POST /api/calls/initiate
  app.post('/initiate', async (request, reply) => {
    const body = initiateCallSchema.parse(request.body)

    // Check FREE plan limit
    const isPaid = await callsRepository.hasActiveSubscription(request.userId)
    if (!isPaid) {
      const used = await callsRepository.countThisMonth(request.userId)
      if (used >= callsRepository.FREE_MONTHLY_LIMIT) {
        throw AppError.paymentRequired(
          `Free plan limit reached (${callsRepository.FREE_MONTHLY_LIMIT} calls/month). Upgrade to PRO.`
        )
      }
    }

    const call = await callsRepository.create({
      userId: request.userId,
      contactPhone: body.to,
      contactName: body.contactName ?? null,
      sheetId: body.sheetId,
      rowIndex: body.rowIndex,
      mode: body.mode,
      managerPhone: body.managerPhone ?? null,
      status: 'answered',
      startedAt: new Date(),
    })

    return sendSuccess(reply, call, 201)
  })

  // GET /api/calls
  app.get('/', async (request, reply) => {
    const query = callsQuerySchema.parse(request.query)
    const { rows, total } = await callsRepository.list(request.userId, query)
    return sendPaginated(reply, rows, { page: query.page, limit: query.limit, total })
  })

  // GET /api/calls/:id/recording
  app.get<{ Params: { id: string } }>('/:id/recording', async (request, reply) => {
    const call = await callsRepository.findById(request.params.id, request.userId)
    if (!call) throw AppError.notFound('Call not found')
    if (!call.recordingUrl) throw AppError.notFound('No recording available')
    return sendSuccess(reply, { url: call.recordingUrl })
  })
}