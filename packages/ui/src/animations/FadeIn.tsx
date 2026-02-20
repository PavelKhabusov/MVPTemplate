import { MotiView } from 'moti'
import type { ViewStyle } from 'react-native'

interface FadeInProps {
  children: React.ReactNode
  delay?: number
  duration?: number
  style?: ViewStyle
}

/**
 * Wraps children in a fade-in animation (opacity 0 → 1).
 * Animates on mount.
 */
export function FadeIn({ children, delay = 0, duration = 300, style }: FadeInProps) {
  return (
    <MotiView
      from={{ opacity: 0 }}
      animate={{ opacity: 1 }}
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
