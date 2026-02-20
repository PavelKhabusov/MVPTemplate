import { useEffect, useRef } from 'react'
import { StyleSheet, View } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  Easing,
  interpolate,
} from 'react-native-reanimated'
import { Ionicons } from '@expo/vector-icons'

type IconName = keyof typeof Ionicons.glyphMap

type AnimationType = 'bounce' | 'rotate' | 'wiggle' | 'pop' | 'bell'

interface AnimatedTabIconProps {
  name: IconName
  nameFilled: IconName
  focused: boolean
  color: string
  size?: number
  animation?: AnimationType
}

const springConfig = {
  damping: 8,
  stiffness: 200,
  mass: 0.6,
}

export function AnimatedTabIcon({
  name,
  nameFilled,
  focused,
  color,
  size = 24,
  animation = 'bounce',
}: AnimatedTabIconProps) {
  const progress = useSharedValue(0)
  const prevFocused = useRef(focused)

  useEffect(() => {
    // Only animate when becoming focused (not on initial render or unfocus)
    if (focused && !prevFocused.current) {
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

    if (!focused && prevFocused.current) {
      progress.value = withTiming(0, { duration: 150 })
    }

    prevFocused.current = focused
  }, [focused])

  const animatedStyle = useAnimatedStyle(() => {
    switch (animation) {
      case 'bounce':
        return {
          transform: [
            { scale: interpolate(progress.value, [0, 0.5, 1], [1, 1.25, 1]) },
            { translateY: interpolate(progress.value, [0, 0.4, 1], [0, -4, 0]) },
          ],
        }
      case 'rotate':
        return {
          transform: [
            { rotate: `${interpolate(progress.value, [0, 1], [0, 360])}deg` },
            { scale: interpolate(progress.value, [0, 0.5, 1], [1, 1.2, 1]) },
          ],
        }
      case 'wiggle':
        return {
          transform: [
            { rotate: `${progress.value * 15}deg` },
          ],
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
            { scale: focused ? 1 : interpolate(progress.value, [-1, 0, 1], [1.05, 1, 1.05]) },
          ],
        }
      default:
        return {}
    }
  })

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <Ionicons
        name={focused ? nameFilled : name}
        size={size}
        color={color}
      />
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
})
