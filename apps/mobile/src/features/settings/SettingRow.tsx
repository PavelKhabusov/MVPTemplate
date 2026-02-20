import { XStack, Text, useTheme } from 'tamagui'
import { Ionicons } from '@expo/vector-icons'
import { ScalePress } from '@mvp/ui'

interface SettingRowProps {
  icon: keyof typeof Ionicons.glyphMap
  label: string
  value?: string
  onPress?: () => void
  danger?: boolean
}

export function SettingRow({ icon, label, value, onPress, danger }: SettingRowProps) {
  const theme = useTheme()
  const content = (
    <XStack
      alignItems="center"
      paddingVertical="$3"
      paddingHorizontal="$4"
      gap="$3"
      backgroundColor="$cardBackground"
      borderRadius="$3"
      borderWidth={1}
      borderColor="$borderColor"
    >
      <Ionicons name={icon} size={22} color={danger ? theme.error.val : theme.accent.val} />
      <Text flex={1} color={danger ? '$error' : '$color'} fontSize="$3">
        {label}
      </Text>
      {value && (
        <Text color="$mutedText" fontSize="$2">
          {value}
        </Text>
      )}
      {onPress && (
        <Ionicons name="chevron-forward" size={18} color={theme.mutedText.val} />
      )}
    </XStack>
  )

  // Always render ScalePress to keep hook count stable.
  // When no onPress, scale=1 disables the visual effect and disabled prevents interaction.
  return (
    <ScalePress onPress={onPress} disabled={!onPress} scale={onPress ? undefined : 1}>
      {content}
    </ScalePress>
  )
}
