import { FastifyError, FastifyReply, FastifyRequest } from 'fastify'
import { ZodError } from 'zod'
import { AppError } from '../errors/app-error'

function formatZodError(error: ZodError): string {
  return error.errors
    .map((e) => {
      const field = e.path.join('.')
      return field ? `${field}: ${e.message}` : e.message
    })
    .join(', ')
}

export function errorHandler(
  error: FastifyError | ZodError | Error,
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

  // Zod validation errors (from schema.parse() in routes)
  if (error instanceof ZodError) {
    return reply.status(400).send({
      error: 'VALIDATION_ERROR',
      message: formatZodError(error),
    })
  }

  // Fastify validation errors
  if ('validation' in error && (error as FastifyError).validation) {
    return reply.status(400).send({
      error: 'VALIDATION_ERROR',
      message: 'Invalid request',
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
