import { Pressable, type ViewStyle } from 'react-native'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated'
import { SPRING_BOUNCY, PRESS_SCALE } from './constants'

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

interface ScalePressProps {
  children: React.ReactNode
  onPress?: () => void
  onLongPress?: () => void
  scale?: number
  disabled?: boolean
  style?: ViewStyle
  accessibilityLabel?: string
  accessibilityHint?: string
}

/**
 * Pressable wrapper with a spring scale-down effect on press.
 * Use for buttons, cards, or any interactive element.
 */
export function ScalePress({
  children,
  onPress,
  onLongPress,
  scale = PRESS_SCALE,
  disabled = false,
  style,
  accessibilityLabel,
  accessibilityHint,
}: ScalePressProps) {
  const pressed = useSharedValue(1)

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pressed.value }],
  }))

  return (
    <AnimatedPressable
      onPressIn={() => {
        pressed.value = withSpring(scale, SPRING_BOUNCY)
      }}
      onPressOut={() => {
        pressed.value = withSpring(1, SPRING_BOUNCY)
      }}
      onPress={onPress}
      onLongPress={onLongPress}
      disabled={disabled}
      style={[animatedStyle, style]}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled }}
    >
      {children}
    </AnimatedPressable>
  )
}
