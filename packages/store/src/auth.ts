import { create } from 'zustand'

interface AuthUser {
  id: string
  email: string
  name: string
  avatarUrl?: string | null
}

interface AuthState {
  user: AuthUser | null
  isAuthenticated: boolean
  isInitialized: boolean
  setUser: (user: AuthUser | null) => void
  setInitialized: () => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  isAuthenticated: false,
  isInitialized: false,

  setUser: (user) =>
    set({
      user,
      isAuthenticated: !!user,
    }),

  setInitialized: () => set({ isInitialized: true }),

  logout: () =>
    set({
      user: null,
      isAuthenticated: false,
    }),
}))
