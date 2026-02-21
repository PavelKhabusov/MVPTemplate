import React from 'react'
import { YStack, Text, useTheme } from 'tamagui'

interface SettingsGroupProps {
  header?: string
  footer?: string
  children: React.ReactNode
}

export function SettingsGroup({ header, footer, children }: SettingsGroupProps) {
  const theme = useTheme()
  const items = React.Children.toArray(children).filter(Boolean)

  return (
    <YStack gap="$1.5">
      {header && (
        <Text
          fontSize={13}
          color="$mutedText"
          paddingHorizontal="$4"
          textTransform="uppercase"
          letterSpacing={0.5}
        >
          {header}
        </Text>
      )}

      <YStack
        backgroundColor="$cardBackground"
        borderRadius="$4"
        borderWidth={0.5}
        borderColor={theme.cardBorder.val}
        overflow="hidden"
      >
        {items.map((child, index) => (
          <React.Fragment key={index}>
            {child}
            {index < items.length - 1 && (
              <YStack
                height={0.5}
                backgroundColor="$borderColor"
                marginLeft={54}
              />
            )}
          </React.Fragment>
        ))}
      </YStack>

      {footer && (
        <Text
          fontSize={13}
          color="$mutedText"
          paddingHorizontal="$4"
          lineHeight={18}
        >
          {footer}
        </Text>
      )}
    </YStack>
  )
}
