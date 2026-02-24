import { FastifyInstance } from 'fastify'
import { authenticate } from '../../common/middleware/authenticate'
import { requireAdmin } from '../../common/middleware/require-admin'
import { proxyRepository } from './proxy.repository'
import { createProxySchema, updateProxySchema, toggleProxySchema } from './proxy.schema'
import { testProxy, testProxyConnectivity, diagnoseNetwork } from './proxy.validator'
import { sendSuccess } from '../../common/utils/response'
import { AppError } from '../../common/errors/app-error'

export async function proxyRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authenticate)
  app.addHook('preHandler', requireAdmin)

  // GET /api/admin/proxies — list all
  app.get('/', async (_request, reply) => {
    const proxies = await proxyRepository.findAll()
    return sendSuccess(reply, proxies)
  })

  // GET /api/admin/proxies/:id — get one
  app.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    const proxy = await proxyRepository.findById(id)
    if (!proxy) throw AppError.notFound('Proxy not found')
    return sendSuccess(reply, proxy)
  })

  // POST /api/admin/proxies — create
  app.post('/', async (request, reply) => {
    const body = createProxySchema.parse(request.body)
    const proxy = await proxyRepository.create(body)

    // Test in background
    testProxy(proxy.id).catch((err) => {
      console.error(`Failed to test proxy ${proxy.id}:`, err)
    })

    return sendSuccess(reply, proxy)
  })

  // PUT /api/admin/proxies/:id — update
  app.put('/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    const body = updateProxySchema.parse(request.body)

    const connectionChanged =
      body.host !== undefined ||
      body.httpPort !== undefined ||
      body.socks5Port !== undefined ||
      body.username !== undefined ||
      body.password !== undefined

    if (connectionChanged) {
      (body as any).lastCheckStatus = 'pending'
    }

    const proxy = await proxyRepository.update(id, body)
    if (!proxy) throw AppError.notFound('Proxy not found')

    // Test in background if connection changed
    if (connectionChanged) {
      testProxy(id).catch((err) => {
        console.error(`Failed to test proxy ${id}:`, err)
      })
    }

    return sendSuccess(reply, proxy)
  })

  // DELETE /api/admin/proxies/:id — delete
  app.delete('/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    const deleted = await proxyRepository.delete(id)
    if (!deleted) throw AppError.notFound('Proxy not found')
    return sendSuccess(reply, { message: 'Proxy deleted' })
  })

  // PATCH /api/admin/proxies/:id/toggle — toggle active
  app.patch('/:id/toggle', async (request, reply) => {
    const { id } = request.params as { id: string }
    const { isActive } = toggleProxySchema.parse(request.body)
    const proxy = await proxyRepository.toggleActive(id, isActive)
    if (!proxy) throw AppError.notFound('Proxy not found')
    return sendSuccess(reply, proxy)
  })

  // POST /api/admin/proxies/:id/test — full HTTPS test
  app.post('/:id/test', async (request, reply) => {
    const { id } = request.params as { id: string }
    const result = await testProxy(id)
    return sendSuccess(reply, result)
  })

  // POST /api/admin/proxies/:id/test-tcp — TCP connectivity test
  app.post('/:id/test-tcp', async (request, reply) => {
    const { id } = request.params as { id: string }
    const result = await testProxyConnectivity(id)
    return sendSuccess(reply, result)
  })

  // GET /api/admin/proxies/:id/diagnose — network diagnostics
  app.get('/:id/diagnose', async (request, reply) => {
    const { id } = request.params as { id: string }
    const result = await diagnoseNetwork(id)
    return sendSuccess(reply, result)
  })
}
