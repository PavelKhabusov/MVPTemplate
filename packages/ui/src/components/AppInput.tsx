import { useState } from 'react'
import { Input, YStack, Text, XStack, GetProps, useTheme } from 'tamagui'
import { Platform, TouchableOpacity } from 'react-native'
import { Eye, EyeOff } from 'lucide-react-native'
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
  const hideText = isPassword && !showPassword

  // Tamagui Input doesn't map secureTextEntry to type="password" on web
  const webPasswordProps =
    Platform.OS === 'web' && isPassword
      ? ({ inputMode: 'text', type: hideText ? 'password' : 'text' } as any)
      : {}

  return (
    <AnimatedYStack gap="$1" style={shakeStyle}>
      {label && (
        <Text fontSize="$2" fontWeight="600" color="$color">
          {label}
        </Text>
      )}

      <YStack position="relative">
        <Input
          backgroundColor="$cardBackground"
          borderWidth={1}
          borderColor={error ? '$error' : '$borderColor'}
          borderRadius={Number(theme.radiusSm?.val) ?? 8}
          paddingHorizontal="$3"
          paddingRight={isPassword ? 44 : '$3'}
          height={44}
          fontSize="$3"
          color="$color"
          placeholderTextColor="$mutedText"
          aria-label={label}
          aria-invalid={!!error}
          aria-describedby={error ? `${label}-error` : undefined}
          secureTextEntry={hideText}
          {...webPasswordProps}
          {...props}
        />
        {isPassword && (
          <TouchableOpacity
            onPress={() => setShowPassword((v) => !v)}
            hitSlop={8}
            activeOpacity={0.6}
            style={{
              position: 'absolute',
              right: 0,
              top: 0,
              height: 44,
              width: 44,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {showPassword ? (
              <EyeOff size={20} color={theme.mutedText.val} />
            ) : (
              <Eye size={20} color={theme.mutedText.val} />
            )}
          </TouchableOpacity>
        )}
      </YStack>

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
