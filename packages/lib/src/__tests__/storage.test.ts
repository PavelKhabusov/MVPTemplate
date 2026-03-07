import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock react-native as web platform
vi.mock('react-native', () => ({
  Platform: { OS: 'web' },
}))

// Mock expo-constants
vi.mock('expo-constants', () => ({
  default: { executionEnvironment: 'standalone' },
  ExecutionEnvironment: { StoreClient: 'storeClient' },
}))

// We need to reset modules between groups to test different storage backends
describe('mmkvStorage (web/localStorage path)', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('should set and get item via localStorage on web', async () => {
    const { mmkvStorage } = await import('../storage')

    mmkvStorage.setItem('test-key', 'test-value')
    expect(localStorage.getItem('test-key')).toBe('test-value')

    const result = mmkvStorage.getItem('test-key')
    expect(result).toBe('test-value')
  })

  it('should remove item from localStorage', async () => {
    const { mmkvStorage } = await import('../storage')

    mmkvStorage.setItem('to-remove', 'value')
    mmkvStorage.removeItem('to-remove')
    expect(localStorage.getItem('to-remove')).toBeNull()
  })

  it('should return null for non-existent key', async () => {
    const { mmkvStorage } = await import('../storage')

    const result = mmkvStorage.getItem('non-existent')
    expect(result).toBeNull()
  })
})

describe('storage direct API (web/localStorage path)', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('should set and getString via direct storage API', async () => {
    const { storage } = await import('../storage')

    storage.set('direct-key', 'direct-value')
    expect(storage.getString('direct-key')).toBe('direct-value')
  })

  it('should return undefined for missing key in direct API', async () => {
    const { storage } = await import('../storage')

    expect(storage.getString('missing')).toBeUndefined()
  })

  it('should delete via direct storage API', async () => {
    const { storage } = await import('../storage')

    storage.set('del-key', 'val')
    storage.delete('del-key')
    expect(storage.getString('del-key')).toBeUndefined()
  })
})
