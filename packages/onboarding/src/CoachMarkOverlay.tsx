import React from 'react'
import {
  Modal,
  Platform,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native'
import { YStack, XStack, Text, useTheme } from 'tamagui'
import { Ionicons } from '@expo/vector-icons'
import { MotiView } from 'moti'
import Svg, { Defs, Mask, Rect } from 'react-native-svg'
import { ScalePress } from '@mvp/ui'
import type { CoachMarkStep, CoachMarkLabels, SpotlightRect } from './CoachMarkContext'
import { useCoachMarkContext } from './CoachMarkContext'

const PAD = 10
const BORDER_RADIUS = 12
const TOOLTIP_MAX_WIDTH = 300
/** Conservative estimated max tooltip height — used for boundary clamping */
const TOOLTIP_HEIGHT_EST = 190

/**
 * Rendered automatically by CoachMarkProvider when a tour step is active.
 * Not meant to be used directly.
 */
export function CoachMarkOverlay() {
  const { _state, nextStep, dismissTour } = useCoachMarkContext()
  const { spotlightRect, steps, activeIndex, labels } = _state

  if (activeIndex === null || !spotlightRect || !steps[activeIndex]) return null

  return (
    <OverlayContent
      spotlightRect={spotlightRect}
      step={steps[activeIndex]}
      stepIndex={activeIndex}
      totalSteps={steps.length}
      labels={labels}
      onNext={nextStep}
      onDismiss={dismissTour}
    />
  )
}

interface OverlayContentProps {
  spotlightRect: SpotlightRect
  step: CoachMarkStep
  stepIndex: number
  totalSteps: number
  labels: CoachMarkLabels
  onNext: () => void
  onDismiss: () => void
}

function OverlayContent({
  spotlightRect: r,
  step,
  stepIndex,
  totalSteps,
  labels,
  onNext,
  onDismiss,
}: OverlayContentProps) {
  const { width: W, height: H } = useWindowDimensions()
  const theme = useTheme()

  // If spotlight is entirely off-screen, don't render
  if (r.y + r.height < -PAD || r.y > H + PAD) return null

  const isLast = stepIndex === totalSteps - 1
  const TOOLTIP_W = Math.min(TOOLTIP_MAX_WIDTH, W - 32)

  // Center tooltip horizontally over spotlight, clamped to screen edges
  const tooltipLeft = Math.max(
    16,
    Math.min(W - 16 - TOOLTIP_W, r.x + r.width / 2 - TOOLTIP_W / 2),
  )

  // Place tooltip above spotlight if center is in the bottom half of screen
  const spotlightCenterY = r.y + r.height / 2
  const isAbove = spotlightCenterY > H / 2

  // Compute preferred Y, then clamp so tooltip never leaves the screen
  const MARGIN = 16
  const preferredTop = isAbove
    ? r.y - PAD - MARGIN - TOOLTIP_HEIGHT_EST  // above element
    : r.y + r.height + PAD + MARGIN             // below element
  const tooltipTop = Math.max(MARGIN, Math.min(H - TOOLTIP_HEIGHT_EST - MARGIN, preferredTop))

  const overlayContent = (
    <View style={StyleSheet.absoluteFill}>
      {/* Semi-transparent overlay with spotlight cutout */}
      <Svg width={W} height={H} style={StyleSheet.absoluteFill}>
        <Defs>
          <Mask id="spotlight-mask">
            {/* White = show underlying content, black = hide with overlay */}
            <Rect width={W} height={H} fill="white" />
            <Rect
              x={r.x - PAD}
              y={r.y - PAD}
              width={r.width + PAD * 2}
              height={r.height + PAD * 2}
              rx={BORDER_RADIUS}
              fill="black"
            />
          </Mask>
        </Defs>
        <Rect width={W} height={H} fill="rgba(0,0,0,0.74)" mask="url(#spotlight-mask)" />
      </Svg>

      {/* Pulsing glow border around spotlight */}
      <MotiView
        from={{ scale: 1, opacity: 0.7 }}
        animate={{ scale: 1.1, opacity: 0 }}
        transition={{ type: 'timing', duration: 1400, loop: true }}
        style={{
          position: 'absolute',
          left: r.x - PAD - 2,
          top: r.y - PAD - 2,
          width: r.width + PAD * 2 + 4,
          height: r.height + PAD * 2 + 4,
          borderRadius: BORDER_RADIUS + 2,
          borderWidth: 2,
          borderColor: 'rgba(255,255,255,0.85)',
        }}
      />

      {/* Full-screen tap zone — advances tour */}
      <TouchableOpacity
        style={StyleSheet.absoluteFill}
        onPress={onNext}
        activeOpacity={1}
        accessibilityRole="button"
        accessibilityLabel={isLast ? (labels.done ?? 'Done') : (labels.next ?? 'Next')}
        accessibilityHint="Tap to advance tour"
      />

      {/* Tooltip — always within screen bounds */}
      <MotiView
        from={{ opacity: 0, translateY: isAbove ? 8 : -8 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'spring', damping: 18, stiffness: 120 }}
        style={{
          position: 'absolute',
          left: tooltipLeft,
          top: tooltipTop,
          width: TOOLTIP_W,
        }}
      >
        <YStack
          backgroundColor="$cardBackground"
          borderRadius="$4"
          padding="$4"
          gap="$2.5"
          borderWidth={1}
          borderColor="$borderColor"
          shadowColor="rgba(0,0,0,0.25)"
          shadowRadius={20}
          shadowOpacity={1}
          shadowOffset={{ width: 0, height: 6 }}
        >
          {/* Step counter */}
          <Text fontSize={11} color="$accent" fontWeight="700" letterSpacing={0.5}>
            {stepIndex + 1} / {totalSteps}
          </Text>

          {/* Title */}
          <Text fontSize="$4" fontWeight="700" color="$color">
            {step.title}
          </Text>

          {/* Description */}
          <Text fontSize="$3" color="$mutedText" lineHeight={20}>
            {step.description}
          </Text>

          {/* Actions */}
          <XStack justifyContent="flex-end" gap="$4" marginTop="$1">
            <ScalePress onPress={onDismiss} accessibilityLabel={labels.skip ?? 'Skip'}>
              <Text fontSize="$2" color="$mutedText">{labels.skip ?? 'Skip'}</Text>
            </ScalePress>
            <ScalePress onPress={onNext} accessibilityLabel={isLast ? (labels.done ?? 'Done') : (labels.next ?? 'Next')}>
              <XStack gap="$1.5" alignItems="center">
                <Text fontSize="$2" color="$accent" fontWeight="600">
                  {isLast ? (labels.done ?? 'Done') : (labels.next ?? 'Next')}
                </Text>
                {!isLast && (
                  <Ionicons name="arrow-forward" size={14} color={theme.accent.val} />
                )}
              </XStack>
            </ScalePress>
          </XStack>
        </YStack>
      </MotiView>
    </View>
  )

  // ── Web: fixed overlay (keeps React tree → fonts & theme tokens work) ──────
  if (Platform.OS === 'web') {
    return (
      <View
        // @ts-ignore — position: fixed is web-only
        style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 99998 }}
      >
        {overlayContent}
      </View>
    )
  }

  // ── Native: Modal ──────────────────────────────────────────────────────────
  return (
    <Modal transparent visible animationType="fade">
      {overlayContent}
    </Modal>
  )
}
