import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { authenticate } from '../common/middleware/authenticate.js'

const connections = new Map<string, FastifyReply[]>()

export function sendSSE(userId: string, event: string, data: unknown) {
  const userConnections = connections.get(userId)
  if (!userConnections) return

  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`

  for (const reply of userConnections) {
    try {
      reply.raw.write(payload)
    } catch {
      // Connection closed, will be cleaned up by close handler
    }
  }
}

export async function sseRoutes(app: FastifyInstance) {
  app.get('/events', { preHandler: [authenticate] }, async (request, reply) => {
    reply.raw.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    })

    // Send initial connected event
    reply.raw.write(`event: connected\ndata: {"userId":"${request.userId}"}\n\n`)

    // Register connection
    const userId = request.userId
    if (!connections.has(userId)) {
      connections.set(userId, [])
    }
    connections.get(userId)!.push(reply)

    // Heartbeat every 30s
    const heartbeat = setInterval(() => {
      try {
        reply.raw.write(`:heartbeat\n\n`)
      } catch {
        clearInterval(heartbeat)
      }
    }, 30000)

    // Cleanup on close
    request.raw.on('close', () => {
      clearInterval(heartbeat)
      const userConns = connections.get(userId)
      if (userConns) {
        const idx = userConns.indexOf(reply)
        if (idx !== -1) userConns.splice(idx, 1)
        if (userConns.length === 0) connections.delete(userId)
      }
    })
  })
}
