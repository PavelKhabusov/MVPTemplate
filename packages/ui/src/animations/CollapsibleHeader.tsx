import { Platform, TouchableOpacity } from 'react-native'
import { YStack, Text, useTheme } from 'tamagui'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import Animated, {
  useAnimatedStyle,
  interpolate,
  Extrapolation,
  type SharedValue,
} from 'react-native-reanimated'
import { AppAvatar } from '../components/AppAvatar'

const HEADER_EXPANDED = 100
const HEADER_COLLAPSED = 56
const SCROLL_RANGE = HEADER_EXPANDED - HEADER_COLLAPSED
const AVATAR_SIZE = 80

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

  const safeTop = insets.top
  const avatarTopExpanded = safeTop + 16
  const nameTopExpanded = avatarTopExpanded + AVATAR_SIZE + 10
  const statusTopExpanded = nameTopExpanded + 26

  const nameTopCollapsed = safeTop + (HEADER_COLLAPSED - 20) / 2

  const headerStyle = useAnimatedStyle(() => ({
    height: interpolate(
      scrollY.value,
      [0, SCROLL_RANGE],
      [expandedHeight, collapsedHeight],
      Extrapolation.CLAMP,
    ),
  }))

  // Gradient fades out on scroll
  const gradientStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      scrollY.value,
      [0, SCROLL_RANGE * 0.6],
      [1, 0],
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
      {/* Accent gradient — fades on scroll */}
      <Animated.View
        style={[
          { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
          gradientStyle,
        ]}
      >
        <LinearGradient
          colors={[theme.accent.val, 'transparent']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={{ flex: 1, opacity: 0.15 }}
        />
      </Animated.View>

      {/* Right action button */}
      {rightAction && (
        <TouchableOpacity
          onPress={rightAction.onPress}
          activeOpacity={0.7}
          style={{
            position: 'absolute',
            top: safeTop + (HEADER_COLLAPSED - 22) / 2,
            right: 16,
            zIndex: 20,
          }}
        >
          <Text fontSize={17} color="$accent">
            {rightAction.label}
          </Text>
        </TouchableOpacity>
      )}

      {/* Avatar */}
      <Animated.View style={avatarStyle}>
        <AppAvatar uri={avatarUri} name={avatarName} size={AVATAR_SIZE} />
      </Animated.View>

      {/* Name */}
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
