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
  sql: Object.assign(vi.fn(), { raw: vi.fn((s: any) => s) }),
  ilike: vi.fn((col: any, pat: any) => ({ type: 'ilike', col, pat })),
  or: vi.fn((...args: any[]) => ({ type: 'or', conditions: args })),
  count: vi.fn(() => 'count(*)'),
}))

import { adminRepository } from '../admin.repository'

describe('adminRepository', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockDb = createChainMock()
  })

  describe('getUserById', () => {
    it('should return user when found', async () => {
      const user = { id: 'u1', email: 'admin@test.com', name: 'Admin', role: 'admin' }
      mockDb = createChainMock([user])

      const result = await adminRepository.getUserById('u1')

      expect(result).toEqual(user)
      expect(mockDb.select).toHaveBeenCalled()
      expect(mockDb.from).toHaveBeenCalled()
      expect(mockDb.where).toHaveBeenCalled()
      expect(mockDb.limit).toHaveBeenCalledWith(1)
    })

    it('should return null when user not found', async () => {
      mockDb = createChainMock([])

      const result = await adminRepository.getUserById('nonexistent')

      expect(result).toBeNull()
    })
  })

  describe('updateUserAdmin', () => {
    it('should update user role and return updated record', async () => {
      const updated = { id: 'u1', email: 'a@b.com', name: 'X', role: 'admin', features: [] }
      mockDb = createChainMock([updated])

      const result = await adminRepository.updateUserAdmin('u1', { role: 'admin' })

      expect(result).toEqual(updated)
      expect(mockDb.update).toHaveBeenCalled()
      expect(mockDb.set).toHaveBeenCalled()
      expect(mockDb.where).toHaveBeenCalled()
      expect(mockDb.returning).toHaveBeenCalled()
    })

    it('should return null when user not found', async () => {
      mockDb = createChainMock([])

      const result = await adminRepository.updateUserAdmin('nonexistent', { role: 'admin' })

      expect(result).toBeNull()
    })
  })

  describe('listUsers', () => {
    it('should return paginated users list', async () => {
      const users = [{ id: 'u1', name: 'User 1' }]
      // listUsers uses Promise.all with two queries
      // Both resolve via the same mockDb chain's .then
      mockDb = createChainMock(users)
      // The count query needs to return [{ total: 1 }]
      // Since both chains share the same mock, we need separate chains
      const itemsChain = createChainMock(users)
      const countChain = createChainMock([{ total: 1 }])

      let selectCallCount = 0
      mockDb.select = vi.fn().mockImplementation(() => {
        selectCallCount++
        return selectCallCount === 1 ? itemsChain : countChain
      })

      const result = await adminRepository.listUsers(1, 10)

      expect(result).toEqual({ items: users, total: 1 })
    })

    it('should apply search filter when search is provided', async () => {
      const users = [{ id: 'u1', name: 'Found' }]
      const itemsChain = createChainMock(users)
      const countChain = createChainMock([{ total: 1 }])

      let selectCallCount = 0
      mockDb.select = vi.fn().mockImplementation(() => {
        selectCallCount++
        return selectCallCount === 1 ? itemsChain : countChain
      })

      const result = await adminRepository.listUsers(1, 10, 'Found')

      expect(result).toEqual({ items: users, total: 1 })
      // When search is provided, .where should be called on both chains
      expect(itemsChain.where).toHaveBeenCalled()
      expect(countChain.where).toHaveBeenCalled()
    })
  })

  describe('getStats', () => {
    it('should return total and new this week counts', async () => {
      const totalChain = createChainMock([{ total: 100 }])
      const newChain = createChainMock([{ total: 5 }])

      let selectCallCount = 0
      mockDb.select = vi.fn().mockImplementation(() => {
        selectCallCount++
        return selectCallCount === 1 ? totalChain : newChain
      })

      const result = await adminRepository.getStats()

      expect(result).toEqual({ totalUsers: 100, newThisWeek: 5 })
    })
  })
})
