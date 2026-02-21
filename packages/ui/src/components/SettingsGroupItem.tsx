import { XStack, YStack, Text, Switch, useTheme } from 'tamagui'
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

export function SettingsGroupItem({
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

      <Text flex={1} color={danger ? '$error' : '$color'} fontSize={16}>
        {label}
      </Text>

      {toggle ? (
        <Switch
          size="$3"
          checked={toggleValue}
          onCheckedChange={onToggleChange}
          backgroundColor={toggleValue ? theme.accent.val : '$borderColor'}
        >
          <Switch.Thumb backgroundColor="white" />
        </Switch>
      ) : (
        <>
          {value && (
            <Text color="$mutedText" fontSize={16} flexShrink={1} numberOfLines={1}>
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
    <ScalePress onPress={onPress} disabled={!onPress} scale={onPress ? 0.98 : 1}>
      {content}
    </ScalePress>
  )
}
