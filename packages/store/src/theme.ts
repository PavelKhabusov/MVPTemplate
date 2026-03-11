import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { mmkvStorage } from '@mvp/lib'
import { Appearance, Platform } from 'react-native'

export type ThemeMode = 'system' | 'light' | 'dark'

interface ThemeState {
  mode: ThemeMode
  resolvedTheme: 'light' | 'dark'
  _hasHydrated: boolean
  setMode: (mode: ThemeMode) => void
}

function getSystemTheme(): 'light' | 'dark' {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }
  return Appearance.getColorScheme() ?? 'light'
}

function resolveTheme(mode: ThemeMode): 'light' | 'dark' {
  if (mode === 'system') {
    return getSystemTheme()
  }
  return mode
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      mode: 'system' as ThemeMode,
      resolvedTheme: resolveTheme('system'),
      _hasHydrated: false,

      setMode: (mode: ThemeMode) => {
        set({ mode, resolvedTheme: resolveTheme(mode) })
      },
    }),
    {
      name: 'theme-storage',
      storage: createJSONStorage(() => mmkvStorage),
      partialize: (state) => ({ mode: state.mode }),
    }
  )
)

// Mark hydration complete — uses onFinishHydration listener + immediate check
// (onRehydrateStorage inner callback fires as a microtask, which on web causes
// _hasHydrated to still be false on first React render)
useThemeStore.persist.onFinishHydration((state) => {
  useThemeStore.setState({
    resolvedTheme: resolveTheme(state.mode),
    _hasHydrated: true,
  })
})

if (useThemeStore.persist.hasHydrated()) {
  const { mode } = useThemeStore.getState()
  useThemeStore.setState({ resolvedTheme: resolveTheme(mode), _hasHydrated: true })
}

// Listen for system theme changes and update resolvedTheme when mode is 'system'
if (Platform.OS === 'web' && typeof window !== 'undefined') {
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    const { mode } = useThemeStore.getState()
    if (mode === 'system') {
      useThemeStore.setState({ resolvedTheme: e.matches ? 'dark' : 'light' })
    }
  })
} else {
  Appearance.addChangeListener(({ colorScheme }) => {
    const { mode } = useThemeStore.getState()
    if (mode === 'system') {
      useThemeStore.setState({ resolvedTheme: colorScheme ?? 'light' })
    }
  })
}
