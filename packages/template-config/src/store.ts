import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { mmkvStorage } from '@mvp/lib'

export type WebLayout = 'sidebar' | 'header' | 'both'
export type UserBadgePlacement = 'sidebar' | 'header' | 'nowhere' | 'both'
export type HeaderNavAlign = 'left' | 'center' | 'right'
export type ItemPlacement = 'sidebar' | 'header' | 'nowhere' | 'both'
export type SearchPlacement = 'sidebar' | 'header' | 'nowhere'

interface TemplateConfigState {
  sidebarOpen: boolean
  overrides: Record<string, boolean>
  colorScheme: string | null
  customColor: string | null
  webLayout: WebLayout
  userBadgePlacement: UserBadgePlacement
  headerNavAlign: HeaderNavAlign
  compactProfile: boolean
  languagePlacement: ItemPlacement
  themePlacement: ItemPlacement
  searchPlacement: SearchPlacement
  contentMaxWidth: number
  setSidebarOpen: (open: boolean) => void
  setFlag: (key: string, value: boolean) => void
  setColorScheme: (key: string) => void
  setCustomColor: (hex: string | null) => void
  setWebLayout: (layout: WebLayout) => void
  setUserBadgePlacement: (placement: UserBadgePlacement) => void
  setHeaderNavAlign: (align: HeaderNavAlign) => void
  setCompactProfile: (compact: boolean) => void
  setLanguagePlacement: (placement: ItemPlacement) => void
  setThemePlacement: (placement: ItemPlacement) => void
  setSearchPlacement: (placement: SearchPlacement) => void
  setContentMaxWidth: (width: number) => void
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
      userBadgePlacement: 'sidebar',
      headerNavAlign: 'center',
      compactProfile: false,
      languagePlacement: 'nowhere',
      themePlacement: 'nowhere',
      searchPlacement: 'nowhere',
      contentMaxWidth: 1200,
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      setFlag: (key, value) =>
        set((state) => ({
          overrides: { ...state.overrides, [key]: value },
        })),
      setColorScheme: (key) => set({ colorScheme: key, customColor: null }),
      setCustomColor: (hex) => set({ customColor: hex, colorScheme: null }),
      setWebLayout: (layout) => set({ webLayout: layout }),
      setUserBadgePlacement: (placement) => set({ userBadgePlacement: placement }),
      setHeaderNavAlign: (align) => set({ headerNavAlign: align }),
      setCompactProfile: (compact) => set({ compactProfile: compact }),
      setLanguagePlacement: (placement) => set({ languagePlacement: placement }),
      setThemePlacement: (placement) => set({ themePlacement: placement }),
      setSearchPlacement: (placement) => set({ searchPlacement: placement }),
      setContentMaxWidth: (width) => set({ contentMaxWidth: width }),
      resetAll: () => set({ overrides: {}, colorScheme: null, customColor: null, webLayout: 'sidebar', userBadgePlacement: 'sidebar', headerNavAlign: 'center', compactProfile: false, languagePlacement: 'nowhere', themePlacement: 'nowhere', searchPlacement: 'nowhere', contentMaxWidth: 1200 }),
    }),
    {
      name: 'template-config',
      storage: createJSONStorage(() => mmkvStorage),
      partialize: (state) => ({
        overrides: state.overrides,
        colorScheme: state.colorScheme,
        customColor: state.customColor,
        webLayout: state.webLayout,
        userBadgePlacement: state.userBadgePlacement,
        headerNavAlign: state.headerNavAlign,
        compactProfile: state.compactProfile,
        languagePlacement: state.languagePlacement,
        themePlacement: state.themePlacement,
        searchPlacement: state.searchPlacement,
        contentMaxWidth: state.contentMaxWidth,
      }),
    },
  ),
)
