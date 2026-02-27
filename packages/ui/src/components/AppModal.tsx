import React, { type ReactNode, useEffect } from 'react'
import { Modal, Platform, Pressable, ScrollView, useWindowDimensions } from 'react-native'
import { H4, Text, YStack, XStack, useTheme } from 'tamagui'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

// Shorthand to avoid JSX HTML-element TypeScript errors in RN project
const el = React.createElement

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

  // Escape key — web only
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
  if (!visible || typeof document === 'undefined') return null

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { createPortal } = require('react-dom') as typeof import('react-dom')

  const modalWidth = isWide ? Math.min(maxWidth, screenWidth - 48) : screenWidth - 32
  const modalMaxHeight = screenHeight - insets.top - insets.bottom - 48

  // We use React.createElement('div'/'button') instead of JSX to avoid
  // TypeScript errors from the React Native JSX type environment.
  // Native DOM onClick / stopPropagation is 100% reliable — unlike
  // RNW Pressable which ignores CSS z-index in its responder system.
  return createPortal(
    el('div', {
      style: {
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      },
    },
      // Backdrop
      el('div', {
        onClick: onClose,
        style: {
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          cursor: 'pointer',
        },
      }),

      // Modal panel — rendered after backdrop in DOM → same stacking context,
      // higher paint order → receives pointer events first.
      el('div', {
        onClick: (e: MouseEvent) => e.stopPropagation(),
        style: {
          position: 'relative',
          zIndex: 1,
          width: modalWidth,
          maxHeight: modalMaxHeight,
          backgroundColor: theme.background.val,
          borderRadius: 16,
          overflow: 'hidden',
          boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
          display: 'flex',
          flexDirection: 'column',
        },
      },
        // Header
        el('div', {
          style: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px',
            paddingBottom: '12px',
            borderBottom: `1px solid ${theme.borderColor.val}`,
            flexShrink: 0,
          },
        },
          el(H4, { color: '$color', fontFamily: '$body', flex: 1, numberOfLines: 1, paddingRight: '$3' } as object, title),
          el('button', {
            onClick: onClose,
            style: {
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: 24,
              lineHeight: 1,
              color: theme.mutedText.val,
              padding: '4px 8px',
              borderRadius: 8,
              flexShrink: 0,
            },
          }, '×'),
        ),

        // Scrollable content
        el('div', {
          style: {
            overflowY: 'auto',
            flex: 1,
            maxHeight: modalMaxHeight - 65,
          },
        },
          el(YStack, { padding: '$4' } as object, children),
        ),
      ),
    ),
    document.body,
  )
}
