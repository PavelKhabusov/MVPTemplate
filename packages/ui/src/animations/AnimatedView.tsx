import { MotiView, type MotiProps } from 'moti'
import type { ViewStyle } from 'react-native'

interface AnimatedViewProps extends Omit<MotiProps, 'style'> {
  children: React.ReactNode
  style?: ViewStyle
}

/**
 * General-purpose animated view wrapper using Moti.
 * Supports all Moti animation props (from, animate, exit, transition).
 *
 * ```tsx
 * <AnimatedView
 *   from={{ opacity: 0, scale: 0.9 }}
 *   animate={{ opacity: 1, scale: 1 }}
 *   exit={{ opacity: 0, scale: 0.9 }}
 * >
 *   <Content />
 * </AnimatedView>
 * ```
 */
export function AnimatedView({ children, style, ...motiProps }: AnimatedViewProps) {
  return (
    <MotiView style={style} {...motiProps}>
      {children}
    </MotiView>
  )
}
