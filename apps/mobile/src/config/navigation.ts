export type TabConfig = {
  name: string
  titleKey: string // i18n key
  icon: string
  iconFocused: string
}

export const TABS: TabConfig[] = [
  {
    name: 'index',
    titleKey: 'tabs.home',
    icon: 'home-outline',
    iconFocused: 'home',
  },
  {
    name: 'explore',
    titleKey: 'tabs.explore',
    icon: 'compass-outline',
    iconFocused: 'compass',
  },
  {
    name: 'settings',
    titleKey: 'settings.title',
    icon: 'settings-outline',
    iconFocused: 'settings',
  },
]
