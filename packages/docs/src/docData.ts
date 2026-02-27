import { Ionicons } from '@expo/vector-icons'

export interface DocPage {
  id: string
  titleKey: string
  contentKey: string
}

export interface DocGroup {
  id: string
  titleKey: string
  icon: keyof typeof Ionicons.glyphMap
  pages: DocPage[]
}

export const DOC_GROUPS: DocGroup[] = [
  {
    id: 'getting-started',
    titleKey: 'docs.groupGettingStarted',
    icon: 'rocket-outline',
    pages: [
      { id: 'quick-start', titleKey: 'docs.pageQuickStart', contentKey: 'docs.contentQuickStart' },
      { id: 'prerequisites', titleKey: 'docs.pagePrerequisites', contentKey: 'docs.contentPrerequisites' },
      { id: 'project-structure', titleKey: 'docs.pageProjectStructure', contentKey: 'docs.contentProjectStructure' },
    ],
  },
  {
    id: 'configuration',
    titleKey: 'docs.groupConfiguration',
    icon: 'construct-outline',
    pages: [
      { id: 'env-vars', titleKey: 'docs.pageEnvVars', contentKey: 'docs.contentEnvVars' },
      { id: 'database-setup', titleKey: 'docs.pageDatabaseSetup', contentKey: 'docs.contentDatabaseSetup' },
      { id: 'auth', titleKey: 'docs.pageAuth', contentKey: 'docs.contentAuth' },
    ],
  },
  {
    id: 'features',
    titleKey: 'docs.groupFeatures',
    icon: 'sparkles-outline',
    pages: [
      { id: 'theming', titleKey: 'docs.pageTheming', contentKey: 'docs.contentTheming' },
      { id: 'i18n', titleKey: 'docs.pageI18n', contentKey: 'docs.contentI18n' },
      { id: 'push-notifications', titleKey: 'docs.pagePushNotifications', contentKey: 'docs.contentPushNotifications' },
      { id: 'email', titleKey: 'docs.pageEmail', contentKey: 'docs.contentEmail' },
      { id: 'payments', titleKey: 'docs.pagePayments', contentKey: 'docs.contentPayments' },
      { id: 'onboarding', titleKey: 'docs.pageOnboarding', contentKey: 'docs.contentOnboarding' },
    ],
  },
  {
    id: 'deployment',
    titleKey: 'docs.groupDeployment',
    icon: 'cloud-upload-outline',
    pages: [
      { id: 'build-production', titleKey: 'docs.pageBuildProduction', contentKey: 'docs.contentBuildProduction' },
      { id: 'docker', titleKey: 'docs.pageDocker', contentKey: 'docs.contentDocker' },
    ],
  },
  {
    id: 'customization',
    titleKey: 'docs.groupCustomization',
    icon: 'color-palette-outline',
    pages: [
      { id: 'add-screens', titleKey: 'docs.pageAddScreens', contentKey: 'docs.contentAddScreens' },
      { id: 'styling', titleKey: 'docs.pageStyling', contentKey: 'docs.contentStyling' },
    ],
  },
]

export function getPageById(pageId: string) {
  for (const group of DOC_GROUPS) {
    const page = group.pages.find((p) => p.id === pageId)
    if (page) return page
  }
  return null
}
