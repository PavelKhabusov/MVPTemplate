// Pull in tamagui config type augmentation for typed theme tokens
import type {} from '@mvp/ui'

export { TEMPLATE_FLAGS } from './flags'
export type { TemplateFlag } from './flags'
export { useTemplateConfigStore } from './store'
export { useTemplateFlag } from './useTemplateFlag'
export { TemplateConfigSidebar } from './TemplateConfigSidebar'
export { TemplateConfigButton } from './TemplateConfigButton'
export { COLOR_SCHEMES, DEFAULT_SCHEME_KEY, applyColorScheme } from './colorSchemes'
export type { ColorScheme, ColorSchemeValues } from './colorSchemes'
