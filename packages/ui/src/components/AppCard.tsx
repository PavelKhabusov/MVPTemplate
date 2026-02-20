import { YStack, GetProps } from 'tamagui'
import { MotiView, AnimatePresence } from 'moti'

interface AppCardProps extends GetProps<typeof YStack> {
  animated?: boolean
  visible?: boolean
}

export function AppCard({
  children,
  animated = true,
  visible = true,
  ...props
}: AppCardProps) {
  const card = (
    <YStack
      backgroundColor="$cardBackground"
      borderRadius="$4"
      padding="$4"
      borderWidth={1}
      borderColor="$borderColor"
      {...props}
    >
      {children}
    </YStack>
  )

  if (!animated) return visible ? card : null

  return (
    <AnimatePresence>
      {visible && (
        <MotiView
          from={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ type: 'timing', duration: 200 }}
        >
          {card}
        </MotiView>
      )}
    </AnimatePresence>
  )
}
