import { updateTheme } from '@tamagui/theme'
import type { RadiusScale, FontScale, CardStyle } from './store'

const RADIUS_VALUES: Record<RadiusScale, { sm: number; md: number; lg: number }> = {
  sharp:   { sm: 2, md: 4, lg: 6 },
  default: { sm: 8, md: 12, lg: 16 },
  rounded: { sm: 12, md: 20, lg: 28 },
  pill:    { sm: 50, md: 50, lg: 50 },
}

export function applyRadiusScale(scale: RadiusScale) {
  const r = RADIUS_VALUES[scale]
  const theme = { radiusSm: r.sm, radiusMd: r.md, radiusLg: r.lg }
  updateTheme({ name: 'light', theme })
  updateTheme({ name: 'dark', theme })
}

const CARD_STYLES: Record<CardStyle, { light: Record<string, string>; dark: Record<string, string> }> = {
  flat: {
    light: { cardShadow: 'transparent', cardBorder: 'transparent' },
    dark:  { cardShadow: 'transparent', cardBorder: 'transparent' },
  },
  bordered: {
    light: { cardShadow: 'transparent', cardBorder: 'rgba(0,0,0,0.15)' },
    dark:  { cardShadow: 'transparent', cardBorder: '#3F3F46' },
  },
  elevated: {
    light: { cardShadow: 'rgba(0,0,0,0.04)', cardBorder: 'rgba(0,0,0,0.06)' },
    dark:  { cardShadow: 'rgba(0,0,0,0.3)', cardBorder: '#27272A' },
  },
  glass: {
    light: { cardShadow: 'rgba(0,0,0,0.04)', cardBorder: 'rgba(255,255,255,0.3)', cardBackground: 'rgba(255,255,255,0.7)' },
    dark:  { cardShadow: 'rgba(0,0,0,0.3)', cardBorder: 'rgba(255,255,255,0.08)', cardBackground: 'rgba(24,24,27,0.8)' },
  },
}

const DEFAULT_CARD_BG = { light: '#FFFFFF', dark: '#18181B' }

export function applyCardStyle(style: CardStyle) {
  updateTheme({ name: 'light', theme: { ...CARD_STYLES[style].light, ...(!CARD_STYLES[style].light.cardBackground ? { cardBackground: DEFAULT_CARD_BG.light } : {}) } })
  updateTheme({ name: 'dark', theme: { ...CARD_STYLES[style].dark, ...(!CARD_STYLES[style].dark.cardBackground ? { cardBackground: DEFAULT_CARD_BG.dark } : {}) } })

  // Glass backdrop-filter via CSS injection
  const id = 'mvp-card-glass-css'
  let el = typeof document !== 'undefined' ? document.getElementById(id) as HTMLStyleElement | null : null
  if (style === 'glass') {
    if (!el && typeof document !== 'undefined') {
      el = document.createElement('style')
      el.id = id
      document.head.appendChild(el)
    }
    if (el) {
      el.textContent = '[data-mvp-glass] { backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); }'
    }
    document.documentElement?.setAttribute('data-mvp-glass', '')
  } else {
    el?.remove()
    document.documentElement?.removeAttribute('data-mvp-glass')
  }
}

const FONT_ZOOM: Record<FontScale, number> = {
  compact: 0.92,
  default: 1,
  large: 1.08,
}

export function getFontZoom(scale: FontScale): number {
  return FONT_ZOOM[scale]
}
