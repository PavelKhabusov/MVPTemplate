import { describe, it, expect, beforeEach } from 'vitest'
import { useAuthStore } from '../auth'

const initialState = useAuthStore.getState()

describe('useAuthStore', () => {
  beforeEach(() => {
    useAuthStore.setState(initialState, true)
  })

  it('should have null user and not authenticated initially', () => {
    const state = useAuthStore.getState()
    expect(state.user).toBeNull()
    expect(state.isAuthenticated).toBe(false)
    expect(state.isInitialized).toBe(false)
  })

  it('should set user and mark as authenticated when setUser is called with user', () => {
    const user = { id: '1', email: 'test@test.com', name: 'Test' }
    useAuthStore.getState().setUser(user)

    const state = useAuthStore.getState()
    expect(state.user).toEqual(user)
    expect(state.isAuthenticated).toBe(true)
  })

  it('should clear user and mark as not authenticated when setUser is called with null', () => {
    useAuthStore.getState().setUser({ id: '1', email: 'a@b.com', name: 'A' })
    useAuthStore.getState().setUser(null)

    const state = useAuthStore.getState()
    expect(state.user).toBeNull()
    expect(state.isAuthenticated).toBe(false)
  })

  it('should mark as initialized when setInitialized is called', () => {
    useAuthStore.getState().setInitialized()
    expect(useAuthStore.getState().isInitialized).toBe(true)
  })

  it('should clear user on logout', () => {
    useAuthStore.getState().setUser({ id: '1', email: 'a@b.com', name: 'A' })
    useAuthStore.getState().logout()

    const state = useAuthStore.getState()
    expect(state.user).toBeNull()
    expect(state.isAuthenticated).toBe(false)
  })

  it('should preserve user fields like avatarUrl and role', () => {
    const user = {
      id: '1',
      email: 'test@test.com',
      name: 'Test',
      avatarUrl: 'https://example.com/avatar.png',
      role: 'admin',
      features: ['feature1'],
    }
    useAuthStore.getState().setUser(user)

    const state = useAuthStore.getState()
    expect(state.user?.avatarUrl).toBe('https://example.com/avatar.png')
    expect(state.user?.role).toBe('admin')
    expect(state.user?.features).toEqual(['feature1'])
  })
})
