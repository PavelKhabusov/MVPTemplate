import { FastifyError, FastifyReply, FastifyRequest } from 'fastify'
import { AppError } from '../errors/app-error.js'

export function errorHandler(
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply
) {
  request.log.error(error)

  if (error instanceof AppError) {
    return reply.status(error.statusCode).send({
      error: error.code ?? 'ERROR',
      message: error.message,
    })
  }

  // Fastify validation errors
  if (error.validation) {
    return reply.status(400).send({
      error: 'VALIDATION_ERROR',
      message: 'Invalid request',
      details: error.validation,
    })
  }

  // Default 500
  return reply.status(500).send({
    error: 'INTERNAL_SERVER_ERROR',
    message:
      process.env.NODE_ENV === 'production'
        ? 'Internal server error'
        : error.message,
  })
}
