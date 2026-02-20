import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { mmkvStorage } from '@mvp/lib'

interface LanguageState {
  language: string | null // null = use device language
  setLanguage: (language: string | null) => void
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set) => ({
      language: null,
      setLanguage: (language: string | null) => set({ language }),
    }),
    {
      name: 'language-storage',
      storage: createJSONStorage(() => mmkvStorage),
    }
  )
)
