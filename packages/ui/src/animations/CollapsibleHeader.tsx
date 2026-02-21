import { Platform, TouchableOpacity } from 'react-native'
import { YStack, XStack, Text, useTheme } from 'tamagui'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Animated, {
  useAnimatedStyle,
  interpolate,
  Extrapolation,
  type SharedValue,
} from 'react-native-reanimated'
import { AppAvatar } from '../components/AppAvatar'

const HEADER_EXPANDED = 260
const HEADER_COLLAPSED = 56
const SCROLL_RANGE = HEADER_EXPANDED - HEADER_COLLAPSED
const AVATAR_SIZE = 100

export { HEADER_EXPANDED, HEADER_COLLAPSED }

interface HeaderAction {
  label: string
  onPress: () => void
}

interface CollapsibleHeaderProps {
  scrollY: SharedValue<number>
  avatarUri?: string | null
  avatarName?: string
  userName: string
  userStatus?: string
  rightAction?: HeaderAction
}

export function CollapsibleHeader({
  scrollY,
  avatarUri,
  avatarName,
  userName,
  userStatus,
  rightAction,
}: CollapsibleHeaderProps) {
  const theme = useTheme()
  const insets = useSafeAreaInsets()

  if (Platform.OS === 'web') {
    return (
      <YStack
        backgroundColor="$cardBackground"
        paddingTop={24}
        paddingBottom="$4"
        alignItems="center"
        gap="$2"
        borderBottomWidth={0.5}
        borderBottomColor="$borderColor"
      >
        <AppAvatar uri={avatarUri} name={avatarName} size={AVATAR_SIZE} />
        <Text fontSize={22} fontWeight="bold" color="$color">{userName}</Text>
        {userStatus && <Text fontSize={15} color="$mutedText">{userStatus}</Text>}
      </YStack>
    )
  }

  const expandedHeight = HEADER_EXPANDED + insets.top
  const collapsedHeight = HEADER_COLLAPSED + insets.top

  // Positions when expanded (relative to top of safe area content)
  const safeTop = insets.top
  const avatarTopExpanded = safeTop + 24
  const nameTopExpanded = avatarTopExpanded + AVATAR_SIZE + 12
  const statusTopExpanded = nameTopExpanded + 28

  // Name position when collapsed: vertically centered in collapsed header
  const nameTopCollapsed = safeTop + (HEADER_COLLAPSED - 22) / 2

  const headerStyle = useAnimatedStyle(() => ({
    height: interpolate(
      scrollY.value,
      [0, SCROLL_RANGE],
      [expandedHeight, collapsedHeight],
      Extrapolation.CLAMP,
    ),
  }))

  // Avatar: fade out + scale down
  const avatarStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollY.value,
      [0, SCROLL_RANGE * 0.5],
      [1, 0],
      Extrapolation.CLAMP,
    )
    const scale = interpolate(
      scrollY.value,
      [0, SCROLL_RANGE * 0.6],
      [1, 0.5],
      Extrapolation.CLAMP,
    )
    return {
      position: 'absolute' as const,
      top: avatarTopExpanded,
      alignSelf: 'center' as const,
      opacity,
      transform: [{ scale }],
    }
  })

  // Name: moves from expanded position to collapsed center
  const nameStyle = useAnimatedStyle(() => {
    const top = interpolate(
      scrollY.value,
      [0, SCROLL_RANGE],
      [nameTopExpanded, nameTopCollapsed],
      Extrapolation.CLAMP,
    )
    const scale = interpolate(
      scrollY.value,
      [0, SCROLL_RANGE],
      [1, 17 / 22],
      Extrapolation.CLAMP,
    )
    return {
      position: 'absolute' as const,
      top,
      left: 0,
      right: 0,
      transform: [{ scale }],
    }
  })

  // Status: fade out early
  const statusStyle = useAnimatedStyle(() => ({
    position: 'absolute' as const,
    top: statusTopExpanded,
    left: 0,
    right: 0,
    opacity: interpolate(
      scrollY.value,
      [0, SCROLL_RANGE * 0.3],
      [1, 0],
      Extrapolation.CLAMP,
    ),
  }))

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 10,
          overflow: 'hidden',
          backgroundColor: theme.cardBackground.val,
          borderBottomWidth: 0.5,
          borderBottomColor: theme.borderColor.val,
        },
        headerStyle,
      ]}
    >
      {/* Right action button — always visible */}
      {rightAction && (
        <TouchableOpacity
          onPress={rightAction.onPress}
          activeOpacity={0.7}
          style={{
            position: 'absolute',
            top: safeTop + (HEADER_COLLAPSED - 34) / 2,
            right: 16,
            zIndex: 20,
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 16,
            backgroundColor: theme.subtleBackground.val,
          }}
        >
          <Text fontSize={15} fontWeight="600" color="$accent">
            {rightAction.label}
          </Text>
        </TouchableOpacity>
      )}

      {/* Avatar */}
      <Animated.View style={avatarStyle}>
        <AppAvatar uri={avatarUri} name={avatarName} size={AVATAR_SIZE} />
      </Animated.View>

      {/* Name — stays visible, moves to center of collapsed header */}
      <Animated.View style={nameStyle}>
        <Text fontSize={22} fontWeight="bold" color="$color" textAlign="center">
          {userName}
        </Text>
      </Animated.View>

      {/* Status */}
      <Animated.View style={statusStyle}>
        {userStatus && (
          <Text fontSize={15} color="$mutedText" textAlign="center">
            {userStatus}
          </Text>
        )}
      </Animated.View>
    </Animated.View>
  )
}
