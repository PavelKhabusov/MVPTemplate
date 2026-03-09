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
      { id: 'install', titleKey: 'docs.pageInstall', contentKey: 'docs.contentInstall' },
      { id: 'setup', titleKey: 'docs.pageSetup', contentKey: 'docs.contentSetup' },
      { id: 'connect-voximplant', titleKey: 'docs.pageConnectVoximplant', contentKey: 'docs.contentConnectVoximplant' },
    ],
  },
  {
    id: 'using',
    titleKey: 'docs.groupUsing',
    icon: 'call-outline',
    pages: [
      { id: 'make-calls', titleKey: 'docs.pageMakeCalls', contentKey: 'docs.contentMakeCalls' },
      { id: 'column-mapping', titleKey: 'docs.pageColumnMapping', contentKey: 'docs.contentColumnMapping' },
      { id: 'call-history', titleKey: 'docs.pageCallHistory', contentKey: 'docs.contentCallHistory' },
    ],
  },
  {
    id: 'billing',
    titleKey: 'docs.groupBilling',
    icon: 'card-outline',
    pages: [
      { id: 'plans', titleKey: 'docs.pagePlans', contentKey: 'docs.contentPlans' },
      { id: 'upgrade', titleKey: 'docs.pageUpgrade', contentKey: 'docs.contentUpgrade' },
    ],
  },
  {
    id: 'faq',
    titleKey: 'docs.groupFaq',
    icon: 'help-circle-outline',
    pages: [
      { id: 'faq-general', titleKey: 'docs.pageFaqGeneral', contentKey: 'docs.contentFaqGeneral' },
      { id: 'faq-voximplant', titleKey: 'docs.pageFaqVoximplant', contentKey: 'docs.contentFaqVoximplant' },
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