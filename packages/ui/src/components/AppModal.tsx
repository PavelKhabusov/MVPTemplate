import React, { type ReactNode, useEffect, useState } from 'react'
import { Modal, Platform, Pressable, ScrollView, useWindowDimensions, View } from 'react-native'
import { H4, Text, YStack, XStack, useTheme } from 'tamagui'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

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

  // Web: track mount state separately from `visible` so exit animation
  // plays before the element is removed from the DOM.
  const [mounted, setMounted] = useState(false)
  const [shown, setShown] = useState(false)

  useEffect(() => {
    if (Platform.OS !== 'web') return
    if (visible) {
      setMounted(true)
      let id = requestAnimationFrame(() => {
        id = requestAnimationFrame(() => setShown(true))
      })
      return () => cancelAnimationFrame(id)
    } else {
      setShown(false)
      const t = setTimeout(() => setMounted(false), 240)
      return () => clearTimeout(t)
    }
  }, [visible])

  // Escape key
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
  // Render inline with position:fixed — stays inside React/Tamagui tree,
  // so fonts, theme tokens, and context all work correctly.
  if (!mounted) return null

  const modalWidth = isWide ? Math.min(maxWidth, screenWidth - 48) : screenWidth - 32
  const modalMaxHeight = screenHeight - insets.top - insets.bottom - 48
  const ease = '240ms cubic-bezier(0.32, 0.72, 0, 1)'

  return (
    // @ts-ignore — position:'fixed' is web-only
    <View
      onStartShouldSetResponder={() => true}
      onResponderRelease={onClose}
      // @ts-ignore
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: shown ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0)',
        transition: `background-color ${ease}`,
      }}
    >
      {/* Modal panel */}
      <View
        onStartShouldSetResponder={() => true}
        // @ts-ignore
        style={{
          width: modalWidth,
          maxHeight: modalMaxHeight,
          backgroundColor: theme.background.val,
          borderRadius: 16,
          overflow: 'hidden',
          boxShadow: '0 8px 40px rgba(0,0,0,0.18)',
          display: 'flex',
          flexDirection: 'column',
          opacity: shown ? 1 : 0,
          transform: shown ? 'scale(1) translateY(0px)' : 'scale(0.96) translateY(12px)',
          transition: `opacity ${ease}, transform ${ease}`,
        }}
      >
        {/* Header */}
        <XStack
          alignItems="center"
          justifyContent="space-between"
          padding="$3"
          paddingBottom="$2.5"
          borderBottomWidth={1}
          borderBottomColor="$borderColor"
        >
          <H4 color="$color" fontFamily="$body" flex={1} numberOfLines={1} paddingRight="$3">
            {title}
          </H4>
          <Pressable
            onPress={onClose}
            // @ts-ignore
            style={{
              padding: '4px 8px',
              borderRadius: 8,
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            <Text fontSize={24} lineHeight={24} color="$mutedText">×</Text>
          </Pressable>
        </XStack>

        {/* Content */}
        <ScrollView
          style={{ flex: 1, maxHeight: modalMaxHeight - 65 }}
          showsVerticalScrollIndicator={false}
        >
          <YStack padding="$4">
            {children}
          </YStack>
        </ScrollView>
      </View>
    </View>
  )
}
