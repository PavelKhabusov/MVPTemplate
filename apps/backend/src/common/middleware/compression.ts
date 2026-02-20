import compress from '@fastify/compress'
import { FastifyInstance } from 'fastify'

export async function registerCompression(app: FastifyInstance) {
  await app.register(compress, {
    global: true,
    threshold: 1024, // Only compress responses > 1KB
  })
}
