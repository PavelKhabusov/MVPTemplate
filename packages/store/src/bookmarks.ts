import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { mmkvStorage } from '@mvp/lib'

interface BookmarksState {
  bookmarkedIds: string[]
  toggle: (id: string) => void
  isBookmarked: (id: string) => boolean
}

export const useBookmarksStore = create<BookmarksState>()(
  persist(
    (set, get) => ({
      bookmarkedIds: [],
      toggle: (id: string) => {
        const { bookmarkedIds } = get()
        if (bookmarkedIds.includes(id)) {
          set({ bookmarkedIds: bookmarkedIds.filter((b) => b !== id) })
        } else {
          set({ bookmarkedIds: [...bookmarkedIds, id] })
        }
      },
      isBookmarked: (id: string) => get().bookmarkedIds.includes(id),
    }),
    {
      name: 'bookmarks-storage',
      storage: createJSONStorage(() => mmkvStorage),
    }
  )
)
