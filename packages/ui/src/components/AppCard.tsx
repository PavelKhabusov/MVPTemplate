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
  flex,
  ...props
}: AppCardProps) {
  const card = (
    <YStack
      backgroundColor="$cardBackground"
      borderRadius="$4"
      padding="$4"
      borderWidth={1}
      borderColor="$borderColor"
      shadowColor="rgba(0,0,0,0.06)"
      shadowOffset={{ width: 0, height: 2 }}
      shadowOpacity={1}
      shadowRadius={8}
      flex={animated ? flex : flex}
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
          style={flex != null ? { flex: flex as number } : undefined}
        >
          {card}
        </MotiView>
      )}
    </AnimatePresence>
  )
}
