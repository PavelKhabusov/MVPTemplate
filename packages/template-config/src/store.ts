import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { mmkvStorage } from '@mvp/lib'

interface TemplateConfigState {
  sidebarOpen: boolean
  overrides: Record<string, boolean>
  colorScheme: string | null
  customColor: string | null
  setSidebarOpen: (open: boolean) => void
  setFlag: (key: string, value: boolean) => void
  setColorScheme: (key: string) => void
  setCustomColor: (hex: string | null) => void
  resetAll: () => void
}

export const useTemplateConfigStore = create<TemplateConfigState>()(
  persist(
    (set) => ({
      sidebarOpen: false,
      overrides: {},
      colorScheme: null,
      customColor: null,
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      setFlag: (key, value) =>
        set((state) => ({
          overrides: { ...state.overrides, [key]: value },
        })),
      setColorScheme: (key) => set({ colorScheme: key, customColor: null }),
      setCustomColor: (hex) => set({ customColor: hex, colorScheme: null }),
      resetAll: () => set({ overrides: {}, colorScheme: null, customColor: null }),
    }),
    {
      name: 'template-config',
      storage: createJSONStorage(() => mmkvStorage),
      partialize: (state) => ({
        overrides: state.overrides,
        colorScheme: state.colorScheme,
        customColor: state.customColor,
      }),
    },
  ),
)
