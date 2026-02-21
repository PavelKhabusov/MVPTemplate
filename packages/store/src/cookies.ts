import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { mmkvStorage } from '@mvp/lib'

type CookieConsent = 'accepted' | 'declined' | null

interface CookieConsentState {
  consent: CookieConsent
  setConsent: (choice: 'accepted' | 'declined') => void
  resetConsent: () => void
}

export const useCookieConsentStore = create<CookieConsentState>()(
  persist(
    (set) => ({
      consent: null,
      setConsent: (choice) => set({ consent: choice }),
      resetConsent: () => set({ consent: null }),
    }),
    {
      name: 'cookie-consent',
      storage: createJSONStorage(() => mmkvStorage),
    },
  ),
)
