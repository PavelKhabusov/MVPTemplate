import { Platform, Pressable } from 'react-native'
import { XStack, Text, useTheme } from 'tamagui'
import { Ionicons } from '@expo/vector-icons'
import { useTranslation } from '@mvp/i18n'
import { useTemplateConfigStore } from './store'

export function TemplateConfigButton() {
  const { t } = useTranslation()
  const theme = useTheme()
  const setSidebarOpen = useTemplateConfigStore((s) => s.setSidebarOpen)

  if (Platform.OS !== 'web') return null

  return (
    <Pressable onPress={() => setSidebarOpen(true)}>
      <XStack
        backgroundColor="$accent"
        paddingHorizontal="$3"
        paddingVertical="$2"
        borderRadius="$3"
        alignItems="center"
        gap="$2"
        hoverStyle={{ opacity: 0.9 } as any}
      >
        <Ionicons name="construct-outline" size={18} color="white" />
        <Text color="white" fontWeight="600" fontSize="$3">
          {t('templateConfig.title')}
        </Text>
      </XStack>
    </Pressable>
  )
}
