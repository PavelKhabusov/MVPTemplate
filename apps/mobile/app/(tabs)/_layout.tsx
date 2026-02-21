import { Platform } from 'react-native'
import { Tabs, Slot } from 'expo-router'
import { useTheme } from 'tamagui'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTranslation } from '@mvp/i18n'
import { AnimatedTabIcon } from '@mvp/ui'

export default function TabsLayout() {
  const { t } = useTranslation()
  const theme = useTheme()
  const insets = useSafeAreaInsets()

  if (Platform.OS === 'web') {
    return <Slot />
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
              size={24}
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
              size={24}
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
              size={24}
              animation="pop"
            />
          ),
        }}
      />
    </Tabs>
  )
}
