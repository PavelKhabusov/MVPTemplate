import { Platform } from 'react-native'
import { YStack, Text, useTheme } from 'tamagui'
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

interface CollapsibleHeaderProps {
  scrollY: SharedValue<number>
  avatarUri?: string | null
  avatarName?: string
  userName: string
  userStatus?: string
}

export function CollapsibleHeader({
  scrollY,
  avatarUri,
  avatarName,
  userName,
  userStatus,
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

  const headerStyle = useAnimatedStyle(() => ({
    height: interpolate(
      scrollY.value,
      [0, SCROLL_RANGE],
      [expandedHeight, collapsedHeight],
      Extrapolation.CLAMP,
    ),
  }))

  // Avatar: scale down + fade out
  const avatarStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      scrollY.value,
      [0, SCROLL_RANGE * 0.6],
      [1, 0.4],
      Extrapolation.CLAMP,
    )
    const opacity = interpolate(
      scrollY.value,
      [0, SCROLL_RANGE * 0.5],
      [1, 0],
      Extrapolation.CLAMP,
    )
    return {
      transform: [{ scale }],
      opacity,
    }
  })

  // Status: fade out early
  const statusStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      scrollY.value,
      [0, SCROLL_RANGE * 0.3],
      [1, 0],
      Extrapolation.CLAMP,
    ),
  }))

  // Name: stays centered, just gets slightly smaller
  const nameStyle = useAnimatedStyle(() => {
    const fontSize = interpolate(
      scrollY.value,
      [0, SCROLL_RANGE],
      [22, 17],
      Extrapolation.CLAMP,
    )
    return {
      transform: [{ scale: fontSize / 22 }],
    }
  })

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 10,
          backgroundColor: theme.cardBackground.val,
          borderBottomWidth: 0.5,
          borderBottomColor: theme.borderColor.val,
        },
        headerStyle,
      ]}
    >
      <YStack
        flex={1}
        paddingTop={insets.top + 8}
        alignItems="center"
        justifyContent="center"
        gap="$2"
      >
        {/* Avatar — fades out on scroll */}
        <Animated.View style={avatarStyle}>
          <AppAvatar uri={avatarUri} name={avatarName} size={AVATAR_SIZE} />
        </Animated.View>

        {/* Name — stays centered, scales down slightly */}
        <Animated.View style={nameStyle}>
          <Text fontSize={22} fontWeight="bold" color="$color" textAlign="center">
            {userName}
          </Text>
        </Animated.View>

        {/* Status — fades out */}
        <Animated.View style={statusStyle}>
          {userStatus && (
            <Text fontSize={15} color="$mutedText" textAlign="center">
              {userStatus}
            </Text>
          )}
        </Animated.View>
      </YStack>
    </Animated.View>
  )
}
