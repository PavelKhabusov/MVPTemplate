import { XStack, Text } from 'tamagui'
import { Platform } from 'react-native'

interface BreadcrumbsProps {
  pathname: string
}

export function Breadcrumbs({ pathname }: BreadcrumbsProps) {
  if (Platform.OS !== 'web') return null

  const segments = pathname.split('/').filter(Boolean)
  if (segments.length === 0) return null

  const crumbs = [
    { label: 'Home', href: '/' },
    ...segments.map((seg, i) => ({
      label: seg.charAt(0).toUpperCase() + seg.slice(1),
      href: '/' + segments.slice(0, i + 1).join('/'),
    })),
  ]

  return (
    <XStack paddingHorizontal="$4" paddingVertical="$2" gap="$2" alignItems="center">
      {crumbs.map((crumb, i) => (
        <XStack key={crumb.href} gap="$2" alignItems="center">
          {i > 0 && (
            <Text color="$mutedText" fontSize="$2">
              /
            </Text>
          )}
          {i < crumbs.length - 1 ? (
            <Text
              // @ts-expect-error — web-only tag prop
              tag="a"
              href={crumb.href}
              color="$primary"
              fontSize="$2"
              cursor="pointer"
              hoverStyle={{ textDecorationLine: 'underline' }}
            >
              {crumb.label}
            </Text>
          ) : (
            <Text color="$mutedText" fontSize="$2">
              {crumb.label}
            </Text>
          )}
        </XStack>
      ))}
    </XStack>
  )
}
