import { MotiView } from 'moti'
import type { ViewStyle } from 'react-native'
import { STAGGER_DELAY } from './constants'

interface AnimatedListItemProps {
  children: React.ReactNode
  index: number
  delay?: number
  style?: ViewStyle
}

/**
 * Wraps a list item with staggered fade-in + slide-up animation.
 * Use inside FlashList/FlatList renderItem:
 *
 * ```tsx
 * renderItem={({ item, index }) => (
 *   <AnimatedListItem index={index}>
 *     <MyCard item={item} />
 *   </AnimatedListItem>
 * )}
 * ```
 */
export function AnimatedListItem({
  children,
  index,
  delay = STAGGER_DELAY,
  style,
}: AnimatedListItemProps) {
  return (
    <MotiView
      from={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{
        type: 'timing',
        duration: 350,
        delay: index * delay,
      }}
      style={style}
    >
      {children}
    </MotiView>
  )
}
