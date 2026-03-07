import { vi, describe, it, expect, beforeEach } from 'vitest'
import { ZodError, ZodIssueCode } from 'zod'
import { errorHandler } from '../error-handler'
import { AppError } from '../../errors/app-error'
import type { FastifyError, FastifyRequest, FastifyReply } from 'fastify'

function createMockRequest(): FastifyRequest {
  return {
    log: {
      error: vi.fn(),
    },
  } as unknown as FastifyRequest
}

function createMockReply() {
  const reply = {
    status: vi.fn(),
    send: vi.fn(),
  } as unknown as FastifyReply

  vi.mocked(reply.status).mockReturnValue(reply)
  return reply
}

describe('errorHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('AppError handling', () => {
    it('should return correct statusCode and message for AppError', () => {
      const error = AppError.badRequest('Invalid input', 'BAD_INPUT')
      const request = createMockRequest()
      const reply = createMockReply()

      errorHandler(error, request, reply)

      expect(reply.status).toHaveBeenCalledWith(400)
      expect(reply.send).toHaveBeenCalledWith({
        error: 'BAD_INPUT',
        message: 'Invalid input',
      })
    })

    it('should return 401 for unauthorized AppError', () => {
      const error = AppError.unauthorized('Token expired')
      const request = createMockRequest()
      const reply = createMockReply()

      errorHandler(error, request, reply)

      expect(reply.status).toHaveBeenCalledWith(401)
      expect(reply.send).toHaveBeenCalledWith({
        error: 'UNAUTHORIZED',
        message: 'Token expired',
      })
    })

    it('should return 403 for forbidden AppError', () => {
      const error = AppError.forbidden('Admin access required')
      const request = createMockRequest()
      const reply = createMockReply()

      errorHandler(error, request, reply)

      expect(reply.status).toHaveBeenCalledWith(403)
      expect(reply.send).toHaveBeenCalledWith({
        error: 'FORBIDDEN',
        message: 'Admin access required',
      })
    })

    it('should use "ERROR" as default code when AppError has no code', () => {
      const error = new AppError(422, 'Unprocessable')
      const request = createMockRequest()
      const reply = createMockReply()

      errorHandler(error, request, reply)

      expect(reply.status).toHaveBeenCalledWith(422)
      expect(reply.send).toHaveBeenCalledWith({
        error: 'ERROR',
        message: 'Unprocessable',
      })
    })
  })

  describe('ZodError handling', () => {
    it('should return 400 with formatted validation message', () => {
      const zodError = new ZodError([
        {
          code: ZodIssueCode.invalid_type,
          expected: 'string',
          received: 'number',
          path: ['email'],
          message: 'Expected string, received number',
        },
      ])
      const request = createMockRequest()
      const reply = createMockReply()

      errorHandler(zodError, request, reply)

      expect(reply.status).toHaveBeenCalledWith(400)
      expect(reply.send).toHaveBeenCalledWith({
        error: 'VALIDATION_ERROR',
        message: 'email: Expected string, received number',
      })
    })

    it('should join multiple ZodError issues with commas', () => {
      const zodError = new ZodError([
        {
          code: ZodIssueCode.invalid_type,
          expected: 'string',
          received: 'undefined',
          path: ['name'],
          message: 'Required',
        },
        {
          code: ZodIssueCode.too_small,
          minimum: 1,
          type: 'string',
          inclusive: true,
          path: ['email'],
          message: 'Must not be empty',
        },
      ])
      const request = createMockRequest()
      const reply = createMockReply()

      errorHandler(zodError, request, reply)

      expect(reply.status).toHaveBeenCalledWith(400)
      expect(reply.send).toHaveBeenCalledWith({
        error: 'VALIDATION_ERROR',
        message: 'name: Required, email: Must not be empty',
      })
    })

    it('should handle ZodError with empty path (root-level error)', () => {
      const zodError = new ZodError([
        {
          code: ZodIssueCode.invalid_type,
          expected: 'object',
          received: 'string',
          path: [],
          message: 'Expected object, received string',
        },
      ])
      const request = createMockRequest()
      const reply = createMockReply()

      errorHandler(zodError, request, reply)

      expect(reply.send).toHaveBeenCalledWith({
        error: 'VALIDATION_ERROR',
        message: 'Expected object, received string',
      })
    })

    it('should handle nested path in ZodError', () => {
      const zodError = new ZodError([
        {
          code: ZodIssueCode.invalid_type,
          expected: 'string',
          received: 'number',
          path: ['address', 'city'],
          message: 'Expected string',
        },
      ])
      const request = createMockRequest()
      const reply = createMockReply()

      errorHandler(zodError, request, reply)

      expect(reply.send).toHaveBeenCalledWith({
        error: 'VALIDATION_ERROR',
        message: 'address.city: Expected string',
      })
    })
  })

  describe('Fastify validation error handling', () => {
    it('should return 400 for Fastify schema validation errors', () => {
      const error = {
        validation: [{ keyword: 'required', params: { missingProperty: 'name' } }],
        message: 'body must have required property name',
      } as unknown as FastifyError
      const request = createMockRequest()
      const reply = createMockReply()

      errorHandler(error, request, reply)

      expect(reply.status).toHaveBeenCalledWith(400)
      expect(reply.send).toHaveBeenCalledWith({
        error: 'VALIDATION_ERROR',
        message: 'Invalid request',
      })
    })
  })

  describe('Unknown error handling', () => {
    it('should return 500 for generic errors in non-production', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'development'

      const error = new Error('Something went wrong')
      const request = createMockRequest()
      const reply = createMockReply()

      errorHandler(error as any, request, reply)

      expect(reply.status).toHaveBeenCalledWith(500)
      expect(reply.send).toHaveBeenCalledWith({
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Something went wrong',
      })

      process.env.NODE_ENV = originalEnv
    })

    it('should hide error details in production', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'production'

      const error = new Error('Database connection failed')
      const request = createMockRequest()
      const reply = createMockReply()

      errorHandler(error as any, request, reply)

      expect(reply.status).toHaveBeenCalledWith(500)
      expect(reply.send).toHaveBeenCalledWith({
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Internal server error',
      })

      process.env.NODE_ENV = originalEnv
    })

    it('should log all errors via request.log.error', () => {
      const error = new Error('test error')
      const request = createMockRequest()
      const reply = createMockReply()

      errorHandler(error as any, request, reply)

      expect(request.log.error).toHaveBeenCalledWith(error)
    })
  })
})
