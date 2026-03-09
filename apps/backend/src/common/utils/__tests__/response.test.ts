import { describe, it, expect, vi } from 'vitest'
import { sendSuccess, sendPaginated } from '../response'

/** Create a mock FastifyReply with chainable .status().send() */
function createMockReply() {
  const send = vi.fn()
  const status = vi.fn(() => ({ send }))
  return { status, send }
}

describe('sendSuccess', () => {
  it('should send { data } with default status 200', () => {
    const reply = createMockReply()
    sendSuccess(reply as any, { id: 1, name: 'test' })

    expect(reply.status).toHaveBeenCalledWith(200)
    expect(reply.send).toHaveBeenCalledWith({
      data: { id: 1, name: 'test' },
    })
  })

  it('should send with custom status code', () => {
    const reply = createMockReply()
    sendSuccess(reply as any, { created: true }, 201)

    expect(reply.status).toHaveBeenCalledWith(201)
    expect(reply.send).toHaveBeenCalledWith({
      data: { created: true },
    })
  })

  it('should handle null data', () => {
    const reply = createMockReply()
    sendSuccess(reply as any, null)

    expect(reply.status).toHaveBeenCalledWith(200)
    expect(reply.send).toHaveBeenCalledWith({ data: null })
  })

  it('should handle array data', () => {
    const reply = createMockReply()
    sendSuccess(reply as any, [1, 2, 3])

    expect(reply.send).toHaveBeenCalledWith({ data: [1, 2, 3] })
  })
})

describe('sendPaginated', () => {
  it('should send data with pagination metadata', () => {
    const reply = createMockReply()
    const items = [{ id: 1 }, { id: 2 }]
    sendPaginated(reply as any, items, { page: 1, limit: 10, total: 25 })

    expect(reply.status).toHaveBeenCalledWith(200)
    expect(reply.send).toHaveBeenCalledWith({
      data: items,
      pagination: {
        page: 1,
        limit: 10,
        total: 25,
        totalPages: 3,
      },
    })
  })

  it('should calculate totalPages correctly (exact division)', () => {
    const reply = createMockReply()
    sendPaginated(reply as any, [], { page: 1, limit: 5, total: 20 })

    expect(reply.send).toHaveBeenCalledWith(
      expect.objectContaining({
        pagination: expect.objectContaining({ totalPages: 4 }),
      }),
    )
  })

  it('should calculate totalPages = 1 when total < limit', () => {
    const reply = createMockReply()
    sendPaginated(reply as any, [{ id: 1 }], { page: 1, limit: 10, total: 3 })

    expect(reply.send).toHaveBeenCalledWith(
      expect.objectContaining({
        pagination: expect.objectContaining({ totalPages: 1 }),
      }),
    )
  })

  it('should handle empty data with total 0', () => {
    const reply = createMockReply()
    sendPaginated(reply as any, [], { page: 1, limit: 10, total: 0 })

    expect(reply.send).toHaveBeenCalledWith({
      data: [],
      pagination: {
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
      },
    })
  })
})
