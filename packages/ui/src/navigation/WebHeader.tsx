import { Image, Platform } from 'react-native'
import { XStack, YStack, Text, useTheme } from 'tamagui'
import { Ionicons } from '@expo/vector-icons'
import { useIsMobileWeb } from './WebSidebar'

interface NavItem {
  href: string
  label: string
  icon: keyof typeof Ionicons.glyphMap
  iconFilled: keyof typeof Ionicons.glyphMap
}

interface WebHeaderProps {
  items: NavItem[]
  currentPath: string
  onNavigate: (href: string) => void
  logo?: any
  title?: string
  rightContent?: React.ReactNode
}

export function WebHeader({ items, currentPath, onNavigate, logo, title = 'MVP Template', rightContent }: WebHeaderProps) {
  const theme = useTheme()
  const isMobile = useIsMobileWeb()

  if (Platform.OS !== 'web' || isMobile) return null

  return (
    <XStack
      backgroundColor="$sidebarBg"
      borderBottomWidth={1}
      borderBottomColor="$sidebarBorder"
      paddingHorizontal="$4"
      alignItems="center"
      justifyContent="space-between"
      height={56}
      style={{ position: 'sticky', top: 0, zIndex: 50, flexShrink: 0 } as any}
    >
      {/* Left: Logo + Title */}
      <XStack
        alignItems="center"
        gap="$3"
        cursor="pointer"
        hoverStyle={{ opacity: 0.8 }}
        onPress={() => onNavigate('/landing')}
      >
        {logo ? (
          <Image source={logo} style={{ width: 32, height: 32, borderRadius: 8 }} />
        ) : (
          <YStack
            width={32}
            height={32}
            borderRadius={8}
            alignItems="center"
            justifyContent="center"
            style={{
              background: `linear-gradient(135deg, ${theme.accentGradientStart.val}, ${theme.accentGradientEnd.val})`,
            }}
          >
            <Text color="white" fontWeight="bold" fontSize="$3">M</Text>
          </YStack>
        )}
        <Text fontWeight="bold" fontSize="$4" color="$color" numberOfLines={1}>
          {title}
        </Text>
      </XStack>

      {/* Center: Navigation */}
      <XStack gap="$1" alignItems="center" role="navigation" aria-label="Main navigation">
        {items.map((item) => {
          const isActive = currentPath === item.href ||
            (item.href !== '/' && currentPath.startsWith(item.href))
          return (
            <HeaderNavItem
              key={item.href}
              item={item}
              isActive={isActive}
              onPress={() => onNavigate(item.href)}
            />
          )
        })}
      </XStack>

      {/* Right: Custom content (ThemeToggle, avatar, etc.) */}
      <XStack alignItems="center" gap="$3">
        {rightContent}
      </XStack>
    </XStack>
  )
}

function HeaderNavItem({
  item,
  isActive,
  onPress,
}: {
  item: NavItem
  isActive: boolean
  onPress: () => void
}) {
  const theme = useTheme()

  return (
    <XStack
      position="relative"
      paddingVertical="$2"
      paddingHorizontal="$3"
      borderRadius="$3"
      alignItems="center"
      gap="$2"
      backgroundColor={isActive ? '$backgroundHover' : 'transparent'}
      hoverStyle={{ backgroundColor: '$backgroundHover' }}
      cursor="pointer"
      onPress={onPress}
      role="link"
      aria-current={isActive ? 'page' : undefined}
      aria-label={item.label}
    >
      <Ionicons
        name={isActive ? item.iconFilled : item.icon}
        size={18}
        color={isActive ? theme.accent.val : theme.mutedText.val}
      />
      <Text
        color={isActive ? '$color' : '$mutedText'}
        fontWeight={isActive ? '600' : '400'}
        fontSize="$2"
        numberOfLines={1}
      >
        {item.label}
      </Text>
      {/* Active indicator — bottom accent bar */}
      {isActive && (
        <YStack
          position="absolute"
          bottom={-1}
          left={8}
          right={8}
          height={2}
          borderRadius={1}
          style={{
            background: `linear-gradient(90deg, ${theme.accentGradientStart.val}, ${theme.accentGradientEnd.val})`,
          }}
        />
      )}
    </XStack>
  )
}
