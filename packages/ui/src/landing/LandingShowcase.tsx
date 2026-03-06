import { useState, useEffect, useRef } from 'react'
import { Platform, View } from 'react-native'
import { YStack, XStack, Text, useTheme } from 'tamagui'
import { Ionicons } from '@expo/vector-icons'
import { useTranslation } from '@mvp/i18n'
import { SlideIn } from '../animations/SlideIn'

const CHECKLIST = [
  { key: 'showcaseItem1', icon: 'download-outline' },
  { key: 'showcaseItem2', icon: 'document-text-outline' },
  { key: 'showcaseItem3', icon: 'call-outline' },
  { key: 'showcaseItem4', icon: 'hand-left-outline' },
  { key: 'showcaseItem5', icon: 'headset-outline' },
  { key: 'showcaseItem6', icon: 'timer-outline' },
  { key: 'showcaseItem7', icon: 'create-outline' },
  { key: 'showcaseItem8', icon: 'save-outline' },
] as const

export function LandingShowcase() {
  const { t } = useTranslation()
  const theme = useTheme()
  const sectionRef = useRef<View>(null)
  const [isInView, setIsInView] = useState(false)
  const [visibleChecks, setVisibleChecks] = useState(0)

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
      @media (max-width: 768px) {
        #showcase-title { font-size: 26px !important; }
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

  if (Platform.OS !== 'web') return null

  return (
    <YStack
      id="showcase"
      paddingVertical="$10"
      paddingHorizontal="$5"
      alignItems="center"
      backgroundColor="$subtleBackground"
    >
      <View ref={sectionRef} style={{ maxWidth: 800, width: '100%', gap: 32 } as any}>
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

        <SlideIn from="bottom" delay={100}>
          <YStack
            backgroundColor="$cardBackground"
            borderRadius="$4"
            borderWidth={1}
            borderColor="$borderColor"
            padding="$5"
            gap="$3.5"
            alignSelf="center"
            style={{ maxWidth: 600, width: '100%' } as any}
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
                  width={36}
                  height={36}
                  borderRadius={10}
                  alignItems="center"
                  justifyContent="center"
                  style={{
                    background: `linear-gradient(135deg, ${theme.accentGradientStart.val}20, ${theme.accentGradientEnd.val}20)`,
                  } as any}
                >
                  <Text fontWeight="bold" fontSize="$4" color="$accent">
                    {i + 1}
                  </Text>
                </YStack>
                <Text fontSize="$4" color="$color" flex={1}>
                  {t(`landing.${item.key}` as any)}
                </Text>
              </XStack>
            ))}
          </YStack>
        </SlideIn>
      </View>
    </YStack>
  )
}