import { FastifyInstance } from 'fastify'
import { authenticate } from '../../common/middleware/authenticate'
import { requireAdmin } from '../../common/middleware/require-admin'
import { docFeedbackRepository } from './doc-feedback.repository'
import { submitFeedbackSchema } from './doc-feedback.schema'
import { sendSuccess } from '../../common/utils/response'

export async function docFeedbackRoutes(app: FastifyInstance) {
  // POST /api/doc-feedback — submit feedback (authenticated)
  app.post('/', { preHandler: [authenticate] }, async (request, reply) => {
    const { pageId, helpful } = submitFeedbackSchema.parse(request.body)
    await docFeedbackRepository.upsert(request.userId!, pageId, helpful)
    return sendSuccess(reply, { ok: true })
  })

  // GET /api/doc-feedback/:pageId — get user's vote + page stats
  app.get('/:pageId', { preHandler: [authenticate] }, async (request, reply) => {
    const { pageId } = request.params as { pageId: string }
    const [userVote, stats] = await Promise.all([
      docFeedbackRepository.getUserVote(request.userId!, pageId),
      docFeedbackRepository.getPageStats(pageId),
    ])
    return sendSuccess(reply, { userVote, ...stats })
  })

  // GET /api/doc-feedback/admin/stats — all pages stats (admin only)
  app.get('/admin/stats', { preHandler: [authenticate, requireAdmin] }, async (request, reply) => {
    const stats = await docFeedbackRepository.getAllStats()
    return sendSuccess(reply, stats)
  })
}
