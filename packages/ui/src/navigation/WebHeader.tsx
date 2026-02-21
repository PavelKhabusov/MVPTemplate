import { XStack, Text, YStack } from 'tamagui'
import { Platform } from 'react-native'

// Only rendered on web platform
export function WebHeader() {
  if (Platform.OS !== 'web') return null

  return (
    <XStack
      backgroundColor="$background"
      borderBottomWidth={1}
      borderBottomColor="$borderColor"
      paddingHorizontal="$4"
      paddingVertical="$3"
      alignItems="center"
      justifyContent="space-between"
      height={56}
    >
      <Text fontWeight="bold" fontSize="$5" color="$primary">
        MVPTemplate
      </Text>

      <XStack gap="$4" alignItems="center">
        <NavLink href="/" label="Home" />
        <NavLink href="/explore" label="Explore" />
        <NavLink href="/profile" label="Profile" />
      </XStack>
    </XStack>
  )
}

function NavLink({ href, label }: { href: string; label: string }) {
  return (
    <Text
      // @ts-expect-error — web-only tag prop
      tag="a"
      href={href}
      color="$color"
      fontSize="$3"
      hoverStyle={{ color: '$primary' }}
      cursor="pointer"
    >
      {label}
    </Text>
  )
}
