import { Platform, useWindowDimensions } from 'react-native'
import { YStack, XStack, Text, useTheme } from 'tamagui'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Animated, {
  useAnimatedStyle,
  interpolate,
  Extrapolation,
  type SharedValue,
} from 'react-native-reanimated'
import { AppAvatar } from '../components/AppAvatar'

const HEADER_EXPANDED = 280
const HEADER_COLLAPSED = 96
const SCROLL_RANGE = HEADER_EXPANDED - HEADER_COLLAPSED
const AVATAR_LARGE = 100
const AVATAR_SMALL = 36

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
  const { width: screenWidth } = useWindowDimensions()

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
        <AppAvatar uri={avatarUri} name={avatarName} size={AVATAR_LARGE} />
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

  const avatarScale = useAnimatedStyle(() => {
    const scale = interpolate(
      scrollY.value,
      [0, SCROLL_RANGE],
      [1, AVATAR_SMALL / AVATAR_LARGE],
      Extrapolation.CLAMP,
    )
    const translateX = interpolate(
      scrollY.value,
      [0, SCROLL_RANGE],
      [0, -(screenWidth / 2 - 56)],
      Extrapolation.CLAMP,
    )
    const translateY = interpolate(
      scrollY.value,
      [0, SCROLL_RANGE],
      [0, 8],
      Extrapolation.CLAMP,
    )
    return {
      transform: [{ translateX }, { translateY }, { scale }],
    }
  })

  const largeTitleStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      scrollY.value,
      [0, SCROLL_RANGE * 0.5],
      [1, 0],
      Extrapolation.CLAMP,
    ),
    transform: [{
      translateY: interpolate(
        scrollY.value,
        [0, SCROLL_RANGE * 0.5],
        [0, -10],
        Extrapolation.CLAMP,
      ),
    }],
  }))

  const statusStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      scrollY.value,
      [0, SCROLL_RANGE * 0.4],
      [1, 0],
      Extrapolation.CLAMP,
    ),
  }))

  const collapsedTitleStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      scrollY.value,
      [SCROLL_RANGE * 0.6, SCROLL_RANGE],
      [0, 1],
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
          backgroundColor: theme.cardBackground.val,
          borderBottomWidth: 0.5,
          borderBottomColor: theme.borderColor.val,
        },
        headerStyle,
      ]}
    >
      {/* Expanded layout: centered avatar + name */}
      <YStack
        flex={1}
        paddingTop={insets.top + 16}
        alignItems="center"
        justifyContent="center"
        gap="$2"
      >
        <Animated.View style={avatarScale}>
          <AppAvatar uri={avatarUri} name={avatarName} size={AVATAR_LARGE} />
        </Animated.View>

        <Animated.View style={largeTitleStyle}>
          <Text fontSize={22} fontWeight="bold" color="$color" textAlign="center">
            {userName}
          </Text>
        </Animated.View>

        <Animated.View style={statusStyle}>
          {userStatus && (
            <Text fontSize={15} color="$mutedText" textAlign="center">
              {userStatus}
            </Text>
          )}
        </Animated.View>
      </YStack>

      {/* Collapsed layout: inline name next to avatar */}
      <Animated.View
        style={[
          {
            position: 'absolute',
            bottom: 16,
            left: 60,
            right: 16,
            justifyContent: 'center',
          },
          collapsedTitleStyle,
        ]}
      >
        <Text fontSize={17} fontWeight="600" color="$color" numberOfLines={1}>
          {userName}
        </Text>
      </Animated.View>
    </Animated.View>
  )
}
