import { useState } from 'react'
import { Input, YStack, Text, XStack, GetProps, useTheme } from 'tamagui'
import { Pressable } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
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

export function AppInput({ label, error, helper, secureTextEntry, ...props }: AppInputProps) {
  const theme = useTheme()
  const shakeX = useSharedValue(0)
  const [prevError, setPrevError] = useState<string | undefined>()
  const [showPassword, setShowPassword] = useState(false)

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

  const isPassword = secureTextEntry === true

  return (
    <AnimatedYStack gap="$1" style={shakeStyle}>
      {label && (
        <Text fontSize="$2" fontWeight="600" color="$color">
          {label}
        </Text>
      )}

      <XStack
        backgroundColor="$cardBackground"
        borderWidth={1}
        borderColor={error ? '$error' : '$borderColor'}
        borderRadius="$3"
        height={44}
        alignItems="center"
        focusStyle={{
          borderColor: error ? '$error' : '$primary',
          borderWidth: 2,
        }}
      >
        <Input
          flex={1}
          backgroundColor="transparent"
          borderWidth={0}
          paddingHorizontal="$3"
          height={44}
          fontSize="$3"
          color="$color"
          placeholderTextColor="$mutedText"
          aria-label={label}
          aria-invalid={!!error}
          aria-describedby={error ? `${label}-error` : undefined}
          secureTextEntry={isPassword && !showPassword}
          {...props}
        />
        {isPassword && (
          <Pressable
            onPress={() => setShowPassword((v) => !v)}
            hitSlop={8}
            style={{ paddingRight: 12 }}
          >
            <Ionicons
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={theme.mutedText.val}
            />
          </Pressable>
        )}
      </XStack>

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
