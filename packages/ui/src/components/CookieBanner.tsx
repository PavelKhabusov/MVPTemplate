import { useState, useEffect } from 'react'
import { Platform } from 'react-native'
import { YStack, XStack, Text } from 'tamagui'
import { AnimatePresence, MotiView } from 'moti'
import { useTranslation } from '@mvp/i18n'
import { useCookieConsentStore } from '@mvp/store'
import { router } from 'expo-router'
import { ScalePress } from '../animations/ScalePress'

export function CookieBanner() {
  const { t } = useTranslation()
  const consent = useCookieConsentStore((s) => s.consent)
  const setConsent = useCookieConsentStore((s) => s.setConsent)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (Platform.OS !== 'web' || consent !== null) return
    const timer = setTimeout(() => setVisible(true), 1500)
    return () => clearTimeout(timer)
  }, [consent])

  if (Platform.OS !== 'web') return null
  if (consent !== null) return null

  const handleAccept = () => {
    setVisible(false)
    setTimeout(() => setConsent('accepted'), 300)
  }

  const handleDecline = () => {
    setVisible(false)
    setTimeout(() => setConsent('declined'), 300)
  }

  return (
    <AnimatePresence>
      {visible && (
        <MotiView
          from={{ opacity: 0, translateY: 40 }}
          animate={{ opacity: 1, translateY: 0 }}
          exit={{ opacity: 0, translateY: 40 }}
          transition={{ type: 'timing', duration: 300 }}
          style={{
            position: 'fixed' as any,
            bottom: 20,
            left: 0,
            right: 0,
            zIndex: 9999,
            alignItems: 'center',
            pointerEvents: 'box-none',
          } as any}
        >
          <YStack
            backgroundColor="$cardBackground"
            borderRadius="$4"
            borderWidth={1}
            borderColor="$borderColor"
            padding="$4"
            gap="$3"
            maxWidth={560}
            width="90%"
            style={{
              boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
              backdropFilter: 'blur(12px)',
            } as any}
          >
            <Text fontSize="$3" color="$color" lineHeight={22}>
              {t('cookies.message')}
            </Text>

            <XStack alignItems="center" justifyContent="space-between" gap="$3">
              <ScalePress onPress={() => router.push('/privacy' as any)}>
                <Text
                  fontSize="$2"
                  color="$accent"
                  cursor="pointer"
                  hoverStyle={{ opacity: 0.8 } as any}
                >
                  {t('cookies.learnMore')}
                </Text>
              </ScalePress>

              <XStack gap="$2">
                <ScalePress onPress={handleDecline}>
                  <XStack
                    backgroundColor="transparent"
                    borderWidth={1}
                    borderColor="$borderColor"
                    borderRadius="$3"
                    paddingHorizontal="$3"
                    paddingVertical="$2"
                    alignItems="center"
                    cursor="pointer"
                    hoverStyle={{ backgroundColor: '$backgroundHover' } as any}
                  >
                    <Text fontSize="$2" color="$mutedText">
                      {t('cookies.decline')}
                    </Text>
                  </XStack>
                </ScalePress>

                <ScalePress onPress={handleAccept}>
                  <XStack
                    backgroundColor="$accent"
                    borderRadius="$3"
                    paddingHorizontal="$3.5"
                    paddingVertical="$2"
                    alignItems="center"
                    cursor="pointer"
                    hoverStyle={{ opacity: 0.9 } as any}
                  >
                    <Text fontSize="$2" color="$background" fontWeight="600">
                      {t('cookies.accept')}
                    </Text>
                  </XStack>
                </ScalePress>
              </XStack>
            </XStack>
          </YStack>
        </MotiView>
      )}
    </AnimatePresence>
  )
}
