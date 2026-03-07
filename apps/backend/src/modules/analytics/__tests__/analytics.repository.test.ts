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

function createSqlResult(...args: any[]) {
  const result: any = { __sql: args }
  result.as = vi.fn(() => result)
  return result
}

vi.mock('drizzle-orm', () => ({
  sql: Object.assign(
    vi.fn((...args: any[]) => createSqlResult(...args)),
    { raw: vi.fn((s: any) => s) }
  ),
  count: vi.fn(() => 'count(*)'),
  countDistinct: vi.fn((col: any) => ({ type: 'countDistinct', col })),
  desc: vi.fn((col: any) => ({ type: 'desc', col })),
}))

import { analyticsRepository } from '../analytics.repository'

describe('analyticsRepository', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockDb = createChainMock()
  })

  describe('insertEvents', () => {
    it('should insert events into database', async () => {
      const events = [
        { deviceId: 'd1', event: 'click', eventType: 'action', clientTimestamp: new Date() },
      ]
      mockDb = createChainMock()

      await analyticsRepository.insertEvents(events)

      expect(mockDb.insert).toHaveBeenCalled()
      expect(mockDb.values).toHaveBeenCalledWith(events)
    })

    it('should do nothing when events array is empty', async () => {
      await analyticsRepository.insertEvents([])

      expect(mockDb.insert).not.toHaveBeenCalled()
    })
  })

  describe('getActiveUsers', () => {
    it('should return DAU, WAU, MAU counts', async () => {
      const dauChain = createChainMock([{ count: 10 }])
      const wauChain = createChainMock([{ count: 50 }])
      const mauChain = createChainMock([{ count: 200 }])

      let selectCallCount = 0
      mockDb.select = vi.fn().mockImplementation(() => {
        selectCallCount++
        if (selectCallCount === 1) return dauChain
        if (selectCallCount === 2) return wauChain
        return mauChain
      })

      const result = await analyticsRepository.getActiveUsers()

      expect(result).toEqual({ dau: 10, wau: 50, mau: 200 })
    })
  })

  describe('getRegistrations', () => {
    it('should return daily registration counts', async () => {
      const data = [{ day: '2026-03-01', count: 5 }]
      mockDb = createChainMock(data)

      const result = await analyticsRepository.getRegistrations(7)

      expect(result).toEqual(data)
      expect(mockDb.select).toHaveBeenCalled()
      expect(mockDb.groupBy).toHaveBeenCalled()
      expect(mockDb.orderBy).toHaveBeenCalled()
    })
  })

  describe('getPopularScreens', () => {
    it('should return popular screens with view counts', async () => {
      const data = [{ screenName: '/home', views: 100 }]
      mockDb = createChainMock(data)

      const result = await analyticsRepository.getPopularScreens(7, 10)

      expect(result).toEqual(data)
      expect(mockDb.limit).toHaveBeenCalledWith(10)
      expect(mockDb.groupBy).toHaveBeenCalled()
    })
  })

  describe('getDailyActivity', () => {
    it('should return daily activity stats', async () => {
      const data = [{ day: '2026-03-01', events: 50, uniqueUsers: 10 }]
      mockDb = createChainMock(data)

      const result = await analyticsRepository.getDailyActivity(7)

      expect(result).toEqual(data)
      expect(mockDb.groupBy).toHaveBeenCalled()
      expect(mockDb.orderBy).toHaveBeenCalled()
    })
  })

  describe('getRetention', () => {
    it('should execute raw SQL retention query', async () => {
      const retentionData = [{ cohort_week: '2026-02-01', cohort_size: 10 }]
      mockDb = createChainMock(retentionData)

      const result = await analyticsRepository.getRetention(4)

      expect(mockDb.execute).toHaveBeenCalled()
      expect(result).toEqual(retentionData)
    })
  })

  describe('getAverageSessionTime', () => {
    it('should return rounded average session time in seconds', async () => {
      mockDb = createChainMock([{ avgSeconds: 125.7 }])

      const result = await analyticsRepository.getAverageSessionTime(7)

      expect(result).toBe(126)
    })
  })
})
