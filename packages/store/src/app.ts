import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { mmkvStorage } from '@mvp/lib'

interface AppState {
  hasCompletedOnboarding: boolean
  lastRoute: string | null
  setOnboardingComplete: () => void
  setLastRoute: (route: string) => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      hasCompletedOnboarding: false,
      lastRoute: null,

      setOnboardingComplete: () => set({ hasCompletedOnboarding: true }),
      setLastRoute: (route: string) => set({ lastRoute: route }),
    }),
    {
      name: 'app-storage',
      storage: createJSONStorage(() => mmkvStorage),
    }
  )
)
