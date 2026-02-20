import { XStack, Text } from 'tamagui'
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
  const content = (
    <XStack
      alignItems="center"
      paddingVertical="$3"
      paddingHorizontal="$4"
      gap="$3"
      backgroundColor="$cardBackground"
      borderRadius="$3"
    >
      <Ionicons name={icon} size={22} color={danger ? '#ef4444' : '#6366F1'} />
      <Text flex={1} color={danger ? '$error' : '$color'} fontSize="$3">
        {label}
      </Text>
      {value && (
        <Text color="$mutedText" fontSize="$2">
          {value}
        </Text>
      )}
      {onPress && (
        <Ionicons name="chevron-forward" size={18} color="#9ca3af" />
      )}
    </XStack>
  )

  if (onPress) {
    return <ScalePress onPress={onPress}>{content}</ScalePress>
  }

  return content
}
