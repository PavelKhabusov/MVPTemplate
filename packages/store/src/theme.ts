import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { mmkvStorage } from '@mvp/lib'
import { Appearance, ColorSchemeName } from 'react-native'

export type ThemeMode = 'system' | 'light' | 'dark'

interface ThemeState {
  mode: ThemeMode
  resolvedTheme: 'light' | 'dark'
  setMode: (mode: ThemeMode) => void
}

function resolveTheme(mode: ThemeMode): 'light' | 'dark' {
  if (mode === 'system') {
    return Appearance.getColorScheme() ?? 'light'
  }
  return mode
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      mode: 'system' as ThemeMode,
      resolvedTheme: resolveTheme('system'),

      setMode: (mode: ThemeMode) => {
        set({ mode, resolvedTheme: resolveTheme(mode) })
      },
    }),
    {
      name: 'theme-storage',
      storage: createJSONStorage(() => mmkvStorage),
      partialize: (state) => ({ mode: state.mode }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.resolvedTheme = resolveTheme(state.mode)
        }
      },
    }
  )
)

// Listen for system theme changes and update resolvedTheme when mode is 'system'
Appearance.addChangeListener(({ colorScheme }) => {
  const { mode } = useThemeStore.getState()
  if (mode === 'system') {
    useThemeStore.setState({
      resolvedTheme: colorScheme ?? 'light',
    })
  }
})
