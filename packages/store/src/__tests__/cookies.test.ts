import { describe, it, expect, beforeEach, vi } from 'vitest'

vi.mock('@mvp/lib', () => ({
  mmkvStorage: {
    getItem: vi.fn(() => null),
    setItem: vi.fn(),
    removeItem: vi.fn(),
  },
}))

import { useCookieConsentStore } from '../cookies'

const initialState = useCookieConsentStore.getState()

describe('useCookieConsentStore', () => {
  beforeEach(() => {
    useCookieConsentStore.setState(initialState, true)
  })

  it('should have null consent initially', () => {
    expect(useCookieConsentStore.getState().consent).toBeNull()
  })

  it('should set consent to accepted', () => {
    useCookieConsentStore.getState().setConsent('accepted')
    expect(useCookieConsentStore.getState().consent).toBe('accepted')
  })

  it('should set consent to declined', () => {
    useCookieConsentStore.getState().setConsent('declined')
    expect(useCookieConsentStore.getState().consent).toBe('declined')
  })

  it('should reset consent back to null', () => {
    useCookieConsentStore.getState().setConsent('accepted')
    useCookieConsentStore.getState().resetConsent()
    expect(useCookieConsentStore.getState().consent).toBeNull()
  })
})
