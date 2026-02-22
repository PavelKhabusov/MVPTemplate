import { updateTheme } from '@tamagui/theme'

export interface ColorSchemeValues {
  accent: string
  accentGradientStart: string
  accentGradientEnd: string
  secondary: string
}

export interface ColorScheme {
  key: string
  labelKey: string
  light: ColorSchemeValues
  dark: ColorSchemeValues
  swatch: string
}

export const COLOR_SCHEMES: ColorScheme[] = [
  {
    key: 'cyan',
    labelKey: 'templateConfig.schemeCyan',
    swatch: '#0891B2',
    light: {
      accent: '#0891B2',
      accentGradientStart: '#0891B2',
      accentGradientEnd: '#7C3AED',
      secondary: '#7C3AED',
    },
    dark: {
      accent: '#38E8FF',
      accentGradientStart: '#00D4FF',
      accentGradientEnd: '#A855F7',
      secondary: '#C084FC',
    },
  },
  {
    key: 'emerald',
    labelKey: 'templateConfig.schemeEmerald',
    swatch: '#059669',
    light: {
      accent: '#059669',
      accentGradientStart: '#059669',
      accentGradientEnd: '#0891B2',
      secondary: '#0D9488',
    },
    dark: {
      accent: '#34D399',
      accentGradientStart: '#10B981',
      accentGradientEnd: '#22D3EE',
      secondary: '#5EEAD4',
    },
  },
  {
    key: 'rose',
    labelKey: 'templateConfig.schemeRose',
    swatch: '#E11D48',
    light: {
      accent: '#E11D48',
      accentGradientStart: '#E11D48',
      accentGradientEnd: '#A21CAF',
      secondary: '#BE185D',
    },
    dark: {
      accent: '#FB7185',
      accentGradientStart: '#F43F5E',
      accentGradientEnd: '#D946EF',
      secondary: '#F472B6',
    },
  },
  {
    key: 'amber',
    labelKey: 'templateConfig.schemeAmber',
    swatch: '#D97706',
    light: {
      accent: '#D97706',
      accentGradientStart: '#D97706',
      accentGradientEnd: '#DC2626',
      secondary: '#EA580C',
    },
    dark: {
      accent: '#FBBF24',
      accentGradientStart: '#F59E0B',
      accentGradientEnd: '#F87171',
      secondary: '#FB923C',
    },
  },
  {
    key: 'violet',
    labelKey: 'templateConfig.schemeViolet',
    swatch: '#7C3AED',
    light: {
      accent: '#7C3AED',
      accentGradientStart: '#7C3AED',
      accentGradientEnd: '#2563EB',
      secondary: '#6D28D9',
    },
    dark: {
      accent: '#A78BFA',
      accentGradientStart: '#A855F7',
      accentGradientEnd: '#60A5FA',
      secondary: '#C4B5FD',
    },
  },
]

export const DEFAULT_SCHEME_KEY = 'cyan'

export function applyColorScheme(schemeKey: string): ColorScheme {
  const scheme = COLOR_SCHEMES.find((s) => s.key === schemeKey) ?? COLOR_SCHEMES[0]

  updateTheme({
    name: 'light',
    theme: {
      accent: scheme.light.accent,
      accentGradientStart: scheme.light.accentGradientStart,
      accentGradientEnd: scheme.light.accentGradientEnd,
      secondary: scheme.light.secondary,
    },
  })

  updateTheme({
    name: 'dark',
    theme: {
      accent: scheme.dark.accent,
      accentGradientStart: scheme.dark.accentGradientStart,
      accentGradientEnd: scheme.dark.accentGradientEnd,
      secondary: scheme.dark.secondary,
    },
  })

  return scheme
}
