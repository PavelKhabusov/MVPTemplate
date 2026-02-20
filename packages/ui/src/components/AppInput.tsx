import { useState } from 'react'
import { Input, YStack, Text, XStack, GetProps } from 'tamagui'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated'

const AnimatedYStack = Animated.createAnimatedComponent(YStack)

interface AppInputProps extends GetProps<typeof Input> {
  label?: string
  error?: string
  helper?: string
}

export function AppInput({ label, error, helper, ...props }: AppInputProps) {
  const shakeX = useSharedValue(0)
  const [prevError, setPrevError] = useState<string | undefined>()

  // Trigger shake animation when error appears
  if (error && error !== prevError) {
    shakeX.value = withSequence(
      withTiming(-8, { duration: 50 }),
      withTiming(8, { duration: 50 }),
      withTiming(-6, { duration: 50 }),
      withTiming(6, { duration: 50 }),
      withTiming(0, { duration: 50 })
    )
  }
  if (error !== prevError) {
    setPrevError(error)
  }

  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeX.value }],
  }))

  return (
    <AnimatedYStack gap="$1" style={shakeStyle}>
      {label && (
        <Text fontSize="$2" fontWeight="600" color="$color">
          {label}
        </Text>
      )}

      <Input
        backgroundColor="$cardBackground"
        borderWidth={1}
        borderColor={error ? '$error' : '$borderColor'}
        borderRadius="$3"
        paddingHorizontal="$3"
        height={44}
        fontSize="$3"
        color="$color"
        placeholderTextColor="$mutedText"
        aria-label={label}
        aria-invalid={!!error}
        aria-describedby={error ? `${label}-error` : undefined}
        focusStyle={{
          borderColor: error ? '$error' : '$primary',
          borderWidth: 2,
        }}
        {...props}
      />

      {error && (
        <Text fontSize="$1" color="$error">
          {error}
        </Text>
      )}
      {helper && !error && (
        <Text fontSize="$1" color="$mutedText">
          {helper}
        </Text>
      )}
    </AnimatedYStack>
  )
}
