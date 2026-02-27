import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { mmkvStorage } from '@mvp/lib'

export type WebLayout = 'sidebar' | 'header' | 'both'
export type UserBadgePlacement = 'sidebar' | 'header' | 'nowhere' | 'both'
export type HeaderNavAlign = 'left' | 'center' | 'right'
export type ItemPlacement = 'sidebar' | 'header' | 'nowhere' | 'both'
export type SearchPlacement = 'sidebar' | 'header' | 'nowhere'
export type RadiusScale = 'square' | 'sharp' | 'default' | 'rounded' | 'pill'
export type FontScale = 'compact' | 'default' | 'large'
export type CardStyle = 'flat' | 'bordered' | 'elevated' | 'glass'
export type FontFamily = 'system' | 'inter' | 'roboto' | 'open-sans' | 'nunito' | 'dm-sans' | 'space-grotesk' | 'montserrat'

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
  radiusScale: RadiusScale
  fontScale: FontScale
  fontFamily: FontFamily
  cardStyle: CardStyle
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
  setRadiusScale: (scale: RadiusScale) => void
  setFontScale: (scale: FontScale) => void
  setFontFamily: (family: FontFamily) => void
  setCardStyle: (style: CardStyle) => void
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
      radiusScale: 'default',
      fontScale: 'default',
      fontFamily: 'inter',
      cardStyle: 'elevated',
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
      setRadiusScale: (scale) => set({ radiusScale: scale }),
      setFontScale: (scale) => set({ fontScale: scale }),
      setFontFamily: (family) => set({ fontFamily: family }),
      setCardStyle: (style) => set({ cardStyle: style }),
      resetAll: () => set({ overrides: {}, colorScheme: null, customColor: null, webLayout: 'sidebar', userBadgePlacement: 'sidebar', headerNavAlign: 'center', compactProfile: false, languagePlacement: 'nowhere', themePlacement: 'nowhere', searchPlacement: 'nowhere', radiusScale: 'default', fontScale: 'default', fontFamily: 'inter', cardStyle: 'elevated' }),
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
        radiusScale: state.radiusScale,
        fontScale: state.fontScale,
        fontFamily: state.fontFamily,
        cardStyle: state.cardStyle,
      }),
    },
  ),
)
