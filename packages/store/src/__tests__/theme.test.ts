import { describe, it, expect, beforeEach, vi } from 'vitest'
import { Appearance } from 'react-native'

// Mock dependencies before importing the store
vi.mock('react-native', () => ({
  Appearance: {
    getColorScheme: vi.fn(() => 'light'),
    addChangeListener: vi.fn(),
  },
  Platform: { OS: 'ios' },
}))

vi.mock('@mvp/lib', () => ({
  mmkvStorage: {
    getItem: vi.fn(() => null),
    setItem: vi.fn(),
    removeItem: vi.fn(),
  },
}))

import { useThemeStore } from '../theme'

const mockedGetColorScheme = vi.mocked(Appearance.getColorScheme)
const initialState = useThemeStore.getState()

describe('useThemeStore', () => {
  beforeEach(() => {
    mockedGetColorScheme.mockReturnValue('light')
    useThemeStore.setState({ ...initialState, mode: 'system', resolvedTheme: 'light' }, true)
  })

  it('should have system mode by default', () => {
    const state = useThemeStore.getState()
    expect(state.mode).toBe('system')
  })

  it('should set mode to light and resolve theme as light', () => {
    useThemeStore.getState().setMode('light')
    const state = useThemeStore.getState()
    expect(state.mode).toBe('light')
    expect(state.resolvedTheme).toBe('light')
  })

  it('should set mode to dark and resolve theme as dark', () => {
    useThemeStore.getState().setMode('dark')
    const state = useThemeStore.getState()
    expect(state.mode).toBe('dark')
    expect(state.resolvedTheme).toBe('dark')
  })

  it('should resolve system mode using Appearance.getColorScheme', () => {
    mockedGetColorScheme.mockReturnValue('dark')

    useThemeStore.getState().setMode('system')
    const state = useThemeStore.getState()
    expect(state.mode).toBe('system')
    expect(state.resolvedTheme).toBe('dark')
  })

  it('should fall back to light when system color scheme is null', () => {
    mockedGetColorScheme.mockReturnValue(null)

    useThemeStore.getState().setMode('system')
    expect(useThemeStore.getState().resolvedTheme).toBe('light')
  })
})
