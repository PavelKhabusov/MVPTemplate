import { KeyboardAvoidingView, ScrollView, Platform, TouchableOpacity } from 'react-native'
import { YStack, useTheme } from 'tamagui'
import { ArrowLeft } from 'lucide-react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

interface AuthScreenLayoutProps {
  children: React.ReactNode
  onGoBack?: () => void
}

export function AuthScreenLayout({ children, onGoBack }: AuthScreenLayoutProps) {
  const theme = useTheme()
  const insets = useSafeAreaInsets()

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.background.val }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 16 }}
        keyboardShouldPersistTaps="handled"
      >
        {onGoBack && (
          <TouchableOpacity
            onPress={onGoBack}
            style={{ position: 'absolute', top: insets.top + 8, left: 0, padding: 8, zIndex: 1 }}
          >
            <ArrowLeft size={24} color={theme.color.val} />
          </TouchableOpacity>
        )}

        <YStack alignItems="center" gap="$6">
          {children}
        </YStack>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
