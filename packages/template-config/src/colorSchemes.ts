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
    key: 'blue',
    labelKey: 'templateConfig.schemeBlue',
    swatch: '#2563EB',
    light: {
      accent: '#2563EB',
      accentGradientStart: '#2563EB',
      accentGradientEnd: '#7C3AED',
      secondary: '#4F46E5',
    },
    dark: {
      accent: '#60A5FA',
      accentGradientStart: '#3B82F6',
      accentGradientEnd: '#A78BFA',
      secondary: '#818CF8',
    },
  },
  {
    key: 'indigo',
    labelKey: 'templateConfig.schemeIndigo',
    swatch: '#4F46E5',
    light: {
      accent: '#4F46E5',
      accentGradientStart: '#4F46E5',
      accentGradientEnd: '#0891B2',
      secondary: '#4338CA',
    },
    dark: {
      accent: '#818CF8',
      accentGradientStart: '#6366F1',
      accentGradientEnd: '#22D3EE',
      secondary: '#A5B4FC',
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
  {
    key: 'pink',
    labelKey: 'templateConfig.schemePink',
    swatch: '#EC4899',
    light: {
      accent: '#EC4899',
      accentGradientStart: '#EC4899',
      accentGradientEnd: '#A855F7',
      secondary: '#DB2777',
    },
    dark: {
      accent: '#F9A8D4',
      accentGradientStart: '#F472B6',
      accentGradientEnd: '#C084FC',
      secondary: '#FBCFE8',
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
    key: 'red',
    labelKey: 'templateConfig.schemeRed',
    swatch: '#DC2626',
    light: {
      accent: '#DC2626',
      accentGradientStart: '#DC2626',
      accentGradientEnd: '#EA580C',
      secondary: '#B91C1C',
    },
    dark: {
      accent: '#F87171',
      accentGradientStart: '#EF4444',
      accentGradientEnd: '#FB923C',
      secondary: '#FCA5A5',
    },
  },
  {
    key: 'orange',
    labelKey: 'templateConfig.schemeOrange',
    swatch: '#EA580C',
    light: {
      accent: '#EA580C',
      accentGradientStart: '#EA580C',
      accentGradientEnd: '#D97706',
      secondary: '#C2410C',
    },
    dark: {
      accent: '#FB923C',
      accentGradientStart: '#F97316',
      accentGradientEnd: '#FBBF24',
      secondary: '#FDBA74',
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
    key: 'teal',
    labelKey: 'templateConfig.schemeTeal',
    swatch: '#0D9488',
    light: {
      accent: '#0D9488',
      accentGradientStart: '#0D9488',
      accentGradientEnd: '#059669',
      secondary: '#0F766E',
    },
    dark: {
      accent: '#5EEAD4',
      accentGradientStart: '#2DD4BF',
      accentGradientEnd: '#34D399',
      secondary: '#99F6E4',
    },
  },
  {
    key: 'slate',
    labelKey: 'templateConfig.schemeSlate',
    swatch: '#475569',
    light: {
      accent: '#475569',
      accentGradientStart: '#475569',
      accentGradientEnd: '#6366F1',
      secondary: '#334155',
    },
    dark: {
      accent: '#94A3B8',
      accentGradientStart: '#64748B',
      accentGradientEnd: '#818CF8',
      secondary: '#CBD5E1',
    },
  },
]

export const DEFAULT_SCHEME_KEY = 'slate'

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

// --- Custom color helpers ---

function hexToHsl(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2
  if (max === min) return [0, 0, l]
  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  let h = 0
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6
  else if (max === g) h = ((b - r) / d + 2) / 6
  else h = ((r - g) / d + 4) / 6
  return [h * 360, s, l]
}

function hslToHex(h: number, s: number, l: number): string {
  h = ((h % 360) + 360) % 360
  const c = (1 - Math.abs(2 * l - 1)) * s
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = l - c / 2
  let r = 0, g = 0, b = 0
  if (h < 60) { r = c; g = x }
  else if (h < 120) { r = x; g = c }
  else if (h < 180) { g = c; b = x }
  else if (h < 240) { g = x; b = c }
  else if (h < 300) { r = x; b = c }
  else { r = c; b = x }
  const toHex = (v: number) => Math.round((v + m) * 255).toString(16).padStart(2, '0')
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase()
}

export function applyCustomColor(hex: string): void {
  if (!/^#[0-9A-Fa-f]{6}$/.test(hex)) return

  const [h, s, l] = hexToHsl(hex)

  // Light theme: use the color as-is for accent
  const lightAccent = hex
  const lightGradientEnd = hslToHex(h + 60, Math.max(s * 0.7, 0.3), Math.min(l + 0.05, 0.5))
  const lightSecondary = hslToHex(h + 30, s, Math.min(l + 0.05, 0.5))

  // Dark theme: lighten the color
  const darkAccent = hslToHex(h, Math.min(s + 0.1, 1), Math.min(l + 0.25, 0.75))
  const darkGradientEnd = hslToHex(h + 60, Math.max(s * 0.6, 0.3), Math.min(l + 0.3, 0.75))
  const darkSecondary = hslToHex(h + 30, Math.min(s + 0.1, 1), Math.min(l + 0.3, 0.8))

  updateTheme({
    name: 'light',
    theme: {
      accent: lightAccent,
      accentGradientStart: lightAccent,
      accentGradientEnd: lightGradientEnd,
      secondary: lightSecondary,
    },
  })

  updateTheme({
    name: 'dark',
    theme: {
      accent: darkAccent,
      accentGradientStart: darkAccent,
      accentGradientEnd: darkGradientEnd,
      secondary: darkSecondary,
    },
  })
}
