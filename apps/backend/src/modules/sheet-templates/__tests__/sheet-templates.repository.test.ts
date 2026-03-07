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
}))

import { sheetTemplatesRepository } from '../sheet-templates.repository'

describe('sheetTemplatesRepository', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockDb = createChainMock()
  })

  describe('list', () => {
    it('should return all templates for a user', async () => {
      const templates = [{ id: 't1', name: 'Template 1' }, { id: 't2', name: 'Template 2' }]
      mockDb = createChainMock(templates)

      const result = await sheetTemplatesRepository.list('u1')

      expect(result).toEqual(templates)
      expect(mockDb.select).toHaveBeenCalled()
      expect(mockDb.where).toHaveBeenCalled()
      expect(mockDb.orderBy).toHaveBeenCalled()
    })
  })

  describe('findById', () => {
    it('should return template when found', async () => {
      const template = { id: 't1', userId: 'u1', name: 'My Template' }
      mockDb = createChainMock([template])

      const result = await sheetTemplatesRepository.findById('t1', 'u1')

      expect(result).toEqual(template)
      expect(mockDb.where).toHaveBeenCalled()
      expect(mockDb.limit).toHaveBeenCalledWith(1)
    })

    it('should return null when not found', async () => {
      mockDb = createChainMock([])

      const result = await sheetTemplatesRepository.findById('nonexistent', 'u1')

      expect(result).toBeNull()
    })
  })

  describe('findBySheet', () => {
    it('should find template by spreadsheet and sheet name', async () => {
      const template = { id: 't1', spreadsheetId: 'sp1', sheetName: 'Sheet1' }
      mockDb = createChainMock([template])

      const result = await sheetTemplatesRepository.findBySheet('u1', 'sp1', 'Sheet1')

      expect(result).toEqual(template)
      expect(mockDb.where).toHaveBeenCalled()
      expect(mockDb.limit).toHaveBeenCalledWith(1)
    })

    it('should return null when no template matches', async () => {
      mockDb = createChainMock([])

      const result = await sheetTemplatesRepository.findBySheet('u1', 'sp1', 'NoSheet')

      expect(result).toBeNull()
    })
  })

  describe('findDefault', () => {
    it('should return the default template for a user', async () => {
      const template = { id: 't1', isDefault: true }
      mockDb = createChainMock([template])

      const result = await sheetTemplatesRepository.findDefault('u1')

      expect(result).toEqual(template)
    })

    it('should return null when no default template', async () => {
      mockDb = createChainMock([])

      const result = await sheetTemplatesRepository.findDefault('u1')

      expect(result).toBeNull()
    })
  })

  describe('create', () => {
    it('should insert template and return created record', async () => {
      const newTemplate = { userId: 'u1', name: 'New', spreadsheetId: 'sp1' }
      const created = { id: 't1', ...newTemplate }
      mockDb = createChainMock([created])

      const result = await sheetTemplatesRepository.create(newTemplate as any)

      expect(result).toEqual(created)
      expect(mockDb.insert).toHaveBeenCalled()
      expect(mockDb.values).toHaveBeenCalledWith(newTemplate)
      expect(mockDb.returning).toHaveBeenCalled()
    })
  })

  describe('update', () => {
    it('should update template and return updated record', async () => {
      const updated = { id: 't1', name: 'Updated Name' }
      mockDb = createChainMock([updated])

      const result = await sheetTemplatesRepository.update('t1', 'u1', { name: 'Updated Name' })

      expect(result).toEqual(updated)
      expect(mockDb.update).toHaveBeenCalled()
      expect(mockDb.set).toHaveBeenCalled()
      expect(mockDb.returning).toHaveBeenCalled()
    })

    it('should return null when template not found', async () => {
      mockDb = createChainMock([])

      const result = await sheetTemplatesRepository.update('nonexistent', 'u1', { name: 'X' })

      expect(result).toBeNull()
    })
  })

  describe('delete', () => {
    it('should delete template by id and userId', async () => {
      mockDb = createChainMock()

      await sheetTemplatesRepository.delete('t1', 'u1')

      expect(mockDb.delete).toHaveBeenCalled()
      expect(mockDb.where).toHaveBeenCalled()
    })
  })

  describe('clearDefault', () => {
    it('should set isDefault to false for all user defaults', async () => {
      mockDb = createChainMock()

      await sheetTemplatesRepository.clearDefault('u1')

      expect(mockDb.update).toHaveBeenCalled()
      expect(mockDb.set).toHaveBeenCalled()
      expect(mockDb.where).toHaveBeenCalled()
    })
  })
})
