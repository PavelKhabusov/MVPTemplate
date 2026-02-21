import { useEffect, useRef, useState } from 'react'
import { Platform, StyleSheet } from 'react-native'
import { XStack, YStack, Text, useTheme } from 'tamagui'
import { Ionicons } from '@expo/vector-icons'
import { MotiView } from 'moti'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  Easing,
  interpolate,
} from 'react-native-reanimated'

type AnimationType = 'bounce' | 'rotate' | 'wiggle' | 'pop' | 'bell'

interface NavItem {
  href: string
  label: string
  icon: keyof typeof Ionicons.glyphMap
  iconFilled: keyof typeof Ionicons.glyphMap
  animation?: AnimationType
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
        <YStack gap="$1" paddingHorizontal="$2" flex={1} role="navigation" aria-label="Main navigation">
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

const springConfig = { damping: 8, stiffness: 200, mass: 0.6 }

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
  const progress = useSharedValue(0)
  const prevActive = useRef(isActive)
  const animation = item.animation ?? 'bounce'

  useEffect(() => {
    if (isActive && !prevActive.current) {
      switch (animation) {
        case 'bounce':
          progress.value = 0
          progress.value = withSpring(1, springConfig)
          break
        case 'rotate':
          progress.value = 0
          progress.value = withSequence(
            withTiming(1, { duration: 300, easing: Easing.out(Easing.back(2)) }),
            withTiming(0, { duration: 0 }),
          )
          break
        case 'wiggle':
          progress.value = 0
          progress.value = withSequence(
            withTiming(1, { duration: 80 }),
            withTiming(-1, { duration: 80 }),
            withTiming(0.5, { duration: 80 }),
            withTiming(-0.5, { duration: 80 }),
            withTiming(0, { duration: 80 }),
          )
          break
        case 'pop':
          progress.value = 0
          progress.value = withSequence(
            withSpring(1.3, { damping: 6, stiffness: 300, mass: 0.5 }),
            withSpring(1, { damping: 10, stiffness: 200 }),
          )
          break
        case 'bell':
          progress.value = 0
          progress.value = withSequence(
            withTiming(1, { duration: 60 }),
            withTiming(-1, { duration: 100 }),
            withTiming(0.7, { duration: 80 }),
            withTiming(-0.7, { duration: 80 }),
            withTiming(0.3, { duration: 60 }),
            withTiming(0, { duration: 60 }),
          )
          break
      }
    }
    if (!isActive && prevActive.current) {
      progress.value = withTiming(0, { duration: 150 })
    }
    prevActive.current = isActive
  }, [isActive])

  const iconAnimStyle = useAnimatedStyle(() => {
    switch (animation) {
      case 'bounce':
        return {
          transform: [
            { scale: interpolate(progress.value, [0, 0.5, 1], [1, 1.25, 1]) },
            { translateY: interpolate(progress.value, [0, 0.4, 1], [0, -3, 0]) },
          ],
        }
      case 'rotate':
        return {
          transform: [
            { rotate: `${interpolate(progress.value, [0, 1], [0, 360])}deg` },
            { scale: interpolate(progress.value, [0, 0.5, 1], [1, 1.15, 1]) },
          ],
        }
      case 'wiggle':
        return {
          transform: [{ rotate: `${progress.value * 15}deg` }],
        }
      case 'pop':
        return {
          transform: [
            { scale: progress.value === 0 ? 1 : progress.value },
          ],
        }
      case 'bell':
        return {
          transform: [
            { rotate: `${progress.value * 20}deg` },
            { scale: isActive ? 1 : interpolate(progress.value, [-1, 0, 1], [1.05, 1, 1.05]) },
          ],
        }
      default:
        return {}
    }
  })

  return (
    <XStack
      position="relative"
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
      role="link"
      aria-current={isActive ? 'page' : undefined}
      aria-label={item.label}
    >
      <Animated.View style={[styles.iconContainer, iconAnimStyle]}>
        <Ionicons
          name={isActive ? item.iconFilled : item.icon}
          size={20}
          color={isActive ? theme.accent.val : theme.mutedText.val}
        />
      </Animated.View>
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
          top={4}
          bottom={4}
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

const styles = StyleSheet.create({
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
})
