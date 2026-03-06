import { useState, useEffect, useRef } from 'react'
import { Platform, View } from 'react-native'
import { YStack, XStack, Text, useTheme } from 'tamagui'
import { Ionicons } from '@expo/vector-icons'
import { useTranslation } from '@mvp/i18n'
import { SlideIn } from '../animations/SlideIn'

const CHECKLIST = [
  { key: 'showcaseItem1', icon: 'search-outline' },
  { key: 'showcaseItem2', icon: 'notifications-outline' },
  { key: 'showcaseItem3', icon: 'sparkles-outline' },
  { key: 'showcaseItem4', icon: 'lock-closed-outline' },
  { key: 'showcaseItem5', icon: 'globe-outline' },
  { key: 'showcaseItem6', icon: 'card-outline' },
  { key: 'showcaseItem7', icon: 'terminal-outline' },
  { key: 'showcaseItem8', icon: 'rocket-outline' },
  { key: 'showcaseItem9', icon: 'cloud-upload-outline' },
  { key: 'showcaseItem10', icon: 'compass-outline' },
  { key: 'showcaseItem11', icon: 'extension-puzzle-outline' },
] as const

const CORE_STACK = [
  'Expo SDK 54', 'React Native 0.81', 'Tamagui v2', 'TypeScript', 'Zustand', 'Reanimated v4',
]

const INTEGRATIONS = [
  'Fastify v5', 'Drizzle ORM', 'PostgreSQL', 'Redis', 'Stripe', 'Nodemailer', 'TanStack Query', 'PostHog',
]

const ALL_TECH = [...CORE_STACK, ...INTEGRATIONS]

