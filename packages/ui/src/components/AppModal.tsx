import { type ReactNode, useEffect } from 'react'
import { Platform, Pressable, ScrollView, useWindowDimensions } from 'react-native'
import { H4, Text, XStack, YStack } from 'tamagui'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Portal } from '@tamagui/portal'

export function AppModal({
  visible,
  onClose,
  title,
  maxWidth = 520,
  children,
}: {
  visible: boolean
  onClose: () => void
  title: string
  maxWidth?: number
  children: ReactNode
}) {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions()
  const insets = useSafeAreaInsets()
  const isWide = screenWidth > 600

  useEffect(() => {
    if (!visible || Platform.OS !== 'web') return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [visible, onClose])

  if (!visible) return null

  return (
    <Portal>
      <Pressable
        onPress={onClose}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 10000,
          backgroundColor: 'rgba(0,0,0,0.5)',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Pressable onPress={(e) => e.stopPropagation()}>
          <YStack
            backgroundColor="$background"
            borderRadius="$4"
            width={isWide ? Math.min(maxWidth, screenWidth - 48) : screenWidth - 32}
            maxHeight={screenHeight - insets.top - insets.bottom - 48}
            shadowColor="$shadowColor"
            shadowOffset={{ width: 0, height: 8 }}
            shadowOpacity={0.15}
            shadowRadius={24}
            elevation={8}
            overflow="hidden"
          >
            <XStack
              alignItems="center"
              justifyContent="space-between"
              padding="$4"
              paddingBottom="$3"
              borderBottomWidth={1}
              borderBottomColor="$borderColor"
            >
              <H4 color="$color" fontFamily="$body" flex={1} numberOfLines={1} paddingRight="$3">
                {title}
              </H4>
              <Pressable
                onPress={onClose}
                style={({ pressed }) => ({
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: pressed ? 0.6 : 1,
                })}
              >
                <Text fontSize={22} color="$mutedText" lineHeight={22}>×</Text>
              </Pressable>
            </XStack>
            <ScrollView
              style={{ maxHeight: screenHeight - insets.top - insets.bottom - 140 }}
              showsVerticalScrollIndicator={false}
            >
              <YStack padding="$4">
                {children}
              </YStack>
            </ScrollView>
          </YStack>
        </Pressable>
      </Pressable>
    </Portal>
  )
}
