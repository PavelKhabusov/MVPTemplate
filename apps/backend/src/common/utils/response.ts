import { FastifyReply } from 'fastify'

export function sendSuccess<T>(reply: FastifyReply, data: T, statusCode = 200) {
  return reply.status(statusCode).send({ data })
}

export function sendPaginated<T>(
  reply: FastifyReply,
  data: T[],
  pagination: { page: number; limit: number; total: number }
) {
  return reply.status(200).send({
    data,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total: pagination.total,
      totalPages: Math.ceil(pagination.total / pagination.limit),
    },
  })
}
