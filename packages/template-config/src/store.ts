import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { mmkvStorage } from '@mvp/lib'

export type WebLayout = 'sidebar' | 'header' | 'both'
export type ConfigPlacement = 'sidebar' | 'header' | 'nowhere' | 'both'

interface TemplateConfigState {
  sidebarOpen: boolean
  overrides: Record<string, boolean>
  colorScheme: string | null
  customColor: string | null
  webLayout: WebLayout
  configPlacement: ConfigPlacement
  setSidebarOpen: (open: boolean) => void
  setFlag: (key: string, value: boolean) => void
  setColorScheme: (key: string) => void
  setCustomColor: (hex: string | null) => void
  setWebLayout: (layout: WebLayout) => void
  setConfigPlacement: (placement: ConfigPlacement) => void
  resetAll: () => void
}

export const useTemplateConfigStore = create<TemplateConfigState>()(
  persist(
    (set) => ({
      sidebarOpen: false,
      overrides: {},
      colorScheme: null,
      customColor: null,
      webLayout: 'sidebar',
      configPlacement: 'sidebar',
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      setFlag: (key, value) =>
        set((state) => ({
          overrides: { ...state.overrides, [key]: value },
        })),
      setColorScheme: (key) => set({ colorScheme: key, customColor: null }),
      setCustomColor: (hex) => set({ customColor: hex, colorScheme: null }),
      setWebLayout: (layout) => set({ webLayout: layout }),
      setConfigPlacement: (placement) => set({ configPlacement: placement }),
      resetAll: () => set({ overrides: {}, colorScheme: null, customColor: null, webLayout: 'sidebar', configPlacement: 'sidebar' }),
    }),
    {
      name: 'template-config',
      storage: createJSONStorage(() => mmkvStorage),
      partialize: (state) => ({
        overrides: state.overrides,
        colorScheme: state.colorScheme,
        customColor: state.customColor,
        webLayout: state.webLayout,
        configPlacement: state.configPlacement,
      }),
    },
  ),
)
