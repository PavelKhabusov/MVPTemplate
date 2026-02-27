import React, { type ReactNode, useEffect, useState } from 'react'
import { Modal, Platform, Pressable, ScrollView, useWindowDimensions } from 'react-native'
import { H4, Text, YStack, XStack, useTheme } from 'tamagui'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

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

  // Web: track mount state separately from `visible` so exit animation
  // plays before the element is removed from the DOM.
  const [mounted, setMounted] = useState(false)
  const [shown, setShown] = useState(false) // drives CSS transition

  useEffect(() => {
    if (Platform.OS !== 'web') return
    if (visible) {
      setMounted(true)
      // One rAF lets the browser paint the hidden state before transitioning in
      const id = requestAnimationFrame(() => setShown(true))
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
  if (!mounted || typeof document === 'undefined') return null

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { createPortal } = require('react-dom') as typeof import('react-dom')

  const modalWidth = isWide ? Math.min(maxWidth, screenWidth - 48) : screenWidth - 32
  const modalMaxHeight = screenHeight - insets.top - insets.bottom - 48
  const ease = '240ms cubic-bezier(0.32, 0.72, 0, 1)'

  return createPortal(
    // Outer div = backdrop (click to close) + transition overlay colour
    el('div', {
      onClick: onClose,
      style: {
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: shown ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0)',
        transition: `background-color ${ease}`,
      },
    },
      // Modal panel — stops click propagation; animates scale + fade
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
          boxShadow: '0 8px 40px rgba(0,0,0,0.18)',
          display: 'flex',
          flexDirection: 'column',
          opacity: shown ? 1 : 0,
          transform: shown ? 'scale(1) translateY(0px)' : 'scale(0.96) translateY(12px)',
          transition: `opacity ${ease}, transform ${ease}`,
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
          el(H4 as React.ComponentType<object>, {
            color: '$color',
            fontFamily: '$body',
            flex: 1,
            numberOfLines: 1,
            paddingRight: '$3',
          }, title),
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
              transition: 'opacity 150ms',
            },
            onMouseEnter: (e: MouseEvent) => { (e.target as HTMLElement).style.opacity = '0.6' },
            onMouseLeave: (e: MouseEvent) => { (e.target as HTMLElement).style.opacity = '1' },
          }, '×'),
        ),

        // Content
        el('div', {
          style: {
            overflowY: 'auto',
            flex: 1,
            maxHeight: modalMaxHeight - 65,
          },
        },
          el(YStack as React.ComponentType<object>, { padding: '$4' }, children),
        ),
      ),
    ),
    document.body,
  )
}
