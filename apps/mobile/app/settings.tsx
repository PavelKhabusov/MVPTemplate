import { YStack } from 'tamagui'
import { SettingsContent } from '../src/features/settings/SettingsScreen'

export default function SettingsScreen() {
  return (
    <YStack flex={1} backgroundColor="$background">
      <SettingsContent />
    </YStack>
  )
}
