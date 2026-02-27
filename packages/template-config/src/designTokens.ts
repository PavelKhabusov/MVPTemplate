import { updateTheme } from '@tamagui/theme'
import type { RadiusScale, FontScale, FontFamily, CardStyle } from './store'

const RADIUS_VALUES: Record<RadiusScale, { sm: number; md: number; lg: number }> = {
  square:  { sm: 0, md: 0, lg: 0 },
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

// Font family definitions
const FONT_FAMILY_CONFIG: Record<FontFamily, { label: string; googleUrl: string | null; cssStack: string }> = {
  system: {
    label: 'System',
    googleUrl: null,
    cssStack: '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
  },
  inter: {
    label: 'Inter',
    googleUrl: null, // already bundled via @tamagui/font-inter
    cssStack: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  roboto: {
    label: 'Roboto',
    googleUrl: 'https://fonts.googleapis.com/css2?family=Roboto:wght@100;200;300;400;500;600;700;800;900&display=swap',
    cssStack: '"Roboto", -apple-system, sans-serif',
  },
  'open-sans': {
    label: 'Open Sans',
    googleUrl: 'https://fonts.googleapis.com/css2?family=Open+Sans:wght@300;400;500;600;700;800&display=swap',
    cssStack: '"Open Sans", -apple-system, sans-serif',
  },
  nunito: {
    label: 'Nunito',
    googleUrl: 'https://fonts.googleapis.com/css2?family=Nunito:wght@300;400;500;600;700;800;900&display=swap',
    cssStack: '"Nunito", -apple-system, sans-serif',
  },
  'dm-sans': {
    label: 'DM Sans',
    googleUrl: 'https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&display=swap',
    cssStack: '"DM Sans", -apple-system, sans-serif',
  },
  'space-grotesk': {
    label: 'Space Grotesk',
    googleUrl: 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&display=swap',
    cssStack: '"Space Grotesk", -apple-system, sans-serif',
  },
  montserrat: {
    label: 'Montserrat',
    googleUrl: 'https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700;800;900&display=swap',
    cssStack: '"Montserrat", -apple-system, sans-serif',
  },
  monospace: {
    label: 'Monospace',
    googleUrl: 'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;600;700;800&display=swap',
    cssStack: '"JetBrains Mono", "Fira Code", "SF Mono", Menlo, Monaco, "Courier New", monospace',
  },
}

export { FONT_FAMILY_CONFIG }

// How font switching works:
// expo-font loads Inter via CSS @font-face injected into a managed <style> tag.
// All Tamagui/RNW Text components render with fontFamily:'Inter'.
// Per CSS spec, the LAST @font-face rule for a given font-family+weight wins.
// We fetch the Google Fonts CSS and re-inject it with font-family:'Inter',
// so our rule comes last and overrides expo-font's Inter declaration.
// Icon fonts (Ionicons, MaterialIcons, etc.) use different font-family names — unaffected.
export async function applyFontFamily(family: FontFamily): Promise<void> {
  if (typeof document === 'undefined') return

  const OVERRIDE_ID = 'mvp-font-family-css'

  // Remove previous override so expo-font's Inter is active again
  document.getElementById(OVERRIDE_ID)?.remove()

  if (family === 'inter') return

  const config = FONT_FAMILY_CONFIG[family]
  const styleEl = document.createElement('style')
  styleEl.id = OVERRIDE_ID
  document.head.appendChild(styleEl)

  if (family === 'system') {
    styleEl.textContent = [
      `@font-face { font-family: 'Inter'; src: local('-apple-system'), local('BlinkMacSystemFont'), local('Segoe UI'), local('Helvetica Neue'), local('Arial'); font-weight: 100 900; font-style: normal; }`,
      `@font-face { font-family: 'Inter'; src: local('-apple-system'), local('BlinkMacSystemFont'), local('Segoe UI'), local('Helvetica Neue'), local('Arial'); font-weight: 100 900; font-style: italic; }`,
    ].join('\n')
    return
  }

  if (!config.googleUrl) return

  try {
    // Google Fonts returns browser-appropriate @font-face rules with woff2 src URLs
    const res = await fetch(config.googleUrl, { mode: 'cors' })
    const css = await res.text()
    // Rewrite every font-family declaration to 'Inter'.
    // Elements using fontFamily:'Inter' (Tamagui/RNW) now render with the chosen font.
    // Icon fonts use 'Ionicons', 'MaterialIcons', etc. — their @font-face is untouched.
    styleEl.textContent = css.replace(/font-family:\s*['"][^'"]+['"]/g, "font-family: 'Inter'")
  } catch {
    // Fallback on network error
    styleEl.textContent = `body { font-family: ${config.cssStack}; }`
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
