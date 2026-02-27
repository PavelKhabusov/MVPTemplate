import { useState, useEffect, useRef } from 'react'
import { Platform, View } from 'react-native'
import { YStack, XStack, Text, useTheme } from 'tamagui'
import { Ionicons } from '@expo/vector-icons'
import { useTranslation } from '@mvp/i18n'

const GREETINGS = [
  { text: 'Hello', lang: 'EN' },
  { text: 'Привет', lang: 'RU' },
  { text: 'Hola', lang: 'ES' },
  { text: '今日は', lang: 'JA' },
]

const API_ROUTES = [
  { method: 'POST', color: '#f0883e', path: '/api/auth/login' },
  { method: 'GET', color: '#7ee787', path: '/api/users' },
  { method: 'POST', color: '#f0883e', path: '/api/payments/checkout' },
  { method: 'WS', color: '#d2a8ff', path: '/api/events/sse' },
]

const BAR_HEIGHTS = [40, 65, 35, 80, 55, 70, 50, 90, 45, 75, 60, 85]

export function LandingFeatures() {
  const { t } = useTranslation()
  const theme = useTheme()
  const gridRef = useRef<View>(null)
  const [isInView, setIsInView] = useState(false)
  const [greetIdx, setGreetIdx] = useState(0)
  const [barAnimate, setBarAnimate] = useState(false)

  // Intersection observer
  useEffect(() => {
    if (Platform.OS !== 'web') return
    const el = gridRef.current as unknown as HTMLElement
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true)
          observer.disconnect()
        }
      },
      { threshold: 0.1 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  // Cycling greeting
  useEffect(() => {
    if (!isInView) return
    const interval = setInterval(() => setGreetIdx((i) => (i + 1) % GREETINGS.length), 2200)
    return () => clearInterval(interval)
  }, [isInView])

  // Animate chart bars
  useEffect(() => {
    if (!isInView) return
    const timer = setTimeout(() => setBarAnimate(true), 400)
    return () => clearTimeout(timer)
  }, [isInView])

  // Inject CSS for responsive grid, hover, animations
  useEffect(() => {
    if (Platform.OS !== 'web') return
    const style = document.createElement('style')
    style.textContent = `
      @media (max-width: 800px) {
        #bento-features {
          grid-template-columns: 1fr 1fr !important;
        }
        #bento-features > * {
          grid-column: span 1 !important;
        }
      }
      @media (max-width: 600px) {
        #bento-features {
          grid-template-columns: 1fr !important;
        }
        #bento-features > * {
          grid-column: span 1 !important;
        }
        #features-title { font-size: 26px !important; }
      }
      .bento-card {
        transition: transform 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease;
        cursor: default;
      }
      .bento-card:hover {
        transform: translateY(-4px);
      }
      @keyframes bentoFadeUp {
        from { opacity: 0; transform: translateY(24px); }
        to { opacity: 1; transform: translateY(0); }
      }
      @keyframes greetCycle {
        0% { opacity: 0; transform: translateY(10px); }
        12% { opacity: 1; transform: translateY(0); }
        88% { opacity: 1; transform: translateY(0); }
        100% { opacity: 0; transform: translateY(-10px); }
      }
      @keyframes deviceGlow {
        0%, 100% { opacity: 0.7; }
        50% { opacity: 1; }
      }
    `
    document.head.appendChild(style)
    return () => { document.head.removeChild(style) }
  }, [])

  if (Platform.OS !== 'web') return null

  const gs = theme.accentGradientStart.val
  const ge = theme.accentGradientEnd.val
  const acc = theme.accent.val

  return (
    <YStack id="features" paddingVertical="$10" paddingHorizontal="$5" alignItems="center">
      <YStack maxWidth={1200} width="100%" gap="$8">
        <YStack alignItems="center" gap="$2">
          <Text nativeID="features-title" fontWeight="bold" fontSize={36} color="$color" textAlign="center">
            {t('landing.featuresTitle')}
          </Text>
          <Text fontSize="$4" color="$mutedText" textAlign="center" maxWidth={500}>
            {t('landing.featuresSubtitle')}
          </Text>
        </YStack>

        <View
          ref={gridRef}
          nativeID="bento-features"
          style={{
            display: 'grid' as any,
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 16,
            width: '100%',
          } as any}
        >
          {isInView ? (
            <>
              {/* ── Cross-Platform (wide) ── */}
              <View style={{ gridColumn: 'span 2', animation: 'bentoFadeUp 0.5s ease-out both' } as any}>
                <BentoCard theme={theme}>
                  <XStack gap="$4" justifyContent="center" alignItems="flex-end" height={120}>
                    {/* Phone */}
                    <YStack
                      width={48} height={80} borderRadius={8}
                      borderWidth={2} borderColor={`${acc}40`}
                      alignItems="center" justifyContent="center"
                      style={{ animation: 'deviceGlow 3s ease-in-out infinite', background: `linear-gradient(180deg, ${gs}15, ${ge}15)` } as any}
                    >
                      <YStack width={28} height={50} borderRadius={4} style={{ background: `linear-gradient(135deg, ${gs}40, ${ge}40)` } as any} />
                    </YStack>
                    {/* Tablet */}
                    <YStack
                      width={80} height={100} borderRadius={10}
                      borderWidth={2} borderColor={`${acc}40`}
                      alignItems="center" justifyContent="center"
                      style={{ animation: 'deviceGlow 3s ease-in-out infinite 0.5s', background: `linear-gradient(180deg, ${gs}15, ${ge}15)` } as any}
                    >
                      <YStack width={60} height={72} borderRadius={4} style={{ background: `linear-gradient(135deg, ${gs}40, ${ge}40)` } as any} />
                    </YStack>
                    {/* Desktop */}
                    <YStack
                      width={130} height={90} borderRadius={8}
                      borderWidth={2} borderColor={`${acc}40`}
                      alignItems="center" justifyContent="center"
                      style={{ animation: 'deviceGlow 3s ease-in-out infinite 1s', background: `linear-gradient(180deg, ${gs}15, ${ge}15)` } as any}
                    >
                      <YStack width={110} height={65} borderRadius={4} style={{ background: `linear-gradient(135deg, ${gs}40, ${ge}40)` } as any} />
                    </YStack>
                  </XStack>
                  <YStack gap="$1">
                    <Text fontWeight="bold" fontSize="$5" color="$color">
                      {t('landing.featureCrossPlatform' as any)}
                    </Text>
                    <Text fontSize="$3" color="$mutedText" lineHeight={22}>
                      {t('landing.featureCrossPlatformDesc' as any)}
                    </Text>
                  </YStack>
                </BentoCard>
              </View>

              {/* ── Theming ── */}
              <View style={{ animation: 'bentoFadeUp 0.5s ease-out both 0.1s' } as any}>
                <BentoCard theme={theme} fullHeight>
                  <XStack justifyContent="center" alignItems="center" height={120} gap="$3">
                    {/* Light card */}
                    <YStack
                      width={60} height={80} borderRadius={12}
                      borderWidth={1} borderColor="#e0e0e0"
                      backgroundColor="white" padding="$2" gap="$1.5"
                    >
                      <YStack height={8} borderRadius={4} style={{ background: '#e0e0e0' } as any} />
                      <YStack height={8} borderRadius={4} width="70%" style={{ background: '#e0e0e0' } as any} />
                      <YStack flex={1} borderRadius={6} style={{ background: `linear-gradient(135deg, ${gs}30, ${ge}30)` } as any} />
                    </YStack>
                    <Ionicons name="swap-horizontal" size={20} color={acc} />
                    {/* Dark card */}
                    <YStack
                      width={60} height={80} borderRadius={12}
                      borderWidth={1} borderColor="#333"
                      padding="$2" gap="$1.5"
                      style={{ backgroundColor: '#1a1a2e' } as any}
                    >
                      <YStack height={8} borderRadius={4} style={{ background: '#333' } as any} />
                      <YStack height={8} borderRadius={4} width="70%" style={{ background: '#333' } as any} />
                      <YStack flex={1} borderRadius={6} style={{ background: `linear-gradient(135deg, ${gs}50, ${ge}50)` } as any} />
                    </YStack>
                  </XStack>
                  <YStack gap="$1">
                    <Text fontWeight="bold" fontSize="$5" color="$color">
                      {t('landing.featureTheming' as any)}
                    </Text>
                    <Text fontSize="$3" color="$mutedText" lineHeight={22}>
                      {t('landing.featureThemingDesc' as any)}
                    </Text>
                  </YStack>
                </BentoCard>
              </View>

              {/* ── i18n ── */}
              <View style={{ animation: 'bentoFadeUp 0.5s ease-out both 0.2s' } as any}>
                <BentoCard theme={theme} fullHeight>
                  <YStack justifyContent="center" alignItems="center" height={120}>
                    <YStack
                      borderRadius={16} paddingHorizontal="$5" paddingVertical="$3"
                      style={{ background: `linear-gradient(135deg, ${gs}12, ${ge}12)` } as any}
                    >
                      <Text
                        key={greetIdx}
                        fontSize={28} fontWeight="bold" color="$accent" textAlign="center"
                        style={{ animation: 'greetCycle 2.2s ease-in-out' } as any}
                      >
                        {GREETINGS[greetIdx].text}
                      </Text>
                      <Text fontSize="$2" color="$mutedText" textAlign="center" marginTop="$1">
                        {GREETINGS[greetIdx].lang}
                      </Text>
                    </YStack>
                  </YStack>
                  <YStack gap="$1">
                    <Text fontWeight="bold" fontSize="$5" color="$color">
                      {t('landing.featureI18n' as any)}
                    </Text>
                    <Text fontSize="$3" color="$mutedText" lineHeight={22}>
                      {t('landing.featureI18nDesc' as any)}
                    </Text>
                  </YStack>
                </BentoCard>
              </View>

              {/* ── Auth ── */}
              <View style={{ animation: 'bentoFadeUp 0.5s ease-out both 0.25s' } as any}>
                <BentoCard theme={theme} fullHeight>
                  <YStack justifyContent="center" alignItems="center" height={120} gap="$2.5">
                    <YStack
                      width={64} height={64} borderRadius={32}
                      alignItems="center" justifyContent="center"
                      style={{ background: `linear-gradient(135deg, ${gs}25, ${ge}25)` } as any}
                    >
                      <Ionicons name="shield-checkmark" size={32} color={acc} />
                    </YStack>
                    <XStack gap="$2" flexWrap="wrap" justifyContent="center">
                      <YStack
                        paddingHorizontal="$2" paddingVertical="$1" borderRadius={8}
                        borderWidth={1} borderColor="$borderColor" backgroundColor="$subtleBackground"
                      >
                        <Text fontSize={11} color="$mutedText">Email + JWT</Text>
                      </YStack>
                      <YStack
                        paddingHorizontal="$2" paddingVertical="$1" borderRadius={8}
                        borderWidth={1} borderColor="$borderColor" backgroundColor="$subtleBackground"
                      >
                        <Text fontSize={11} color="$mutedText">Google SSO</Text>
                      </YStack>
                      <YStack
                        paddingHorizontal="$2" paddingVertical="$1" borderRadius={8}
                        borderWidth={1} borderColor="$borderColor" backgroundColor="$subtleBackground"
                      >
                        <Text fontSize={11} color="$mutedText">SMS OTP</Text>
                      </YStack>
                    </XStack>
                  </YStack>
                  <YStack gap="$1">
                    <Text fontWeight="bold" fontSize="$5" color="$color">
                      {t('landing.featureAuth' as any)}
                    </Text>
                    <Text fontSize="$3" color="$mutedText" lineHeight={22}>
                      {t('landing.featureAuthDesc' as any)}
                    </Text>
                  </YStack>
                </BentoCard>
              </View>

              {/* ── Payments ── */}
              <View style={{ animation: 'bentoFadeUp 0.5s ease-out both 0.28s' } as any}>
                <BentoCard theme={theme} fullHeight>
                  <YStack justifyContent="center" alignItems="center" height={120} gap="$2.5">
                    <YStack
                      width={64} height={64} borderRadius={32}
                      alignItems="center" justifyContent="center"
                      style={{ background: `linear-gradient(135deg, ${gs}25, ${ge}25)` } as any}
                    >
                      <Ionicons name="card" size={32} color={acc} />
                    </YStack>
                    <XStack gap="$2" flexWrap="wrap" justifyContent="center">
                      <YStack
                        paddingHorizontal="$2" paddingVertical="$1" borderRadius={8}
                        borderWidth={1} borderColor="$borderColor" backgroundColor="$subtleBackground"
                      >
                        <Text fontSize={11} color="$mutedText">Stripe</Text>
                      </YStack>
                      <YStack
                        paddingHorizontal="$2" paddingVertical="$1" borderRadius={8}
                        borderWidth={1} borderColor="$borderColor" backgroundColor="$subtleBackground"
                      >
                        <Text fontSize={11} color="$mutedText">PayPal</Text>
                      </YStack>
                      <YStack
                        paddingHorizontal="$2" paddingVertical="$1" borderRadius={8}
                        borderWidth={1} borderColor="$borderColor" backgroundColor="$subtleBackground"
                      >
                        <Text fontSize={11} color="$mutedText">YooKassa</Text>
                      </YStack>
                    </XStack>
                  </YStack>
                  <YStack gap="$1">
                    <Text fontWeight="bold" fontSize="$5" color="$color">
                      {t('landing.featurePayments' as any)}
                    </Text>
                    <Text fontSize="$3" color="$mutedText" lineHeight={22}>
                      {t('landing.featurePaymentsDesc' as any)}
                    </Text>
                  </YStack>
                </BentoCard>
              </View>

              {/* ── Backend API ── */}
              <View style={{ animation: 'bentoFadeUp 0.5s ease-out both 0.3s' } as any}>
                <BentoCard theme={theme} fullHeight>
                  <YStack
                    borderRadius={12} padding="$3" gap="$1.5"
                    height={120} justifyContent="center"
                    style={{ backgroundColor: '#0d1117' } as any}
                  >
                    {API_ROUTES.map((route) => (
                      <XStack key={route.path} gap="$2" alignItems="center">
                        <Text
                          fontSize={11} fontWeight="bold" color={route.color}
                          style={{ fontFamily: 'monospace', width: 36 } as any}
                        >
                          {route.method}
                        </Text>
                        <Text fontSize={11} color="#8b949e" style={{ fontFamily: 'monospace' } as any}>
                          {route.path}
                        </Text>
                      </XStack>
                    ))}
                  </YStack>
                  <YStack gap="$1">
                    <Text fontWeight="bold" fontSize="$5" color="$color">
                      {t('landing.featureBackend' as any)}
                    </Text>
                    <Text fontSize="$3" color="$mutedText" lineHeight={22}>
                      {t('landing.featureBackendDesc' as any)}
                    </Text>
                  </YStack>
                </BentoCard>
              </View>

              {/* ── Onboarding ── */}
              <View style={{ animation: 'bentoFadeUp 0.5s ease-out both 0.33s' } as any}>
                <BentoCard theme={theme} fullHeight>
                  <YStack justifyContent="center" alignItems="center" height={120} gap="$4">
                    <YStack
                      width={72} height={72} borderRadius={36}
                      alignItems="center" justifyContent="center"
                      style={{ background: `linear-gradient(135deg, ${gs}25, ${ge}25)` } as any}
                    >
                      <Ionicons name="compass" size={36} color={acc} />
                    </YStack>
                    {/* Progress dots */}
                    <XStack gap="$2" alignItems="center">
                      {[0, 1, 2, 3].map((i) => (
                        <View
                          key={i}
                          style={{
                            width: i === 0 ? 24 : 8,
                            height: 8,
                            borderRadius: 4,
                            backgroundColor: i === 0 ? acc : `${acc}40`,
                          } as any}
                        />
                      ))}
                    </XStack>
                  </YStack>
                  <YStack gap="$1">
                    <Text fontWeight="bold" fontSize="$5" color="$color">
                      {t('landing.featureOnboarding' as any)}
                    </Text>
                    <Text fontSize="$3" color="$mutedText" lineHeight={22}>
                      {t('landing.featureOnboardingDesc' as any)}
                    </Text>
                  </YStack>
                </BentoCard>
              </View>

              {/* ── Analytics ── */}
              <View style={{ animation: 'bentoFadeUp 0.5s ease-out both 0.35s' } as any}>
                <BentoCard theme={theme} fullHeight>
                  <XStack gap={5} alignItems="flex-end" height={120} justifyContent="center">
                    {BAR_HEIGHTS.map((h, i) => (
                      <View
                        key={i}
                        style={{
                          width: 14,
                          height: barAnimate ? h : 0,
                          borderRadius: 4,
                          background: `linear-gradient(180deg, ${gs}, ${ge})`,
                          transition: `height 0.6s ease-out ${i * 0.05}s`,
                        } as any}
                      />
                    ))}
                  </XStack>
                  <YStack gap="$1">
                    <Text fontWeight="bold" fontSize="$5" color="$color">
                      {t('landing.featureAnalytics' as any)}
                    </Text>
                    <Text fontSize="$3" color="$mutedText" lineHeight={22}>
                      {t('landing.featureAnalyticsDesc' as any)}
                    </Text>
                  </YStack>
                </BentoCard>
              </View>
            </>
          ) : (
            <>
              {/* Row 1: span2 + 1 */}
              <View style={{ gridColumn: 'span 2', height: 280, opacity: 0 } as any} />
              <View style={{ height: 280, opacity: 0 } as any} />
              {/* Row 2: 1+1+1 */}
              <View style={{ height: 280, opacity: 0 } as any} />
              <View style={{ height: 280, opacity: 0 } as any} />
              <View style={{ height: 280, opacity: 0 } as any} />
              {/* Row 3: 1+1+1 */}
              <View style={{ height: 280, opacity: 0 } as any} />
              <View style={{ height: 280, opacity: 0 } as any} />
              <View style={{ height: 280, opacity: 0 } as any} />
            </>
          )}
        </View>
      </YStack>
    </YStack>
  )
}

/* ── Reusable bento card wrapper ── */
function BentoCard({
  children,
  theme,
  fullHeight,
}: {
  children: React.ReactNode
  theme: ReturnType<typeof useTheme>
  fullHeight?: boolean
}) {
  return (
    <YStack
      backgroundColor="$cardBackground"
      borderRadius="$4"
      borderWidth={1}
      borderColor="$borderColor"
      padding="$5"
      gap="$4"
      className="bento-card"
      hoverStyle={{ borderColor: '$accent' } as any}
      style={fullHeight ? { height: '100%' } as any : undefined}
    >
      {children}
    </YStack>
  )
}