export function LandingShowcase() {
  const { t } = useTranslation()
  const theme = useTheme()
  const sectionRef = useRef<View>(null)
  const [isInView, setIsInView] = useState(false)
  const [visibleChecks, setVisibleChecks] = useState(0)
  const [visibleBadges, setVisibleBadges] = useState(0)

  // Intersection observer
  useEffect(() => {
    if (Platform.OS !== 'web') return
    const el = sectionRef.current as unknown as HTMLElement
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true)
          observer.disconnect()
        }
      },
      { threshold: 0.15 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  // Inject CSS keyframes
  useEffect(() => {
    if (Platform.OS !== 'web') return
    const style = document.createElement('style')
    style.textContent = `
      @keyframes showcaseCheckIn {
        from { opacity: 0; transform: translateX(-16px); }
        to { opacity: 1; transform: translateX(0); }
      }
      @keyframes showcaseBadgePop {
        from { opacity: 0; transform: scale(0.6); }
        to { opacity: 1; transform: scale(1); }
      }
      @media (max-width: 768px) {
        #showcase-title { font-size: 26px !important; }
        .showcase-card { min-width: 0 !important; }
      }
    `
    document.head.appendChild(style)
    return () => { document.head.removeChild(style) }
  }, [])

  // Stagger checklist items
  useEffect(() => {
    if (!isInView) return
    const interval = setInterval(() => {
      setVisibleChecks((prev) => {
        if (prev >= CHECKLIST.length) {
          clearInterval(interval)
          return prev
        }
        return prev + 1
      })
    }, 120)
    return () => clearInterval(interval)
  }, [isInView])

  // Stagger tech badges
  useEffect(() => {
    if (!isInView) return
    let intervalId: ReturnType<typeof setInterval> | undefined
    const timerId = setTimeout(() => {
      intervalId = setInterval(() => {
        setVisibleBadges((prev) => {
          if (prev >= ALL_TECH.length) {
            clearInterval(intervalId!)
            return prev
          }
          return prev + 1
        })
      }, 60)
    }, 200)
    return () => {
      clearTimeout(timerId)
      if (intervalId) clearInterval(intervalId)
    }
  }, [isInView])

  if (Platform.OS !== 'web') return null

  return (
    <YStack
      id="showcase"
      paddingVertical="$10"
      paddingHorizontal="$5"
      alignItems="center"
      backgroundColor="$subtleBackground"
    >
      <View ref={sectionRef} style={{ maxWidth: 1200, width: '100%', gap: 32 } as any}>
        <SlideIn from="bottom">
          <YStack alignItems="center" gap="$2">
            <Text nativeID="showcase-title" fontWeight="bold" fontSize={36} color="$color" textAlign="center">
              {t('landing.showcaseTitle')}
            </Text>
            <Text fontSize="$4" color="$mutedText" textAlign="center" maxWidth={500}>
              {t('landing.showcaseSubtitle')}
            </Text>
          </YStack>
        </SlideIn>

        <XStack flexWrap="wrap" gap="$5" justifyContent="center">
          {/* Checklist card */}
          <SlideIn from="left" delay={100}>
            <YStack
              className="showcase-card"
              backgroundColor="$cardBackground"
              borderRadius="$4"
              borderWidth={1}
              borderColor="$borderColor"
              padding="$5"
              gap="$3.5"
              style={{ minWidth: 360, flex: 1 } as any}
            >
              {CHECKLIST.map((item, i) => (
                <XStack
                  key={item.key}
                  gap="$3"
                  alignItems="center"
                  style={{
                    opacity: i < visibleChecks ? 1 : 0,
                    animation: i < visibleChecks ? 'showcaseCheckIn 0.35s ease-out both' : 'none',
                  } as any}
                >
                  <YStack
                    width={32}
                    height={32}
                    borderRadius={8}
                    alignItems="center"
                    justifyContent="center"
                    style={{
                      background: `linear-gradient(135deg, ${theme.accentGradientStart.val}20, ${theme.accentGradientEnd.val}20)`,
                    } as any}
                  >
                    <Ionicons name={item.icon as any} size={18} color={theme.accent.val} />
                  </YStack>
                  <Text fontSize="$4" color="$color">
                    {t(`landing.${item.key}` as any)}
                  </Text>
                </XStack>
              ))}
            </YStack>
          </SlideIn>

          {/* Tech stack card */}
          <SlideIn from="right" delay={200}>
            <YStack
              className="showcase-card"
              backgroundColor="$cardBackground"
              borderRadius="$4"
              borderWidth={1}
              borderColor="$borderColor"
              padding="$5"
              gap="$5"
              style={{ minWidth: 360, flex: 1 } as any}
            >
              {/* Core & Structure */}
              <YStack gap="$2.5">
                <XStack gap="$2" alignItems="center">
                  <Ionicons name="layers-outline" size={16} color={theme.accent.val} />
                  <Text fontWeight="bold" fontSize="$4" color="$color">Core & Structure</Text>
                </XStack>
                <XStack flexWrap="wrap" gap="$2.5">
                  {CORE_STACK.map((tech, i) => (
                    <XStack
                      key={tech}
                      paddingHorizontal="$3"
                      paddingVertical="$2"
                      borderRadius="$3"
                      borderWidth={1}
                      borderColor={`${theme.accent.val}30`}
                      style={{
                        opacity: i < visibleBadges ? 1 : 0,
                        animation: i < visibleBadges ? 'showcaseBadgePop 0.3s ease-out both' : 'none',
                        background: `linear-gradient(135deg, ${theme.accentGradientStart.val}08, ${theme.accentGradientEnd.val}08)`,
                      } as any}
                    >
                      <Text fontSize="$3" fontWeight="500" color="$color">{tech}</Text>
                    </XStack>
                  ))}
                </XStack>
              </YStack>

              {/* Backend & Integrations */}
              <YStack gap="$2.5">
                <XStack gap="$2" alignItems="center">
                  <Ionicons name="cloud-outline" size={16} color={theme.mutedText.val} />
                  <Text fontWeight="bold" fontSize="$4" color="$color">Backend & Integrations</Text>
                </XStack>
                <XStack flexWrap="wrap" gap="$2.5">
                  {INTEGRATIONS.map((tech, i) => {
                    const globalIdx = CORE_STACK.length + i
                    return (
                      <XStack
                        key={tech}
                        backgroundColor="$subtleBackground"
                        paddingHorizontal="$3"
                        paddingVertical="$2"
                        borderRadius="$3"
                        borderWidth={1}
                        borderColor="$borderColor"
                        style={{
                          opacity: globalIdx < visibleBadges ? 1 : 0,
                          animation: globalIdx < visibleBadges ? 'showcaseBadgePop 0.3s ease-out both' : 'none',
                        } as any}
                      >
                        <Text fontSize="$3" fontWeight="500" color="$color">{tech}</Text>
                      </XStack>
                    )
                  })}
                </XStack>
              </YStack>
            </YStack>
          </SlideIn>
        </XStack>
      </View>
    </YStack>
  )
}
