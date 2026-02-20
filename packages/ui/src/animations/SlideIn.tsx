import { MotiView } from 'moti'
import type { ViewStyle } from 'react-native'

type Direction = 'left' | 'right' | 'top' | 'bottom'

interface SlideInProps {
  children: React.ReactNode
  from?: Direction
  distance?: number
  delay?: number
  duration?: number
  style?: ViewStyle
}

const getTranslation = (direction: Direction, distance: number) => {
  switch (direction) {
    case 'left':
      return { translateX: -distance }
    case 'right':
      return { translateX: distance }
    case 'top':
      return { translateY: -distance }
    case 'bottom':
      return { translateY: distance }
  }
}

/**
 * Slides children in from a given direction with fade.
 */
export function SlideIn({
  children,
  from = 'bottom',
  distance = 30,
  delay = 0,
  duration = 350,
  style,
}: SlideInProps) {
  const offset = getTranslation(from, distance)

  return (
    <MotiView
      from={{ opacity: 0, ...offset }}
      animate={{ opacity: 1, translateX: 0, translateY: 0 }}
      transition={{
        type: 'timing',
        duration,
        delay,
      }}
      style={style}
    >
      {children}
    </MotiView>
  )
}
