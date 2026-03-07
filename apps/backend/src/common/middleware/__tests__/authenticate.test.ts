import { vi, describe, it, expect, beforeEach } from 'vitest'

vi.mock('../../../modules/auth/auth.service', () => ({
  authService: {
    verifyAccessToken: vi.fn(),
  },
}))

import { authenticate } from '../authenticate'
import { authService } from '../../../modules/auth/auth.service'
import { AppError } from '../../errors/app-error'
import type { FastifyRequest, FastifyReply } from 'fastify'

const mockAuthService = vi.mocked(authService)

function createMockRequest(headers: Record<string, string> = {}): FastifyRequest {
  return {
    headers,
  } as unknown as FastifyRequest
}

function createMockReply(): FastifyReply {
  return {
    code: vi.fn().mockReturnThis(),
    send: vi.fn(),
  } as unknown as FastifyReply
}

describe('authenticate middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should set userId and userEmail on request when valid JWT is provided', async () => {
    const payload = { sub: 'user-123', email: 'test@example.com' }
    mockAuthService.verifyAccessToken.mockReturnValue(payload)

    const request = createMockRequest({ authorization: 'Bearer valid-token' })
    const reply = createMockReply()

    await authenticate(request, reply)

    expect(request.userId).toBe('user-123')
    expect(request.userEmail).toBe('test@example.com')
    expect(mockAuthService.verifyAccessToken).toHaveBeenCalledWith('valid-token')
  })

  it('should throw 401 when Authorization header is missing', async () => {
    const request = createMockRequest({})
    const reply = createMockReply()

    await expect(authenticate(request, reply)).rejects.toThrow(AppError)
    await expect(authenticate(request, reply)).rejects.toMatchObject({
      statusCode: 401,
      message: 'Missing authorization header',
    })
  })

  it('should throw 401 when Authorization header does not start with "Bearer "', async () => {
    const request = createMockRequest({ authorization: 'Basic abc123' })
    const reply = createMockReply()

    await expect(authenticate(request, reply)).rejects.toThrow(AppError)
    await expect(authenticate(request, reply)).rejects.toMatchObject({
      statusCode: 401,
    })
  })

  it('should throw 401 when Authorization header is "Bearer" without space and token', async () => {
    const request = createMockRequest({ authorization: 'Bearer' })
    const reply = createMockReply()

    await expect(authenticate(request, reply)).rejects.toThrow(AppError)
    await expect(authenticate(request, reply)).rejects.toMatchObject({
      statusCode: 401,
    })
  })

  it('should throw 401 when token is invalid or expired', async () => {
    mockAuthService.verifyAccessToken.mockImplementation(() => {
      throw AppError.unauthorized('Invalid or expired token')
    })

    const request = createMockRequest({ authorization: 'Bearer expired-token' })
    const reply = createMockReply()

    await expect(authenticate(request, reply)).rejects.toThrow(AppError)
    await expect(authenticate(request, reply)).rejects.toMatchObject({
      statusCode: 401,
      message: 'Invalid or expired token',
    })
  })

  it('should extract the token correctly by stripping "Bearer " prefix', async () => {
    const payload = { sub: 'u1', email: 'a@b.com' }
    mockAuthService.verifyAccessToken.mockReturnValue(payload)

    const request = createMockRequest({ authorization: 'Bearer my.jwt.token' })
    const reply = createMockReply()

    await authenticate(request, reply)

    expect(mockAuthService.verifyAccessToken).toHaveBeenCalledWith('my.jwt.token')
  })
})
