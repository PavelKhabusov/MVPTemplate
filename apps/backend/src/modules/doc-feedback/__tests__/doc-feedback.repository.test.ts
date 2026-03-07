import { vi, describe, it, expect, beforeEach } from 'vitest'

function createChainMock(resolvedValue: any = []) {
  const chain: any = {}
  const methods = [
    'select', 'from', 'where', 'limit', 'offset', 'orderBy',
    'insert', 'values', 'returning', 'update', 'set', 'delete',
    'leftJoin', 'innerJoin', 'groupBy',
  ]
  for (const m of methods) {
    chain[m] = vi.fn().mockReturnValue(chain)
  }
  chain.returning.mockResolvedValue(resolvedValue)
  chain.execute = vi.fn().mockResolvedValue(resolvedValue)
  chain.then = vi.fn((resolve: any) => resolve(resolvedValue))
  return chain
}

let mockDb: ReturnType<typeof createChainMock>

vi.mock('../../../config/database', () => ({
  get db() {
    return mockDb
  },
}))

vi.mock('drizzle-orm', () => ({
  sql: Object.assign(vi.fn(), { raw: vi.fn((s: any) => s) }),
  eq: vi.fn((a: any, b: any) => ({ type: 'eq', field: a, value: b })),
  and: vi.fn((...args: any[]) => ({ type: 'and', conditions: args })),
  count: vi.fn(() => 'count(*)'),
}))

import { docFeedbackRepository } from '../doc-feedback.repository'

describe('docFeedbackRepository', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockDb = createChainMock()
  })

  describe('upsert', () => {
    it('should insert new feedback when none exists', async () => {
      // First: select returns empty (no existing feedback)
      const selectChain = createChainMock([])
      // Second: insert returns new row
      const insertChain = createChainMock([{ id: 'fb1' }])

      mockDb.select = vi.fn().mockReturnValue(selectChain)
      mockDb.insert = vi.fn().mockReturnValue(insertChain)

      const result = await docFeedbackRepository.upsert('u1', 'page1', true)

      expect(result).toBe('fb1')
      expect(mockDb.insert).toHaveBeenCalled()
    })

    it('should update existing feedback', async () => {
      const existing = { id: 'fb1', userId: 'u1', pageId: 'page1', helpful: false }
      const selectChain = createChainMock([existing])
      const updateChain = createChainMock()

      mockDb.select = vi.fn().mockReturnValue(selectChain)
      mockDb.update = vi.fn().mockReturnValue(updateChain)

      const result = await docFeedbackRepository.upsert('u1', 'page1', true)

      expect(result).toBe('fb1')
      expect(mockDb.update).toHaveBeenCalled()
    })
  })

  describe('getUserVote', () => {
    it('should return helpful value when vote exists', async () => {
      mockDb = createChainMock([{ helpful: true }])

      const result = await docFeedbackRepository.getUserVote('u1', 'page1')

      expect(result).toBe(true)
    })

    it('should return null when no vote', async () => {
      mockDb = createChainMock([])

      const result = await docFeedbackRepository.getUserVote('u1', 'page1')

      expect(result).toBeNull()
    })
  })

  describe('getPageStats', () => {
    it('should return likes and dislikes counts', async () => {
      const likesChain = createChainMock([{ count: 10 }])
      const dislikesChain = createChainMock([{ count: 3 }])

      let selectCallCount = 0
      mockDb.select = vi.fn().mockImplementation(() => {
        selectCallCount++
        return selectCallCount === 1 ? likesChain : dislikesChain
      })

      const result = await docFeedbackRepository.getPageStats('page1')

      expect(result).toEqual({ likes: 10, dislikes: 3 })
    })
  })

  describe('getAllStats', () => {
    it('should aggregate feedback by page and return sorted stats', async () => {
      const rows = [
        { pageId: 'page1', helpful: true, count: 5 },
        { pageId: 'page1', helpful: false, count: 2 },
        { pageId: 'page2', helpful: true, count: 1 },
      ]
      mockDb = createChainMock(rows)

      const result = await docFeedbackRepository.getAllStats()

      expect(result).toEqual([
        { pageId: 'page1', likes: 5, dislikes: 2, total: 7 },
        { pageId: 'page2', likes: 1, dislikes: 0, total: 1 },
      ])
    })

    it('should return empty array when no feedback', async () => {
      mockDb = createChainMock([])

      const result = await docFeedbackRepository.getAllStats()

      expect(result).toEqual([])
    })
  })
})
