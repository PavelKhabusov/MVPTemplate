import { describe, it, expect, beforeEach, vi } from 'vitest'

vi.mock('@mvp/lib', () => ({
  mmkvStorage: {
    getItem: vi.fn(() => null),
    setItem: vi.fn(),
    removeItem: vi.fn(),
  },
}))

import { useAppStore } from '../app'

const initialState = useAppStore.getState()

describe('useAppStore', () => {
  beforeEach(() => {
    useAppStore.setState(initialState, true)
  })

  it('should have onboarding not completed and no last route initially', () => {
    const state = useAppStore.getState()
    expect(state.hasCompletedOnboarding).toBe(false)
    expect(state.lastRoute).toBeNull()
  })

  it('should mark onboarding as complete', () => {
    useAppStore.getState().setOnboardingComplete()
    expect(useAppStore.getState().hasCompletedOnboarding).toBe(true)
  })

  it('should reset onboarding', () => {
    useAppStore.getState().setOnboardingComplete()
    useAppStore.getState().resetOnboarding()
    expect(useAppStore.getState().hasCompletedOnboarding).toBe(false)
  })

  it('should set last route', () => {
    useAppStore.getState().setLastRoute('/settings')
    expect(useAppStore.getState().lastRoute).toBe('/settings')
  })
})
