import { useState } from 'react'
import { Platform } from 'react-native'
import { XStack, YStack, Text, useTheme } from 'tamagui'
import { Ionicons } from '@expo/vector-icons'
import { MotiView } from 'moti'

interface NavItem {
  href: string
  label: string
  icon: keyof typeof Ionicons.glyphMap
  iconFilled: keyof typeof Ionicons.glyphMap
}

interface WebSidebarProps {
  items: NavItem[]
  currentPath: string
  onNavigate: (href: string) => void
  footer?: React.ReactNode
}

export function WebSidebar({ items, currentPath, onNavigate, footer }: WebSidebarProps) {
  const [collapsed, setCollapsed] = useState(false)
  const theme = useTheme()

  if (Platform.OS !== 'web') return null

  const width = collapsed ? 72 : 240

  return (
    <MotiView
      animate={{ width }}
      transition={{ type: 'timing', duration: 200 }}
      style={{
        height: '100%',
        backgroundColor: theme.sidebarBg.val,
        borderRightWidth: 1,
        borderRightColor: theme.sidebarBorder.val,
        overflow: 'hidden',
        flexShrink: 0,
      }}
    >
      <YStack flex={1} paddingVertical="$3">
        {/* Logo / Brand */}
        <XStack
          paddingHorizontal="$3"
          paddingVertical="$3"
          marginBottom="$2"
          alignItems="center"
          gap="$3"
        >
          <YStack
            width={36}
            height={36}
            borderRadius={10}
            alignItems="center"
            justifyContent="center"
            style={{
              background: `linear-gradient(135deg, ${theme.accentGradientStart.val}, ${theme.accentGradientEnd.val})`,
            }}
          >
            <Text color="white" fontWeight="bold" fontSize="$4">
              M
            </Text>
          </YStack>
          {!collapsed && (
            <Text fontWeight="bold" fontSize="$4" color="$color" numberOfLines={1}>
              MVP App
            </Text>
          )}
        </XStack>

        {/* Navigation Items */}
        <YStack gap="$1" paddingHorizontal="$2" flex={1}>
          {items.map((item) => {
            const isActive = currentPath === item.href ||
              (item.href !== '/' && currentPath.startsWith(item.href))
            return (
              <SidebarItem
                key={item.href}
                item={item}
                isActive={isActive}
                collapsed={collapsed}
                onPress={() => onNavigate(item.href)}
              />
            )
          })}
        </YStack>

        {/* Footer (user info, etc.) */}
        {footer && (
          <YStack paddingHorizontal="$2" paddingBottom="$2">
            {footer}
          </YStack>
        )}

        {/* Collapse Toggle */}
        <YStack paddingHorizontal="$2" paddingBottom="$2">
          <XStack
            paddingVertical="$2"
            paddingHorizontal="$3"
            borderRadius="$3"
            alignItems="center"
            justifyContent={collapsed ? 'center' : 'flex-start'}
            gap="$3"
            hoverStyle={{ backgroundColor: '$backgroundHover' }}
            cursor="pointer"
            onPress={() => setCollapsed(!collapsed)}
          >
            <Ionicons
              name={collapsed ? 'chevron-forward' : 'chevron-back'}
              size={18}
              color={theme.mutedText.val}
            />
            {!collapsed && (
              <Text color="$mutedText" fontSize="$2">
                Collapse
              </Text>
            )}
          </XStack>
        </YStack>
      </YStack>
    </MotiView>
  )
}

function SidebarItem({
  item,
  isActive,
  collapsed,
  onPress,
}: {
  item: NavItem
  isActive: boolean
  collapsed: boolean
  onPress: () => void
}) {
  const theme = useTheme()

  return (
    <XStack
      paddingVertical="$2.5"
      paddingHorizontal="$3"
      borderRadius="$3"
      alignItems="center"
      justifyContent={collapsed ? 'center' : 'flex-start'}
      gap="$3"
      backgroundColor={isActive ? '$backgroundHover' : 'transparent'}
      hoverStyle={{ backgroundColor: '$backgroundHover' }}
      cursor="pointer"
      onPress={onPress}
    >
      <Ionicons
        name={isActive ? item.iconFilled : item.icon}
        size={20}
        color={isActive ? theme.accent.val : theme.mutedText.val}
      />
      {!collapsed && (
        <Text
          color={isActive ? '$color' : '$mutedText'}
          fontWeight={isActive ? '600' : '400'}
          fontSize="$3"
          numberOfLines={1}
        >
          {item.label}
        </Text>
      )}
      {isActive && !collapsed && (
        <YStack
          position="absolute"
          left={0}
          top="25%"
          bottom="25%"
          width={3}
          borderRadius={2}
          style={{
            background: `linear-gradient(180deg, ${theme.accentGradientStart.val}, ${theme.accentGradientEnd.val})`,
          }}
        />
      )}
    </XStack>
  )
}
