// Pull in tamagui config type augmentation for typed theme tokens
import type {} from '@mvp/ui'

export { TEMPLATE_FLAGS } from './flags'
export type { TemplateFlag } from './flags'
export { useTemplateConfigStore } from './store'
export type { WebLayout, UserBadgePlacement, HeaderNavAlign, ItemPlacement, SearchPlacement, RadiusScale, FontScale, FontFamily, CardStyle } from './store'
export { useTemplateFlag } from './useTemplateFlag'
export { TemplateConfigSidebar } from './TemplateConfigSidebar'
export { TemplateConfigButton } from './TemplateConfigButton'
export { APP_BRAND } from './brand'
export { COLOR_SCHEMES, DEFAULT_SCHEME_KEY, applyColorScheme, applyCustomColor } from './colorSchemes'
export { applyRadiusScale, applyCardStyle, applyFontFamily, getFontZoom, FONT_FAMILY_CONFIG } from './designTokens'
export type { ColorScheme, ColorSchemeValues } from './colorSchemes'
