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
  eq: vi.fn((a: any, b: any) => ({ type: 'eq', field: a, value: b })),
  and: vi.fn((...args: any[]) => ({ type: 'and', conditions: args })),
  gte: vi.fn((col: any, val: any) => ({ type: 'gte', col, val })),
  lte: vi.fn((col: any, val: any) => ({ type: 'lte', col, val })),
  count: vi.fn(() => 'count(*)'),
  desc: vi.fn((col: any) => ({ type: 'desc', col })),
}))

import { callsRepository } from '../calls.repository'

describe('callsRepository', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockDb = createChainMock()
  })

  describe('create', () => {
    it('should insert a call and return the created record', async () => {
      const newCall = { userId: 'u1', sheetId: 's1', status: 'pending' }
      const created = { id: 'c1', ...newCall }
      mockDb = createChainMock([created])

      const result = await callsRepository.create(newCall as any)

      expect(result).toEqual(created)
      expect(mockDb.insert).toHaveBeenCalled()
      expect(mockDb.values).toHaveBeenCalledWith(newCall)
      expect(mockDb.returning).toHaveBeenCalled()
    })
  })

  describe('findById', () => {
    it('should return call when found', async () => {
      const call = { id: 'c1', userId: 'u1' }
      mockDb = createChainMock([call])

      const result = await callsRepository.findById('c1', 'u1')

      expect(result).toEqual(call)
      expect(mockDb.where).toHaveBeenCalled()
      expect(mockDb.limit).toHaveBeenCalledWith(1)
    })

    it('should return null when call not found', async () => {
      mockDb = createChainMock([])

      const result = await callsRepository.findById('nonexistent', 'u1')

      expect(result).toBeNull()
    })
  })

  describe('findByVoximplantCallId', () => {
    it('should return call by voximplant call id', async () => {
      const call = { id: 'c1', voximplantCallId: 'vox-123' }
      mockDb = createChainMock([call])

      const result = await callsRepository.findByVoximplantCallId('vox-123')

      expect(result).toEqual(call)
      expect(mockDb.limit).toHaveBeenCalledWith(1)
    })

    it('should return null when not found', async () => {
      mockDb = createChainMock([])

      const result = await callsRepository.findByVoximplantCallId('nonexistent')

      expect(result).toBeNull()
    })
  })

  describe('list', () => {
    it('should return paginated call list with total count', async () => {
      const calls = [{ id: 'c1' }, { id: 'c2' }]
      const rowsChain = createChainMock(calls)
      const countChain = createChainMock([{ count: 2 }])

      let selectCallCount = 0
      mockDb.select = vi.fn().mockImplementation(() => {
        selectCallCount++
        return selectCallCount === 1 ? rowsChain : countChain
      })

      const result = await callsRepository.list('u1', { page: 1, limit: 10 })

      expect(result).toEqual({ rows: calls, total: 2 })
    })

    it('should apply optional filters (sheetId, dateFrom, dateTo)', async () => {
      const rowsChain = createChainMock([])
      const countChain = createChainMock([{ count: 0 }])

      let selectCallCount = 0
      mockDb.select = vi.fn().mockImplementation(() => {
        selectCallCount++
        return selectCallCount === 1 ? rowsChain : countChain
      })

      const result = await callsRepository.list('u1', {
        page: 1,
        limit: 10,
        sheetId: 's1',
        dateFrom: '2026-01-01',
        dateTo: '2026-12-31',
      })

      expect(result).toEqual({ rows: [], total: 0 })
    })
  })

  describe('update', () => {
    it('should update call and return updated record', async () => {
      const updated = { id: 'c1', status: 'completed', duration: 120 }
      mockDb = createChainMock([updated])

      const result = await callsRepository.update('c1', { status: 'completed' as any, duration: 120 })

      expect(result).toEqual(updated)
      expect(mockDb.update).toHaveBeenCalled()
      expect(mockDb.set).toHaveBeenCalled()
      expect(mockDb.returning).toHaveBeenCalled()
    })
  })

  describe('countThisMonth', () => {
    it('should return count of calls this month', async () => {
      mockDb = createChainMock([{ count: 15 }])

      const result = await callsRepository.countThisMonth('u1')

      expect(result).toBe(15)
    })

    it('should return 0 when no calls', async () => {
      mockDb = createChainMock([{ count: 0 }])

      const result = await callsRepository.countThisMonth('u1')

      expect(result).toBe(0)
    })
  })

  describe('hasActiveSubscription', () => {
    it('should return true when user has active paid subscription', async () => {
      mockDb = createChainMock([{ priceAmount: 999 }])

      const result = await callsRepository.hasActiveSubscription('u1')

      expect(result).toBe(true)
      expect(mockDb.innerJoin).toHaveBeenCalled()
      expect(mockDb.limit).toHaveBeenCalledWith(1)
    })

    it('should return false when no active subscription', async () => {
      mockDb = createChainMock([])

      const result = await callsRepository.hasActiveSubscription('u1')

      expect(result).toBe(false)
    })

    it('should return false for free plan (priceAmount = 0)', async () => {
      mockDb = createChainMock([{ priceAmount: 0 }])

      const result = await callsRepository.hasActiveSubscription('u1')

      expect(result).toBe(false)
    })
  })

  describe('FREE_MONTHLY_LIMIT', () => {
    it('should be 30', () => {
      expect(callsRepository.FREE_MONTHLY_LIMIT).toBe(30)
    })
  })
})
