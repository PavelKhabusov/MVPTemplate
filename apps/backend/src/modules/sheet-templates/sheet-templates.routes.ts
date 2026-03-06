import { FastifyInstance } from 'fastify'
import { authenticate } from '../../common/middleware/authenticate'
import { sheetTemplatesRepository } from './sheet-templates.repository'
import { createTemplateSchema, updateTemplateSchema, linkTemplateSchema } from './sheet-templates.schema'
import { sendSuccess } from '../../common/utils/response'
import { AppError } from '../../common/errors/app-error'

export async function sheetTemplatesRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authenticate)

  // GET /api/sheet-templates — list all user templates
  app.get('/', async (request, reply) => {
    const templates = await sheetTemplatesRepository.list(request.userId)
    return sendSuccess(reply, templates)
  })

  // GET /api/sheet-templates/match?spreadsheetId=X&sheetName=Y
  // Returns the best matching template for a given sheet (used by extension)
  app.get<{ Querystring: { spreadsheetId?: string; sheetName?: string } }>(
    '/match',
    async (request, reply) => {
      const { spreadsheetId, sheetName } = request.query

      if (spreadsheetId && sheetName) {
        const exact = await sheetTemplatesRepository.findBySheet(request.userId, spreadsheetId, sheetName)
        if (exact) return sendSuccess(reply, exact)
      }

      // Fallback to default template
      const def = await sheetTemplatesRepository.findDefault(request.userId)
      return sendSuccess(reply, def ?? null)
    }
  )

  // GET /api/sheet-templates/:id
  app.get<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const template = await sheetTemplatesRepository.findById(request.params.id, request.userId)
    if (!template) throw AppError.notFound('Template not found')
    return sendSuccess(reply, template)
  })

  // POST /api/sheet-templates — create template
  app.post('/', async (request, reply) => {
    const body = createTemplateSchema.parse(request.body)

    if (body.isDefault) {
      await sheetTemplatesRepository.clearDefault(request.userId)
    }

    const template = await sheetTemplatesRepository.create({
      userId: request.userId,
      name: body.name,
      spreadsheetId: body.spreadsheetId ?? null,
      spreadsheetName: body.spreadsheetName ?? null,
      sheetName: body.sheetName ?? null,
      columnMappings: body.columnMappings,
      isDefault: body.isDefault,
    })
    return sendSuccess(reply, template, 201)
  })

  // PATCH /api/sheet-templates/:id — update template
  app.patch<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const body = updateTemplateSchema.parse(request.body)

    if (body.isDefault) {
      await sheetTemplatesRepository.clearDefault(request.userId)
    }

    const template = await sheetTemplatesRepository.update(request.params.id, request.userId, body)
    if (!template) throw AppError.notFound('Template not found')
    return sendSuccess(reply, template)
  })

  // POST /api/sheet-templates/:id/link — link template to a different spreadsheet/sheet
  app.post<{ Params: { id: string } }>('/:id/link', async (request, reply) => {
    const body = linkTemplateSchema.parse(request.body)
    const template = await sheetTemplatesRepository.update(request.params.id, request.userId, {
      spreadsheetId: body.spreadsheetId,
      spreadsheetName: body.spreadsheetName ?? null,
      sheetName: body.sheetName ?? null,
    })
    if (!template) throw AppError.notFound('Template not found')
    return sendSuccess(reply, template)
  })

  // DELETE /api/sheet-templates/:id
  app.delete<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const existing = await sheetTemplatesRepository.findById(request.params.id, request.userId)
    if (!existing) throw AppError.notFound('Template not found')
    await sheetTemplatesRepository.delete(request.params.id, request.userId)
    return sendSuccess(reply, { ok: true })
  })
}
