import { Platform } from 'react-native'
import { Tabs, Slot, usePathname, router } from 'expo-router'
import { XStack, useTheme } from 'tamagui'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTranslation } from '@mvp/i18n'
import { WebSidebar, AnimatedTabIcon } from '@mvp/ui'

export default function TabsLayout() {
  const { t } = useTranslation()
  const theme = useTheme()
  const insets = useSafeAreaInsets()

  if (Platform.OS === 'web') {
    return <WebLayout />
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.accent.val,
        tabBarInactiveTintColor: theme.mutedText.val,
        tabBarStyle: {
          backgroundColor: theme.background.val,
          borderTopColor: theme.borderColor.val,
          paddingBottom: insets.bottom,
          height: 56 + insets.bottom,
        },
        sceneStyle: {
          backgroundColor: theme.background.val,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabs.home'),
          tabBarIcon: ({ color, focused }) => (
            <AnimatedTabIcon
              name="home-outline"
              nameFilled="home"
              focused={focused}
              color={color}
              animation="bounce"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: t('tabs.explore'),
          tabBarIcon: ({ color, focused }) => (
            <AnimatedTabIcon
              name="compass-outline"
              nameFilled="compass"
              focused={focused}
              color={color}
              animation="rotate"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('tabs.profile'),
          tabBarIcon: ({ color, focused }) => (
            <AnimatedTabIcon
              name="person-outline"
              nameFilled="person"
              focused={focused}
              color={color}
              animation="pop"
            />
          ),
        }}
      />
    </Tabs>
  )
}

function WebLayout() {
  const { t } = useTranslation()
  const pathname = usePathname()
  const theme = useTheme()

  const navItems = [
    { href: '/', label: t('tabs.home'), icon: 'home-outline' as const, iconFilled: 'home' as const },
    { href: '/explore', label: t('tabs.explore'), icon: 'compass-outline' as const, iconFilled: 'compass' as const },
    { href: '/profile', label: t('tabs.profile'), icon: 'person-outline' as const, iconFilled: 'person' as const },
    { href: '/settings', label: t('settings.title'), icon: 'settings-outline' as const, iconFilled: 'settings' as const },
  ]

  return (
    <XStack flex={1} backgroundColor="$background" style={{ height: '100vh' } as any}>
      <WebSidebar
        items={navItems}
        currentPath={pathname}
        onNavigate={(href) => router.push(href as any)}
      />
      <Slot />
    </XStack>
  )
}
