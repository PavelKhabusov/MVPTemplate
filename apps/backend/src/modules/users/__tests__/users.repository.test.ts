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
}))

import { usersRepository } from '../users.repository'

describe('usersRepository', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockDb = createChainMock()
  })

  describe('findById', () => {
    it('should return user when found', async () => {
      const user = { id: 'u1', email: 'test@test.com', name: 'Test' }
      mockDb = createChainMock([user])

      const result = await usersRepository.findById('u1')

      expect(result).toEqual(user)
      expect(mockDb.select).toHaveBeenCalled()
      expect(mockDb.from).toHaveBeenCalled()
      expect(mockDb.where).toHaveBeenCalled()
      expect(mockDb.limit).toHaveBeenCalledWith(1)
    })

    it('should return null when user not found', async () => {
      mockDb = createChainMock([])

      const result = await usersRepository.findById('nonexistent')

      expect(result).toBeNull()
    })
  })

  describe('updateProfile', () => {
    it('should update user and return updated record', async () => {
      const updated = { id: 'u1', name: 'New Name' }
      mockDb = createChainMock([updated])

      const result = await usersRepository.updateProfile('u1', { name: 'New Name' })

      expect(result).toEqual(updated)
      expect(mockDb.update).toHaveBeenCalled()
      expect(mockDb.set).toHaveBeenCalled()
      expect(mockDb.where).toHaveBeenCalled()
      expect(mockDb.returning).toHaveBeenCalled()
    })
  })

  describe('getSettings', () => {
    it('should return settings when found', async () => {
      const settings = { userId: 'u1', settings: { theme: 'dark' } }
      mockDb = createChainMock([settings])

      const result = await usersRepository.getSettings('u1')

      expect(result).toEqual(settings)
      expect(mockDb.limit).toHaveBeenCalledWith(1)
    })

    it('should return null when no settings', async () => {
      mockDb = createChainMock([])

      const result = await usersRepository.getSettings('u1')

      expect(result).toBeNull()
    })
  })

  describe('upsertSettings', () => {
    it('should insert new settings when none exist', async () => {
      const newSettings = { userId: 'u1', settings: { theme: 'dark' } }
      // First call: getSettings returns empty (no existing)
      // We need two separate chain mocks: one for getSettings, one for insert
      const getChain = createChainMock([])
      const insertChain = createChainMock([newSettings])

      let callCount = 0
      // Override select to return getChain first time
      mockDb = createChainMock([])
      // For upsertSettings, it first calls this.getSettings which uses db.select
      // Then calls db.insert
      const originalSelect = mockDb.select
      mockDb.select = vi.fn().mockReturnValue(getChain)
      mockDb.insert = vi.fn().mockReturnValue(insertChain)

      const result = await usersRepository.upsertSettings('u1', { theme: 'dark' } as any)

      expect(result).toEqual(newSettings)
      expect(mockDb.insert).toHaveBeenCalled()
    })

    it('should update existing settings with merge', async () => {
      const existing = { userId: 'u1', settings: { theme: 'dark', lang: 'en' } }
      const updated = { userId: 'u1', settings: { theme: 'light', lang: 'en' } }

      // getSettings returns existing
      const getChain = createChainMock([existing])
      const updateChain = createChainMock([updated])

      mockDb.select = vi.fn().mockReturnValue(getChain)
      mockDb.update = vi.fn().mockReturnValue(updateChain)

      const result = await usersRepository.upsertSettings('u1', { theme: 'light' } as any)

      expect(result).toEqual(updated)
      expect(mockDb.update).toHaveBeenCalled()
    })
  })
})
