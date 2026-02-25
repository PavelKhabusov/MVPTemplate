import { config } from '@tamagui/config/v3'
import { createTamagui, createTokens } from 'tamagui'

const brandColors = {
  // Accent — electric cyan
  primary: '#00D4FF',
  primaryLight: '#38E8FF',
  primaryDark: '#00A3CC',
  // Secondary — violet/purple
  secondary: '#A855F7',
  secondaryLight: '#C084FC',
  secondaryDark: '#7C3AED',
  // Accent warm — neon orange
  accent: '#FF6B35',
  accentLight: '#FF8F66',
  accentDark: '#E5541A',
  // Semantic
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
}

const tokens = createTokens({
  ...config.tokens,
  color: {
    ...config.tokens.color,
    ...brandColors,
  },
})

const tamaguiConfig = createTamagui({
  ...config,
  tokens,
  themes: {
    ...config.themes,
    light: {
      ...config.themes.light,
      background: '#FAFAFA',
      backgroundHover: '#F5F5F5',
      backgroundPress: '#EFEFEF',
      backgroundFocus: '#F5F5F5',
      color: '#0A0A0A',
      colorHover: '#171717',
      colorPress: '#262626',
      colorFocus: '#171717',
      borderColor: '#E5E5E5',
      borderColorHover: '#D4D4D4',
      placeholderColor: '#A3A3A3',
      primary: '#0A0A0A',
      primaryLight: '#404040',
      secondary: brandColors.secondaryDark,
      accent: '#0891B2',
      success: '#059669',
      warning: '#D97706',
      error: brandColors.error,
      info: '#2563EB',
      cardBackground: '#FFFFFF',
      subtleBackground: '#F5F5F5',
      mutedText: '#737373',
      surfaceGlass: 'rgba(255,255,255,0.7)',
      sidebarBg: '#FFFFFF',
      sidebarBorder: '#E5E5E5',
      cardBorder: 'rgba(0,0,0,0.06)',
      cardShadow: 'rgba(0,0,0,0.04)',
      accentGradientStart: '#0891B2',
      accentGradientEnd: brandColors.secondaryDark,
      radiusSm: 8,
      radiusMd: 12,
      radiusLg: 16,
    },
    dark: {
      ...config.themes.dark,
      background: '#09090B',
      backgroundHover: '#18181B',
      backgroundPress: '#27272A',
      backgroundFocus: '#18181B',
      color: '#FAFAFA',
      colorHover: '#F4F4F5',
      colorPress: '#E4E4E7',
      colorFocus: '#F4F4F5',
      borderColor: '#27272A',
      borderColorHover: '#3F3F46',
      placeholderColor: '#71717A',
      primary: '#FAFAFA',
      primaryLight: '#D4D4D8',
      secondary: brandColors.secondaryLight,
      accent: brandColors.primaryLight,
      success: brandColors.success,
      warning: brandColors.warning,
      error: '#F87171',
      info: '#60A5FA',
      cardBackground: '#18181B',
      subtleBackground: '#18181B',
      mutedText: '#A1A1AA',
      surfaceGlass: 'rgba(24,24,27,0.8)',
      sidebarBg: '#111113',
      sidebarBorder: '#27272A',
      cardBorder: '#27272A',
      cardShadow: 'rgba(0,0,0,0.3)',
      accentGradientStart: brandColors.primary,
      accentGradientEnd: brandColors.secondary,
      radiusSm: 8,
      radiusMd: 12,
      radiusLg: 16,
    },
  },
})

export type AppConfig = typeof tamaguiConfig

declare module 'tamagui' {
  interface TamaguiCustomConfig extends AppConfig {}
}

export default tamaguiConfig
