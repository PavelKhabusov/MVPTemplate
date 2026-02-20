import { Ionicons } from '@expo/vector-icons'

export type TabConfig = {
  name: string
  titleKey: string // i18n key
  icon: keyof typeof Ionicons.glyphMap
  iconFocused: keyof typeof Ionicons.glyphMap
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
    name: 'profile',
    titleKey: 'tabs.profile',
    icon: 'person-outline',
    iconFocused: 'person',
  },
]
