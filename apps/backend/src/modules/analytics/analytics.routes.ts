import { FastifyInstance } from 'fastify'
import { authenticate } from '../../common/middleware/authenticate'
import { requireAdmin } from '../../common/middleware/require-admin'
import { analyticsRepository } from './analytics.repository'
import { docFeedbackRepository } from '../doc-feedback/doc-feedback.repository'
import { ingestEventsSchema, analyticsQuerySchema } from './analytics.schema'
import { sendSuccess } from '../../common/utils/response'

export async function analyticsRoutes(app: FastifyInstance) {
  // POST /api/analytics/events — ingest events (any authenticated user)
  app.post('/events', { preHandler: [authenticate] }, async (request, reply) => {
    const body = ingestEventsSchema.parse(request.body)

    const events = body.events.map((e) => ({
      userId: request.userId,
      deviceId: body.deviceId,
      event: e.event,
      eventType: e.eventType ?? 'track',
      properties: e.properties,
      screenName: e.screenName,
      sessionDuration: e.sessionDuration,
      clientTimestamp: new Date(e.clientTimestamp),
    }))

    await analyticsRepository.insertEvents(events)
    return sendSuccess(reply, { accepted: events.length })
  })

  // GET /api/analytics/dashboard — aggregated metrics (admin only)
  app.get('/dashboard', { preHandler: [authenticate, requireAdmin] }, async (request, reply) => {
    const { days } = analyticsQuerySchema.parse(request.query)

    const [activeUsers, registrations, popularScreens, dailyActivity, avgSessionTime, docFeedback] =
      await Promise.all([
        analyticsRepository.getActiveUsers(),
        analyticsRepository.getRegistrations(days),
        analyticsRepository.getPopularScreens(days),
        analyticsRepository.getDailyActivity(days),
        analyticsRepository.getAverageSessionTime(days),
        docFeedbackRepository.getAllStats(),
      ])

    return sendSuccess(reply, {
      activeUsers,
      registrations,
      popularScreens,
      dailyActivity,
      avgSessionTime,
      docFeedback,
    })
  })

  // GET /api/analytics/retention — cohort retention (admin only)
  app.get('/retention', { preHandler: [authenticate, requireAdmin] }, async (request, reply) => {
    const retention = await analyticsRepository.getRetention()
    return sendSuccess(reply, retention)
  })
}
