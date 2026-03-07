import { memo } from 'react'
import { Image } from 'react-native'
import { YStack, Text, GetProps, useTheme } from 'tamagui'

interface AppAvatarProps extends GetProps<typeof YStack> {
  uri?: string | null
  name?: string
  size?: number
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export const AppAvatar = memo(function AppAvatar({ uri, name, size = 48, ...props }: AppAvatarProps) {
  const theme = useTheme()

  if (uri) {
    return (
      <YStack
        width={size}
        height={size}
        borderRadius={size / 2}
        overflow="hidden"
        accessibilityRole="image"
        accessibilityLabel={name || 'Avatar'}
        {...props}
      >
        <Image
          source={{ uri }}
          style={{ width: size, height: size }}
          resizeMode="cover"
          accessibilityLabel={name || 'Avatar'}
        />
      </YStack>
    )
  }

  return (
    <YStack
      width={size}
      height={size}
      borderRadius={size / 2}
      backgroundColor={theme.accent.val}
      alignItems="center"
      justifyContent="center"
      accessibilityRole="image"
      accessibilityLabel={name || 'Avatar'}
      {...props}
    >
      <Text color="white" fontWeight="bold" fontSize={size * 0.35}>
        {name ? getInitials(name) : '?'}
      </Text>
    </YStack>
  )
})
