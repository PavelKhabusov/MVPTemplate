import React from 'react'
import { Modal, Platform } from 'react-native'
import { YStack, XStack, Text, useTheme } from 'tamagui'
import {
  ArrowRight, HelpCircle,
  Rocket, BookOpen, CreditCard, Compass, Sparkles,
  Mail, CheckCircle2, Terminal, BarChart3, TrendingUp,
  Bell, Info, MessageCircle, Search, Settings, Star,
} from 'lucide-react-native'
import type { LucideIcon } from 'lucide-react-native'
import { AnimatePresence, MotiView } from 'moti'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ScalePress, AppModal } from '@mvp/ui'
import { trackOnboardingStep, trackOnboardingComplete, trackOnboardingSkip } from '@mvp/analytics'

const WIZARD_ICON_MAP: Record<string, LucideIcon> = {
  'rocket': Rocket,
  'book-open': BookOpen,
  'credit-card': CreditCard,
  'compass': Compass,
  'sparkles': Sparkles,
  'mail': Mail,
  'check-circle': CheckCircle2,
  'terminal': Terminal,
  'bar-chart': BarChart3,
  'trending-up': TrendingUp,
  'bell': Bell,
  'info': Info,
  'message-circle': MessageCircle,
  'search': Search,
  'settings': Settings,
  'star': Star,
  'help-circle': HelpCircle,
  'arrow-right': ArrowRight,
}

export interface WizardStep {
  id: string
  icon: string
  title: string
  description: string
}

export interface OnboardingWizardProps {
  visible: boolean
  steps: WizardStep[]
  onComplete: () => void
  onSkip: () => void
  labels?: {
    skip?: string
    next?: string
    complete?: string
  }
}

export function OnboardingWizard({
  visible,
  steps,
  onComplete,
  onSkip,
  labels = {},
}: OnboardingWizardProps) {
  const insets = useSafeAreaInsets()
  const theme = useTheme()
  const [currentIndex, setCurrentIndex] = React.useState(0)

  const { skip = 'Skip', next = 'Next', complete = 'Get Started' } = labels
  const isLast = currentIndex === steps.length - 1
  const isWeb = Platform.OS === 'web'

  const handleSkip = () => {
    trackOnboardingSkip(currentIndex + 1)
    onSkip()
  }

  const handleNext = () => {
    if (isLast) {
      trackOnboardingComplete()
      onComplete()
      return
    }
    const nextIndex = currentIndex + 1
    trackOnboardingStep(nextIndex + 1, steps.length)
    setCurrentIndex(nextIndex)
  }

  // Reset index when wizard becomes invisible (re-show from start next time)
  React.useEffect(() => {
    if (!visible) setCurrentIndex(0)
  }, [visible])

  if (!visible) return null

  // ── Bottom bar (shared between native and web) ─────────────────────────────
  const bottomBar = (
    <YStack gap="$4" alignItems="center" alignSelf="stretch">
      {/* Progress dots */}
      <XStack gap="$2" alignItems="center">
        {steps.map((_, idx) => (
          <ProgressDot key={idx} active={idx === currentIndex} />
        ))}
      </XStack>

      {/* CTA */}
      <ScalePress onPress={handleNext} style={{ width: '100%' as any }}>
        <XStack
          backgroundColor="$accent"
          borderRadius="$5"
          paddingVertical="$4"
          alignItems="center"
          justifyContent="center"
          gap="$2"
        >
          <Text color="white" fontWeight="700" fontSize="$4">
            {isLast ? complete : next}
          </Text>
          {!isLast && <ArrowRight size={18} color="white" />}
        </XStack>
      </ScalePress>
    </YStack>
  )

  // ── Web: centered dialog via AppModal ─────────────────────────────────────
  if (isWeb) {
    const StepIcon = WIZARD_ICON_MAP[steps[currentIndex].icon] || HelpCircle
    return (
      <AppModal visible onClose={handleSkip} title="" maxWidth={480}>
        <YStack gap="$5" alignItems="center" paddingVertical="$2">
          {/* Icon */}
          <AnimatePresence>
            <MotiView
              key={`icon-${currentIndex}`}
              from={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ type: 'timing', duration: 200 }}
            >
              <YStack width={100} height={100} alignItems="center" justifyContent="center">
                <YStack
                  position="absolute"
                  width={100}
                  height={100}
                  borderRadius={50}
                  backgroundColor="$accent"
                  opacity={0.12}
                />
                <StepIcon size={44} color={theme.accent.val} />
              </YStack>
            </MotiView>
          </AnimatePresence>

          {/* Title + description */}
          <AnimatePresence>
            <MotiView
              key={`text-${currentIndex}`}
              from={{ opacity: 0, translateY: 8 }}
              animate={{ opacity: 1, translateY: 0 }}
              exit={{ opacity: 0 }}
              transition={{ type: 'timing', duration: 200 }}
            >
              <YStack gap="$2" alignItems="center">
                <Text fontSize="$6" fontWeight="700" color="$color" textAlign="center">
                  {steps[currentIndex].title}
                </Text>
                <Text fontSize="$3" color="$mutedText" textAlign="center" lineHeight={22}>
                  {steps[currentIndex].description}
                </Text>
              </YStack>
            </MotiView>
          </AnimatePresence>

          {bottomBar}
        </YStack>
      </AppModal>
    )
  }

  // ── Native: full-screen ────────────────────────────────────────────────────
  return (
    <Modal visible animationType="fade" statusBarTranslucent>
      <YStack flex={1} backgroundColor="$background">
        {/* Skip */}
        <XStack position="absolute" top={insets.top + 16} right={20} zIndex={10}>
          <ScalePress onPress={handleSkip}>
            <XStack padding="$2.5">
              <Text color="$mutedText" fontSize="$3">{skip}</Text>
            </XStack>
          </ScalePress>
        </XStack>

        {/* Step content */}
        <YStack flex={1} overflow="hidden">
          <AnimatePresence>
            <MotiView
              key={currentIndex}
              from={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ type: 'timing', duration: 200 }}
              style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
            >
              <StepContent step={steps[currentIndex]} insetTop={insets.top} />
            </MotiView>
          </AnimatePresence>
        </YStack>

        {/* Bottom bar */}
        <YStack
          paddingBottom={Math.max(insets.bottom, 16) + 24}
          paddingHorizontal="$5"
          gap="$5"
          alignItems="center"
        >
          {bottomBar}
        </YStack>
      </YStack>
    </Modal>
  )
}

