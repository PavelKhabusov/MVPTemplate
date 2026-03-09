import { memo } from 'react'
import { XStack, YStack, Text, useTheme } from 'tamagui'
import { AppSwitch } from './AppSwitch'
import { Ionicons } from '@expo/vector-icons'
import { ScalePress } from '../animations/ScalePress'

interface SettingsGroupItemProps {
  icon: keyof typeof Ionicons.glyphMap
  iconColor?: string
  label: string
  value?: string
  onPress?: () => void
  danger?: boolean
  toggle?: boolean
  toggleValue?: boolean
  onToggleChange?: (val: boolean) => void
}

export const SettingsGroupItem = memo(function SettingsGroupItem({
  icon,
  iconColor,
  label,
  value,
  onPress,
  danger,
  toggle,
  toggleValue,
  onToggleChange,
}: SettingsGroupItemProps) {
  const theme = useTheme()
  const color = danger ? theme.error.val : (iconColor ?? theme.accent.val)

  const content = (
    <XStack
      alignItems="center"
      paddingVertical="$2.5"
      paddingHorizontal="$3"
      gap="$3"
      accessibilityLabel={label}
    >
      <YStack
        width={30}
        height={30}
        borderRadius={7}
        backgroundColor={color + '1A'}
        alignItems="center"
        justifyContent="center"
      >
        <Ionicons name={icon} size={18} color={color} />
      </YStack>

      <Text flex={1} flexShrink={0} color={danger ? '$error' : '$color'} fontSize={16} numberOfLines={1} textAlign="left">
        {label}
      </Text>

      {toggle ? (
        <AppSwitch
          checked={!!toggleValue}
          onCheckedChange={(val) => onToggleChange?.(val)}
        />
      ) : (
        <>
          {value && (
            <Text color="$mutedText" fontSize={16} flexShrink={1} maxWidth="50%" numberOfLines={1}>
              {value}
            </Text>
          )}
          {onPress && (
            <Ionicons name="chevron-forward" size={18} color={theme.mutedText.val} />
          )}
        </>
      )}
    </XStack>
  )

  if (toggle) return content

  return (
    <ScalePress onPress={onPress} disabled={!onPress} scale={onPress ? 0.98 : 1} accessibilityLabel={label}>
      {content}
    </ScalePress>
  )
})
