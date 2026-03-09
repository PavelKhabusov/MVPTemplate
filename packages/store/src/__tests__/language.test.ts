import { describe, it, expect, beforeEach, vi } from 'vitest'

vi.mock('@mvp/lib', () => ({
  mmkvStorage: {
    getItem: vi.fn(() => null),
    setItem: vi.fn(),
    removeItem: vi.fn(),
  },
}))

import { useLanguageStore } from '../language'

const initialState = useLanguageStore.getState()

describe('useLanguageStore', () => {
  beforeEach(() => {
    useLanguageStore.setState(initialState, true)
  })

  it('should have null language by default (use device language)', () => {
    expect(useLanguageStore.getState().language).toBeNull()
  })

  it('should set language to a specific value', () => {
    useLanguageStore.getState().setLanguage('ru')
    expect(useLanguageStore.getState().language).toBe('ru')
  })

  it('should reset language to null (device default)', () => {
    useLanguageStore.getState().setLanguage('es')
    useLanguageStore.getState().setLanguage(null)
    expect(useLanguageStore.getState().language).toBeNull()
  })
})
