import { useEffect } from 'react'
import { StyleSheet, View } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  cancelAnimation,
  Easing,
  interpolate,
} from 'react-native-reanimated'

interface RefreshSpinnerProps {
  spinning: boolean
  color?: string
  size?: number
}

export function RefreshSpinner({ spinning, color = '#0891B2', size = 28 }: RefreshSpinnerProps) {
  const rotation = useSharedValue(0)
  const scale = useSharedValue(0)

  useEffect(() => {
    if (spinning) {
      scale.value = withTiming(1, { duration: 200 })
      rotation.value = 0
      rotation.value = withRepeat(
        withTiming(360, { duration: 800, easing: Easing.linear }),
        -1,
        false,
      )
    } else {
      scale.value = withTiming(0, { duration: 200 })
      cancelAnimation(rotation)
    }
  }, [spinning])

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${rotation.value}deg` },
      { scale: scale.value },
    ],
    opacity: interpolate(scale.value, [0, 1], [0, 1]),
  }))

  return (
    <Animated.View style={[styles.container, animatedStyle, { width: size, height: size }]}>
      <View
        style={[
          styles.arc,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: 2.5,
            borderColor: 'transparent',
            borderTopColor: color,
            borderRightColor: color,
          },
        ]}
      />
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  arc: {},
})
