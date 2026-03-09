import { vi, describe, it, expect, beforeEach } from 'vitest'

vi.mock('../../../modules/users/users.repository', () => ({
  usersRepository: {
    findById: vi.fn(),
  },
}))

import { requireAdmin } from '../require-admin'
import { usersRepository } from '../../../modules/users/users.repository'
import { AppError } from '../../errors/app-error'
import type { FastifyRequest, FastifyReply } from 'fastify'

const mockUsersRepo = vi.mocked(usersRepository)

function createMockRequest(userId: string): FastifyRequest {
  return {
    userId,
  } as unknown as FastifyRequest
}

function createMockReply(): FastifyReply {
  return {
    code: vi.fn().mockReturnThis(),
    send: vi.fn(),
  } as unknown as FastifyReply
}

describe('requireAdmin middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should pass when user has admin role', async () => {
    mockUsersRepo.findById.mockResolvedValue({
      id: 'user-1',
      role: 'admin',
      email: 'admin@test.com',
    } as any)

    const request = createMockRequest('user-1')
    const reply = createMockReply()

    await expect(requireAdmin(request, reply)).resolves.toBeUndefined()
    expect(mockUsersRepo.findById).toHaveBeenCalledWith('user-1')
  })

  it('should throw 403 when user has non-admin role', async () => {
    mockUsersRepo.findById.mockResolvedValue({
      id: 'user-2',
      role: 'user',
      email: 'user@test.com',
    } as any)

    const request = createMockRequest('user-2')
    const reply = createMockReply()

    await expect(requireAdmin(request, reply)).rejects.toThrow(AppError)
    await expect(requireAdmin(request, reply)).rejects.toMatchObject({
      statusCode: 403,
      message: 'Admin access required',
    })
  })

  it('should throw 403 when user is not found', async () => {
    mockUsersRepo.findById.mockResolvedValue(null as any)

    const request = createMockRequest('nonexistent-user')
    const reply = createMockReply()

    await expect(requireAdmin(request, reply)).rejects.toThrow(AppError)
    await expect(requireAdmin(request, reply)).rejects.toMatchObject({
      statusCode: 403,
    })
  })

  it('should throw 403 when user has no role field', async () => {
    mockUsersRepo.findById.mockResolvedValue({
      id: 'user-3',
      email: 'norole@test.com',
    } as any)

    const request = createMockRequest('user-3')
    const reply = createMockReply()

    await expect(requireAdmin(request, reply)).rejects.toThrow(AppError)
    await expect(requireAdmin(request, reply)).rejects.toMatchObject({
      statusCode: 403,
    })
  })
})
