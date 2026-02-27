import { type ReactNode, useEffect } from 'react'
import { Modal, Platform, Pressable, ScrollView, View, useWindowDimensions } from 'react-native'
import { H4, Text, XStack, YStack, useTheme } from 'tamagui'
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
  const theme = useTheme()
  const isWide = screenWidth > 600

  useEffect(() => {
    if (!visible || Platform.OS !== 'web') return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [visible, onClose])

  // ── Native ────────────────────────────────────────────────────────────
  if (Platform.OS !== 'web') {
    return (
      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={onClose}
      >
        <YStack
          flex={1}
          backgroundColor="$background"
          padding="$4"
          paddingTop={Platform.OS === 'ios' ? 60 : '$4'}
        >
          <XStack alignItems="center" justifyContent="space-between" marginBottom="$4">
            <H4 color="$color" fontFamily="$body">{title}</H4>
            <Pressable onPress={onClose} style={{ padding: 8 }}>
              <Text fontSize={22} color="$mutedText">×</Text>
            </Pressable>
          </XStack>
          <ScrollView showsVerticalScrollIndicator={false}>
            {children}
          </ScrollView>
        </YStack>
      </Modal>
    )
  }

  // ── Web ───────────────────────────────────────────────────────────────
  if (!visible) return null

  const modalWidth = isWide ? Math.min(maxWidth, screenWidth - 48) : screenWidth - 32
  const modalMaxHeight = screenHeight - insets.top - insets.bottom - 48

  // RNW forwards unknown props to the underlying DOM element.
  // We use native DOM onClick so that stopPropagation works reliably —
  // RN Pressable's responder system ignores CSS z-index on web.
  const backdropProps = { onClick: onClose } as object
  const stopProps = { onClick: (e: Event) => e.stopPropagation() } as object

  return (
    <Portal>
      {/* Full-screen wrapper that centers the modal via flexbox */}
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
        {/* Backdrop — DOM onClick, no z-index → sits behind modal */}
        <View
          {...backdropProps}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
          }}
        />

        {/* Modal panel — z-index:1 above backdrop; DOM stopPropagation on click */}
        <View
          {...stopProps}
          style={{
            zIndex: 1,
            width: modalWidth,
            maxHeight: modalMaxHeight,
            backgroundColor: theme.background.val,
            borderRadius: 16,
            overflow: 'hidden',
            // shadow
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.15,
            shadowRadius: 24,
            elevation: 8,
          }}
        >
          {/* Header */}
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
                opacity: pressed ? 0.5 : 1,
              })}
            >
              <Text fontSize={22} color="$mutedText" lineHeight={22}>×</Text>
            </Pressable>
          </XStack>

          {/* Scrollable content */}
          <ScrollView
            style={{ maxHeight: modalMaxHeight - 64 }}
            showsVerticalScrollIndicator={false}
          >
            <YStack padding="$4">
              {children}
            </YStack>
          </ScrollView>
        </View>
      </View>
    </Portal>
  )
}
