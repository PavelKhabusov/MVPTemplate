import { config } from '@tamagui/config/v3'
import { createTamagui, createTokens } from 'tamagui'

const brandColors = {
  primary: '#6366F1',
  primaryLight: '#818CF8',
  primaryDark: '#4F46E5',
  secondary: '#EC4899',
  secondaryLight: '#F472B6',
  secondaryDark: '#DB2777',
  accent: '#14B8A6',
  accentLight: '#2DD4BF',
  accentDark: '#0D9488',
  success: '#22C55E',
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
      background: '#FFFFFF',
      backgroundHover: '#F9FAFB',
      backgroundPress: '#F3F4F6',
      backgroundFocus: '#F9FAFB',
      color: '#111827',
      colorHover: '#1F2937',
      colorPress: '#374151',
      colorFocus: '#1F2937',
      borderColor: '#E5E7EB',
      borderColorHover: '#D1D5DB',
      placeholderColor: '#9CA3AF',
      primary: brandColors.primary,
      primaryLight: brandColors.primaryLight,
      secondary: brandColors.secondary,
      accent: brandColors.accent,
      success: brandColors.success,
      warning: brandColors.warning,
      error: brandColors.error,
      info: brandColors.info,
      cardBackground: '#FFFFFF',
      subtleBackground: '#F9FAFB',
      mutedText: '#6B7280',
    },
    dark: {
      ...config.themes.dark,
      background: '#0F172A',
      backgroundHover: '#1E293B',
      backgroundPress: '#334155',
      backgroundFocus: '#1E293B',
      color: '#F1F5F9',
      colorHover: '#E2E8F0',
      colorPress: '#CBD5E1',
      colorFocus: '#E2E8F0',
      borderColor: '#334155',
      borderColorHover: '#475569',
      placeholderColor: '#64748B',
      primary: brandColors.primaryLight,
      primaryLight: brandColors.primary,
      secondary: brandColors.secondaryLight,
      accent: brandColors.accentLight,
      success: brandColors.success,
      warning: brandColors.warning,
      error: '#F87171',
      info: '#60A5FA',
      cardBackground: '#1E293B',
      subtleBackground: '#1E293B',
      mutedText: '#94A3B8',
    },
  },
})

export type AppConfig = typeof tamaguiConfig

declare module 'tamagui' {
  interface TamaguiCustomConfig extends AppConfig {}
}

export default tamaguiConfig