function StepContent({ step, insetTop }: { step: WizardStep; insetTop: number }) {
  const theme = useTheme()
  const StepIcon = WIZARD_ICON_MAP[step.icon] || HelpCircle
  return (
    <YStack
      flex={1}
      alignItems="center"
      justifyContent="center"
      paddingHorizontal="$6"
      gap="$8"
      paddingTop={insetTop + 60}
      paddingBottom="$4"
    >
      {/* Icon */}
      <MotiView
        from={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', damping: 16, stiffness: 100, delay: 60 }}
      >
        <YStack width={128} height={128} alignItems="center" justifyContent="center">
          <YStack
            position="absolute"
            width={128}
            height={128}
            borderRadius={64}
            backgroundColor="$accent"
            opacity={0.12}
          />
          <StepIcon size={56} color={theme.accent.val} />
        </YStack>
      </MotiView>

      {/* Text */}
      <MotiView
        from={{ opacity: 0, translateY: 20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 350, delay: 120 }}
      >
        <YStack gap="$3" alignItems="center">
          <Text fontSize="$8" fontWeight="700" color="$color" textAlign="center">
            {step.title}
          </Text>
          <Text fontSize="$4" color="$mutedText" textAlign="center" lineHeight={24}>
            {step.description}
          </Text>
        </YStack>
      </MotiView>
    </YStack>
  )
}

function ProgressDot({ active }: { active: boolean }) {
  const theme = useTheme()
  return (
    <MotiView
      animate={{ width: active ? 24 : 8, opacity: active ? 1 : 0.35 }}
      transition={{ type: 'spring', damping: 18, stiffness: 140 }}
      style={{ height: 8, borderRadius: 4, backgroundColor: theme.accent.val }}
    />
  )
}
