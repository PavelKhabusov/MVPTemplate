import type { Ionicons } from '@expo/vector-icons'

export interface TemplateFlag {
  key: string
  labelKey: string
  icon: keyof typeof Ionicons.glyphMap
  defaultValue: boolean
  scope: 'frontend' | 'backend' | 'both'
  envVar?: string
  envType?: 'boolean' | 'secret'
}

export const TEMPLATE_FLAGS: TemplateFlag[] = [
  { key: 'docs', labelKey: 'templateConfig.docs', icon: 'book-outline', defaultValue: true, scope: 'frontend', envVar: 'EXPO_PUBLIC_DOCS_ENABLED', envType: 'boolean' },
  { key: 'email', labelKey: 'templateConfig.email', icon: 'mail-outline', defaultValue: false, scope: 'both', envVar: 'EMAIL_ENABLED', envType: 'boolean' },
  { key: 'emailVerification', labelKey: 'templateConfig.emailVerification', icon: 'checkmark-circle-outline', defaultValue: false, scope: 'backend', envVar: 'EMAIL_VERIFICATION_REQUIRED', envType: 'boolean' },
  { key: 'googleAuth', labelKey: 'templateConfig.googleAuth', icon: 'logo-google', defaultValue: false, scope: 'both', envVar: 'GOOGLE_CLIENT_ID', envType: 'secret' },
  { key: 'requestLogging', labelKey: 'templateConfig.requestLogging', icon: 'terminal-outline', defaultValue: false, scope: 'backend', envVar: 'REQUEST_LOGGING', envType: 'boolean' },
  { key: 'analytics', labelKey: 'templateConfig.analytics', icon: 'bar-chart-outline', defaultValue: true, scope: 'backend', envVar: 'ANALYTICS_ENABLED', envType: 'boolean' },
  { key: 'posthog', labelKey: 'templateConfig.posthog', icon: 'stats-chart-outline', defaultValue: false, scope: 'both', envVar: 'EXPO_PUBLIC_POSTHOG_KEY', envType: 'secret' },
  { key: 'cookieBanner', labelKey: 'templateConfig.cookieBanner', icon: 'information-circle-outline', defaultValue: true, scope: 'frontend', envVar: 'EXPO_PUBLIC_COOKIE_BANNER', envType: 'boolean' },
  { key: 'docFeedback', labelKey: 'templateConfig.docFeedback', icon: 'chatbubble-outline', defaultValue: true, scope: 'both' },
  { key: 'pushNotifications', labelKey: 'templateConfig.pushNotifications', icon: 'notifications-outline', defaultValue: false, scope: 'backend', envVar: 'EXPO_ACCESS_TOKEN', envType: 'secret' },
  { key: 'payments', labelKey: 'templateConfig.payments', icon: 'card-outline', defaultValue: false, scope: 'both', envVar: 'PAYMENTS_ENABLED', envType: 'boolean' },
]
