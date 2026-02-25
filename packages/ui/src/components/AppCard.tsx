import { Platform } from 'react-native'
import { YStack, GetProps, useTheme } from 'tamagui'
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
  const theme = useTheme()

  const card = (
    <YStack
      backgroundColor="$cardBackground"
      borderRadius={Number(theme.radiusMd?.val) || 12}
      padding="$4"
      borderWidth={0.5}
      borderColor={theme.cardBorder.val}
      shadowColor={theme.cardShadow.val}
      flex={animated ? undefined : flex}
      {...(animated && flex != null && Platform.OS === 'web' ? { height: '100%' as any } : {})}
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
          style={{
            ...(flex != null ? { flex: flex as number } : undefined),
            alignSelf: 'stretch' as const,
          }}
        >
          {card}
        </MotiView>
      )}
    </AnimatePresence>
  )
}
