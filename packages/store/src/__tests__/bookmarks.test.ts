import { describe, it, expect, beforeEach, vi } from 'vitest'

vi.mock('@mvp/lib', () => ({
  mmkvStorage: {
    getItem: vi.fn(() => null),
    setItem: vi.fn(),
    removeItem: vi.fn(),
  },
}))

import { useBookmarksStore } from '../bookmarks'

const initialState = useBookmarksStore.getState()

describe('useBookmarksStore', () => {
  beforeEach(() => {
    useBookmarksStore.setState(initialState, true)
  })

  it('should start with no bookmarks', () => {
    expect(useBookmarksStore.getState().bookmarkedIds).toEqual([])
  })

  it('should add a bookmark when toggling a non-bookmarked id', () => {
    useBookmarksStore.getState().toggle('item-1')
    expect(useBookmarksStore.getState().bookmarkedIds).toContain('item-1')
  })

  it('should remove a bookmark when toggling an already-bookmarked id', () => {
    useBookmarksStore.getState().toggle('item-1')
    useBookmarksStore.getState().toggle('item-1')
    expect(useBookmarksStore.getState().bookmarkedIds).not.toContain('item-1')
  })

  it('should correctly report isBookmarked', () => {
    expect(useBookmarksStore.getState().isBookmarked('item-1')).toBe(false)
    useBookmarksStore.getState().toggle('item-1')
    expect(useBookmarksStore.getState().isBookmarked('item-1')).toBe(true)
    useBookmarksStore.getState().toggle('item-1')
    expect(useBookmarksStore.getState().isBookmarked('item-1')).toBe(false)
  })
})
