import { type ReactNode, useEffect } from 'react'
import { Platform, Pressable, ScrollView, View, useWindowDimensions } from 'react-native'
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
      {/*
       * Wrapper centers the modal via flexbox.
       * Backdrop and modal are SIBLINGS (not parent/child) to avoid
       * nested Pressable conflicts in React Native Web.
       * Modal gets zIndex=1 so it paints above the backdrop Pressable,
       * meaning clicks on modal content never reach the backdrop handler.
       */}
      <View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 10000,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Backdrop — position absolute, no explicit zIndex → below zIndex:1 modal */}
        <Pressable
          onPress={onClose}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
          }}
        />

        {/* Modal content — flex child centered by wrapper, zIndex:1 above backdrop */}
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
          zIndex={1}
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
      </View>
    </Portal>
  )
}
