export interface TemplateFlag {
  key: string
  labelKey: string
  icon: string
  defaultValue: boolean
  scope: 'frontend' | 'backend' | 'both'
  envVar?: string
  envType?: 'boolean' | 'secret'
}

export const TEMPLATE_FLAGS: TemplateFlag[] = [
  { key: 'docs', labelKey: 'templateConfig.docs', icon: 'book-open', defaultValue: true, scope: 'frontend', envVar: 'EXPO_PUBLIC_DOCS_ENABLED', envType: 'boolean' },
  { key: 'email', labelKey: 'templateConfig.email', icon: 'mail', defaultValue: false, scope: 'both', envVar: 'EMAIL_ENABLED', envType: 'boolean' },
  { key: 'emailVerification', labelKey: 'templateConfig.emailVerification', icon: 'check-circle', defaultValue: false, scope: 'backend', envVar: 'EMAIL_VERIFICATION_REQUIRED', envType: 'boolean' },
  { key: 'googleAuth', labelKey: 'templateConfig.googleAuth', icon: 'google', defaultValue: false, scope: 'both', envVar: 'GOOGLE_CLIENT_ID', envType: 'secret' },
  { key: 'requestLogging', labelKey: 'templateConfig.requestLogging', icon: 'terminal', defaultValue: false, scope: 'backend', envVar: 'REQUEST_LOGGING', envType: 'boolean' },
  { key: 'analytics', labelKey: 'templateConfig.analytics', icon: 'bar-chart', defaultValue: true, scope: 'backend', envVar: 'ANALYTICS_ENABLED', envType: 'boolean' },
  { key: 'posthog', labelKey: 'templateConfig.posthog', icon: 'trending-up', defaultValue: false, scope: 'both', envVar: 'EXPO_PUBLIC_POSTHOG_KEY', envType: 'secret' },
  { key: 'cookieBanner', labelKey: 'templateConfig.cookieBanner', icon: 'info', defaultValue: true, scope: 'frontend', envVar: 'EXPO_PUBLIC_COOKIE_BANNER', envType: 'boolean' },
  { key: 'docFeedback', labelKey: 'templateConfig.docFeedback', icon: 'message-circle', defaultValue: true, scope: 'frontend' },
  { key: 'pushNotifications', labelKey: 'templateConfig.pushNotifications', icon: 'bell', defaultValue: false, scope: 'backend', envVar: 'EXPO_ACCESS_TOKEN', envType: 'secret' },
  { key: 'payments', labelKey: 'templateConfig.payments', icon: 'credit-card', defaultValue: false, scope: 'both', envVar: 'PAYMENTS_ENABLED', envType: 'boolean' },
  { key: 'onboarding', labelKey: 'templateConfig.onboarding', icon: 'compass', defaultValue: true, scope: 'frontend', envVar: 'EXPO_PUBLIC_ONBOARDING_ENABLED', envType: 'boolean' },
  { key: 'ai', labelKey: 'templateConfig.ai', icon: 'sparkles', defaultValue: true, scope: 'backend', envVar: 'GEMINI_API_KEY', envType: 'secret' },
]
