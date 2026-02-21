import type { WithSpringConfig, WithTimingConfig } from 'react-native-reanimated'
import { Easing } from 'react-native-reanimated'

/** Default spring config — snappy and responsive */
export const SPRING_CONFIG: WithSpringConfig = {
  damping: 15,
  stiffness: 150,
  mass: 1,
  overshootClamping: false,
}

/** Gentle spring for larger elements */
export const SPRING_GENTLE: WithSpringConfig = {
  damping: 20,
  stiffness: 100,
  mass: 1,
}

/** Bouncy spring for micro-interactions */
export const SPRING_BOUNCY: WithSpringConfig = {
  damping: 10,
  stiffness: 200,
  mass: 0.8,
}

/** Standard timing config — 300ms ease out */
export const TIMING_CONFIG: WithTimingConfig = {
  duration: 300,
  easing: Easing.out(Easing.cubic),
}

/** Fast timing — 200ms for micro-interactions */
export const TIMING_FAST: WithTimingConfig = {
  duration: 200,
  easing: Easing.out(Easing.cubic),
}

/** Slow timing — 500ms for large transitions */
export const TIMING_SLOW: WithTimingConfig = {
  duration: 500,
  easing: Easing.inOut(Easing.cubic),
}

/** Default delay between staggered list items (ms) */
export const STAGGER_DELAY = 50

/** Scale factor for press animations */
export const PRESS_SCALE = 0.96
