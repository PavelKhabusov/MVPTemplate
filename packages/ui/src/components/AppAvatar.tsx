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

export function AppAvatar({ uri, name, size = 48, ...props }: AppAvatarProps) {
  const theme = useTheme()

  if (uri) {
    return (
      <YStack
        width={size}
        height={size}
        borderRadius={size / 2}
        overflow="hidden"
        {...props}
      >
        <Image
          source={{ uri }}
          style={{ width: size, height: size }}
          resizeMode="cover"
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
      {...props}
    >
      <Text color="white" fontWeight="bold" fontSize={size * 0.35}>
        {name ? getInitials(name) : '?'}
      </Text>
    </YStack>
  )
}
