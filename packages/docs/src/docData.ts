export interface DocPage {
  id: string
  titleKey: string
  contentKey: string
}

export interface DocGroup {
  id: string
  titleKey: string
  icon: string
  pages: DocPage[]
}

export const DOC_GROUPS: DocGroup[] = [
  {
    id: 'getting-started',
    titleKey: 'docs.groupGettingStarted',
    icon: 'rocket',
    pages: [
      { id: 'install', titleKey: 'docs.pageInstall', contentKey: 'docs.contentInstall' },
      { id: 'setup', titleKey: 'docs.pageSetup', contentKey: 'docs.contentSetup' },
    ],
  },
  {
    id: 'using',
    titleKey: 'docs.groupUsing',
    icon: 'book-open',
    pages: [
      { id: 'features', titleKey: 'docs.pageFeatures', contentKey: 'docs.contentFeatures' },
    ],
  },
  {
    id: 'billing',
    titleKey: 'docs.groupBilling',
    icon: 'credit-card',
    pages: [
      { id: 'plans', titleKey: 'docs.pagePlans', contentKey: 'docs.contentPlans' },
      { id: 'upgrade', titleKey: 'docs.pageUpgrade', contentKey: 'docs.contentUpgrade' },
    ],
  },
  {
    id: 'faq',
    titleKey: 'docs.groupFaq',
    icon: 'help-circle',
    pages: [
      { id: 'faq-general', titleKey: 'docs.pageFaqGeneral', contentKey: 'docs.contentFaqGeneral' },
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
