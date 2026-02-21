import type { Ionicons } from '@expo/vector-icons'

export interface TemplateFlag {
  key: string
  labelKey: string
  icon: keyof typeof Ionicons.glyphMap
  defaultValue: boolean
  scope: 'frontend' | 'backend' | 'both'
}

export const TEMPLATE_FLAGS: TemplateFlag[] = [
  { key: 'docs', labelKey: 'templateConfig.docs', icon: 'book-outline', defaultValue: true, scope: 'frontend' },
  { key: 'email', labelKey: 'templateConfig.email', icon: 'mail-outline', defaultValue: false, scope: 'both' },
  { key: 'emailVerification', labelKey: 'templateConfig.emailVerification', icon: 'checkmark-circle-outline', defaultValue: false, scope: 'backend' },
  { key: 'googleAuth', labelKey: 'templateConfig.googleAuth', icon: 'logo-google', defaultValue: false, scope: 'both' },
  { key: 'requestLogging', labelKey: 'templateConfig.requestLogging', icon: 'terminal-outline', defaultValue: false, scope: 'backend' },
  { key: 'analytics', labelKey: 'templateConfig.analytics', icon: 'bar-chart-outline', defaultValue: true, scope: 'both' },
  { key: 'cookieBanner', labelKey: 'templateConfig.cookieBanner', icon: 'information-circle-outline', defaultValue: true, scope: 'frontend' },
  { key: 'pushNotifications', labelKey: 'templateConfig.pushNotifications', icon: 'notifications-outline', defaultValue: false, scope: 'backend' },
]
