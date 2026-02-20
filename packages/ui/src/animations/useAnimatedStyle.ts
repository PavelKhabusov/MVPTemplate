import {
  useAnimatedStyle as useReanimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated'
import { SPRING_CONFIG, TIMING_CONFIG, TIMING_FAST } from './constants'

/**
 * Hook: returns an animated shake style.
 * Call `trigger()` to play the shake animation (e.g., on validation error).
 */
export function useShake() {
  const offset = useSharedValue(0)

  const style = useReanimatedStyle(() => ({
    transform: [{ translateX: offset.value }],
  }))

  const trigger = () => {
    offset.value = withSpring(10, { ...SPRING_CONFIG, stiffness: 400 }, () => {
      offset.value = withSpring(-8, { ...SPRING_CONFIG, stiffness: 400 }, () => {
        offset.value = withSpring(6, { ...SPRING_CONFIG, stiffness: 400 }, () => {
          offset.value = withSpring(-4, { ...SPRING_CONFIG, stiffness: 400 }, () => {
            offset.value = withSpring(0, SPRING_CONFIG)
          })
        })
      })
    })
  }

  return { style, trigger }
}

/**
 * Hook: returns an animated opacity style for fade effects.
 */
export function useFade(initialValue = 0) {
  const opacity = useSharedValue(initialValue)

  const style = useReanimatedStyle(() => ({
    opacity: opacity.value,
  }))

  const fadeIn = (duration?: number) => {
    opacity.value = withTiming(1, duration ? { ...TIMING_CONFIG, duration } : TIMING_CONFIG)
  }

  const fadeOut = (duration?: number) => {
    opacity.value = withTiming(0, duration ? { ...TIMING_CONFIG, duration } : TIMING_FAST)
  }

  return { style, fadeIn, fadeOut, opacity }
}

/**
 * Hook: returns a spring-based scale value (e.g., for badges).
 */
export function useSpringScale(initialValue = 1) {
  const scale = useSharedValue(initialValue)

  const style = useReanimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }))

  const bounce = () => {
    scale.value = withSpring(1.3, SPRING_CONFIG, () => {
      scale.value = withSpring(1, SPRING_CONFIG)
    })
  }

  const setScale = (value: number) => {
    scale.value = withSpring(value, SPRING_CONFIG)
  }

  return { style, bounce, setScale, scale }
}
