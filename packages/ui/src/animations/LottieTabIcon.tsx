import { useEffect, useRef } from 'react'
import { View, Platform } from 'react-native'
import LottieView from 'lottie-react-native'

interface LottieTabIconProps {
  source: any
  focused: boolean
  size?: number
  color?: string
}

export function LottieTabIcon({
  source,
  focused,
  size = 28,
  color,
}: LottieTabIconProps) {
  const animRef = useRef<LottieView>(null)
  const prevFocused = useRef(focused)

  useEffect(() => {
    if (focused && !prevFocused.current) {
      animRef.current?.reset()
      setTimeout(() => animRef.current?.play(), 16)
    }
    prevFocused.current = focused
  }, [focused])

  // Lottie doesn't render on web — use empty placeholder
  if (Platform.OS === 'web') {
    return <View style={{ width: size, height: size }} />
  }

  return (
    <LottieView
      ref={animRef}
      source={source}
      autoPlay={false}
      loop={false}
      style={{ width: size, height: size }}
      colorFilters={
        color
          ? [{ keypath: '**', color }]
          : undefined
      }
    />
  )
}
