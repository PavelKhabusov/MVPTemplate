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
  asc: vi.fn((col: any) => ({ type: 'asc', col })),
  desc: vi.fn((col: any) => ({ type: 'desc', col })),
}))

import { proxyRepository } from '../proxy.repository'

describe('proxyRepository', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockDb = createChainMock()
  })

  describe('findAll', () => {
    it('should return all proxies with masked passwords', async () => {
      const proxies = [
        { id: 'p1', host: '1.2.3.4', password: 'secret123' },
        { id: 'p2', host: '5.6.7.8', password: null },
      ]
      mockDb = createChainMock(proxies)

      const result = await proxyRepository.findAll()

      expect(result).toHaveLength(2)
      expect(result[0].password).toBe('••••••••')
      expect(result[1].password).toBeNull()
      expect(mockDb.orderBy).toHaveBeenCalled()
    })
  })

  describe('findById', () => {
    it('should return proxy with masked password', async () => {
      const proxy = { id: 'p1', host: '1.2.3.4', password: 'secret' }
      mockDb = createChainMock([proxy])

      const result = await proxyRepository.findById('p1')

      expect(result!.password).toBe('••••••••')
    })

    it('should return null when not found', async () => {
      mockDb = createChainMock([])

      const result = await proxyRepository.findById('nonexistent')

      expect(result).toBeNull()
    })
  })

  describe('findByIdRaw', () => {
    it('should return proxy with real password', async () => {
      const proxy = { id: 'p1', host: '1.2.3.4', password: 'secret' }
      mockDb = createChainMock([proxy])

      const result = await proxyRepository.findByIdRaw('p1')

      expect(result!.password).toBe('secret')
    })

    it('should return null when not found', async () => {
      mockDb = createChainMock([])

      const result = await proxyRepository.findByIdRaw('nonexistent')

      expect(result).toBeNull()
    })
  })

  describe('create', () => {
    it('should create proxy and return with masked password', async () => {
      const created = { id: 'p1', host: '1.2.3.4', password: 'secret', lastCheckStatus: 'pending' }
      mockDb = createChainMock([created])

      const result = await proxyRepository.create({
        host: '1.2.3.4',
        port: 8080,
        protocol: 'http',
        username: null,
        password: 'secret',
        isActive: true,
        priority: 1,
      } as any)

      expect(result.password).toBe('••••••••')
      expect(mockDb.insert).toHaveBeenCalled()
      expect(mockDb.returning).toHaveBeenCalled()
    })
  })

  describe('update', () => {
    it('should update proxy and return with masked password', async () => {
      const updated = { id: 'p1', host: '9.9.9.9', password: 'newpass' }
      mockDb = createChainMock([updated])

      const result = await proxyRepository.update('p1', { host: '9.9.9.9' } as any)

      expect(result!.password).toBe('••••••••')
      expect(mockDb.update).toHaveBeenCalled()
    })

    it('should strip masked password from update data', async () => {
      const updated = { id: 'p1', host: '1.2.3.4', password: 'original' }
      mockDb = createChainMock([updated])

      await proxyRepository.update('p1', { password: '••••••••' } as any)

      // set should not include the masked password
      const setCall = mockDb.set.mock.calls[0][0]
      expect(setCall.password).toBeUndefined()
    })

    it('should return null when proxy not found', async () => {
      mockDb = createChainMock([])

      const result = await proxyRepository.update('nonexistent', { host: 'x' } as any)

      expect(result).toBeNull()
    })
  })

  describe('delete', () => {
    it('should return true when proxy deleted', async () => {
      mockDb = createChainMock([{ id: 'p1' }])

      const result = await proxyRepository.delete('p1')

      expect(result).toBe(true)
      expect(mockDb.delete).toHaveBeenCalled()
    })

    it('should return false when proxy not found', async () => {
      mockDb = createChainMock([])

      const result = await proxyRepository.delete('nonexistent')

      expect(result).toBe(false)
    })
  })

  describe('toggleActive', () => {
    it('should toggle active state and return masked result', async () => {
      const updated = { id: 'p1', isActive: false, password: 'secret' }
      mockDb = createChainMock([updated])

      const result = await proxyRepository.toggleActive('p1', false)

      expect(result!.isActive).toBe(false)
      expect(result!.password).toBe('••••••••')
    })

    it('should return null when proxy not found', async () => {
      mockDb = createChainMock([])

      const result = await proxyRepository.toggleActive('nonexistent', true)

      expect(result).toBeNull()
    })
  })

  describe('updateCheckStatus', () => {
    it('should update check status fields', async () => {
      mockDb = createChainMock()

      await proxyRepository.updateCheckStatus('p1', 'ok', 'Connection successful')

      expect(mockDb.update).toHaveBeenCalled()
      expect(mockDb.set).toHaveBeenCalled()
      expect(mockDb.where).toHaveBeenCalled()
    })
  })
})
