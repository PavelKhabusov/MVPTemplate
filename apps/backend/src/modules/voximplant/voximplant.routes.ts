import { FastifyInstance } from 'fastify'
import { authenticate } from '../../common/middleware/authenticate'
import { voximplantRepository } from './voximplant.repository'
import { callsRepository } from '../calls/calls.repository'
import { connectSchema, webhookSchema } from './voximplant.schema'
import { sendSuccess } from '../../common/utils/response'
import { AppError } from '../../common/errors/app-error'
import { env } from '../../config/env'
import type { CallStatus } from '../../database/schema/calls'

const STATUS_MAP: Record<string, CallStatus> = {
  '480': 'missed',
  '486': 'busy',
  '487': 'missed',
  '603': 'missed',
}

export async function voximplantRoutes(app: FastifyInstance) {
  // --- Authenticated routes ---

  // POST /api/voximplant/connect
  app.post('/connect', { preHandler: authenticate }, async (request, reply) => {
    if (!env.ENCRYPTION_KEY) {
      throw AppError.serviceUnavailable('ENCRYPTION_KEY is not configured. Set it in Admin → API → Voximplant.')
    }
    const body = connectSchema.parse(request.body)
    await voximplantRepository.saveCredentials(
      request.userId,
      body.login,
      body.password,
      body.appId ?? null
    )
    return sendSuccess(reply, { ok: true })
  })

  // GET /api/voximplant/config
  app.get('/config', { preHandler: authenticate }, async (request, reply) => {
    const config = await voximplantRepository.getConfig(request.userId)
    if (!config?.voximplantLogin) {
      return sendSuccess(reply, null)
    }
    return sendSuccess(reply, {
      login: config.voximplantLogin,
      appId: config.voximplantAppId,
    })
  })

  // GET /api/voximplant/balance
  app.get('/balance', { preHandler: authenticate }, async (_request, reply) => {
    if (!env.VOXIMPLANT_ACCOUNT_ID || !env.VOXIMPLANT_API_KEY) {
      throw AppError.serviceUnavailable('Voximplant API not configured')
    }

    const url = new URL('https://api.voximplant.com/platform_api/GetAccountInfo')
    url.searchParams.set('account_id', env.VOXIMPLANT_ACCOUNT_ID)
    url.searchParams.set('api_key', env.VOXIMPLANT_API_KEY)

    const res = await fetch(url.toString())
    if (!res.ok) throw AppError.badGateway('Voximplant API error')

    const data = (await res.json()) as {
      result?: { live_balance?: number; currency?: string }
      error?: { msg?: string }
    }
    if (data.error) throw AppError.badGateway(data.error.msg || 'Voximplant API error')

    return sendSuccess(reply, {
      balance: data.result?.live_balance ?? 0,
      currency: data.result?.currency || 'RUB',
    })
  })

  // --- Public webhook (no auth) ---

  // POST /api/voximplant/webhook
  app.post('/webhook', async (request, reply) => {
    const body = webhookSchema.parse(request.body)
    const call = await callsRepository.findByVoximplantCallId(body.voximplantCallId)
    if (!call) throw AppError.notFound('Call not found')

    const callStatus = body.status ? (STATUS_MAP[body.status] || 'failed') : undefined

    await callsRepository.update(call.id, {
      ...(body.duration !== undefined ? { duration: body.duration } : {}),
      ...(body.recordingUrl ? { recordingUrl: body.recordingUrl } : {}),
      ...(callStatus ? { status: callStatus } : {}),
      endedAt: new Date(),
    })

    return sendSuccess(reply, { ok: true })
  })
}