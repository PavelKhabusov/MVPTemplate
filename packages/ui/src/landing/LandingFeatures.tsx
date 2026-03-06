import { useState, useEffect, useRef } from 'react'
import { Platform, View } from 'react-native'
import { YStack, XStack, Text, useTheme } from 'tamagui'
import { Ionicons } from '@expo/vector-icons'
import { useTranslation } from '@mvp/i18n'

const SHEET_ROWS = [
  { name: 'Ivan P.', phone: '+7 999 123-45-67', status: 'call', highlight: true },
  { name: 'Anna S.', phone: '+7 903 456-78-90', status: 'done', highlight: false },
  { name: 'Dmitry K.', phone: '+7 916 789-01-23', status: 'empty', highlight: false },
]

const WAVEFORM = [12, 24, 18, 36, 28, 42, 20, 38, 26, 44, 16, 32, 40, 22, 34, 30, 46, 18, 28, 36]

const BAR_HEIGHTS = [40, 65, 35, 80, 55, 70, 50, 90, 45, 75, 60, 85]

export function LandingFeatures() {
  const { t } = useTranslation()
  const theme = useTheme()
  const gridRef = useRef<View>(null)
  const [isInView, setIsInView] = useState(false)
  const [barAnimate, setBarAnimate] = useState(false)
  const [callTimer, setCallTimer] = useState(0)
  const [wavePhase, setWavePhase] = useState(0)
  const [saveStep, setSaveStep] = useState(0)

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

  // Animate chart bars
  useEffect(() => {
    if (!isInView) return
    const timer = setTimeout(() => setBarAnimate(true), 400)
    return () => clearTimeout(timer)
  }, [isInView])

  // Call timer animation (0→2:47)
  useEffect(() => {
    if (!isInView) return
    const interval = setInterval(() => {
      setCallTimer((t) => (t + 1) % 168)
    }, 300)
    return () => clearInterval(interval)
  }, [isInView])

  // Waveform phase
  useEffect(() => {
    if (!isInView) return
    const interval = setInterval(() => setWavePhase((p) => (p + 1) % WAVEFORM.length), 120)
    return () => clearInterval(interval)
  }, [isInView])

  // Auto-save step animation
  useEffect(() => {
    if (!isInView) return
    const interval = setInterval(() => setSaveStep((s) => (s + 1) % 5), 900)
    return () => clearInterval(interval)
  }, [isInView])

  // Inject CSS
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
        #bento-features > *:last-child {
          grid-column: span 2 !important;
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
        #feature-bar {
          flex-direction: column !important;
          gap: 20px !important;
          align-items: flex-start !important;
          padding-left: 8px !important;
        }
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
      @keyframes phonePulse {
        0%, 100% { box-shadow: 0 0 0 0px rgba(99,102,241,0.4); }
        50% { box-shadow: 0 0 0 6px rgba(99,102,241,0.1); }
      }
      @keyframes callblink {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.4; }
      }
    `
    document.head.appendChild(style)
    return () => { document.head.removeChild(style) }
  }, [])

  if (Platform.OS !== 'web') return null

  const gs = theme.accentGradientStart.val
  const ge = theme.accentGradientEnd.val
  const acc = theme.accent.val

  const callMinutes = Math.floor(callTimer / 60)
  const callSeconds = callTimer % 60
  const callTimeStr = `${callMinutes}:${callSeconds.toString().padStart(2, '0')}`

  const saveText = ['', 'A', 'An', 'Ans', 'Answ'][saveStep]

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
              {/* ── Phone Detection (wide) ── */}
              <View style={{ gridColumn: 'span 2', animation: 'bentoFadeUp 0.5s ease-out both' } as any}>
                <BentoCard>
                  {/* Mini spreadsheet */}
                  <YStack
                    borderRadius={10}
                    overflow="hidden"
                    borderWidth={1}
                    borderColor="$borderColor"
                    height={130}
                    style={{ backgroundColor: '#0d1117' } as any}
                  >
                    {/* Header */}
                    <XStack
                      paddingHorizontal="$3"
                      paddingVertical="$1.5"
                      style={{ backgroundColor: '#161b22', borderBottom: '1px solid #30363d' } as any}
                    >
                      {['Name', 'Phone', 'Status'].map((h) => (
                        <Text key={h} flex={1} fontSize={11} color="#8b949e" fontWeight="600" style={{ fontFamily: 'monospace' } as any}>
                          {h}
                        </Text>
                      ))}
                    </XStack>
                    {/* Rows */}
                    {SHEET_ROWS.map((row, i) => (
                      <XStack
                        key={i}
                        paddingHorizontal="$3"
                        paddingVertical="$1.5"
                        alignItems="center"
                        style={{
                          borderBottom: i < 2 ? '1px solid #21262d' : undefined,
                          backgroundColor: row.highlight ? `${acc}10` : undefined,
                        } as any}
                      >
                        <Text flex={1} fontSize={11} color={row.highlight ? '#e6edf3' : '#8b949e'} style={{ fontFamily: 'monospace' } as any}>
                          {row.name}
                        </Text>
                        <XStack flex={1} gap="$2" alignItems="center">
                          <Text
                            fontSize={11}
                            style={{
                              fontFamily: 'monospace',
                              color: row.highlight ? acc : '#8b949e',
                              ...(row.highlight ? { animation: 'callblink 1.8s ease-in-out infinite' } : {}),
                            } as any}
                          >
                            {row.phone}
                          </Text>
                        </XStack>
                        <XStack flex={1} alignItems="center" gap="$1.5">
                          {row.status === 'call' && (
                            <XStack
                              paddingHorizontal="$2"
                              paddingVertical="$0.5"
                              borderRadius={6}
                              alignItems="center"
                              gap="$1"
                              style={{ backgroundColor: `${acc}20`, animation: 'phonePulse 2s ease-in-out infinite' } as any}
                            >
                              <Ionicons name="call" size={10} color={acc} />
                              <Text fontSize={10} color={acc} fontWeight="600">Call</Text>
                            </XStack>
                          )}
                          {row.status === 'done' && (
                            <XStack paddingHorizontal="$2" paddingVertical="$0.5" borderRadius={6} alignItems="center" gap="$1" style={{ backgroundColor: '#16803120' } as any}>
                              <Ionicons name="checkmark" size={10} color="#4ade80" />
                              <Text fontSize={10} color="#4ade80" fontWeight="600">Done</Text>
                            </XStack>
                          )}
                          {row.status === 'empty' && (
                            <Text fontSize={11} color="#484f58">—</Text>
                          )}
                        </XStack>
                      </XStack>
                    ))}
                  </YStack>
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

              {/* ── WebRTC Call Widget ── */}
              <View style={{ animation: 'bentoFadeUp 0.5s ease-out both 0.1s' } as any}>
                <BentoCard fullHeight>
                  <YStack justifyContent="center" alignItems="center" height={130} gap="$3">
                    {/* Call popup */}
                    <YStack
                      borderRadius={16}
                      padding="$3"
                      gap="$2"
                      alignItems="center"
                      style={{ background: `linear-gradient(135deg, ${gs}15, ${ge}15)`, border: `1px solid ${acc}30`, width: 160 } as any}
                    >
                      {/* Avatar */}
                      <YStack
                        width={36} height={36} borderRadius={18}
                        alignItems="center" justifyContent="center"
                        style={{ background: `linear-gradient(135deg, ${gs}, ${ge})` } as any}
                      >
                        <Text fontSize={16}>И</Text>
                      </YStack>
                      <YStack alignItems="center" gap="$0.5">
                        <Text fontSize={12} color="$color" fontWeight="600">Ivan P.</Text>
                        <Text fontSize={11} color="$accent" fontWeight="700" style={{ fontVariantNumeric: 'tabular-nums' } as any}>
                          {callTimeStr}
                        </Text>
                      </YStack>
                      {/* Waveform */}
                      <XStack gap={2} alignItems="center" height={20}>
                        {WAVEFORM.slice(0, 12).map((h, i) => {
                          const animated = (i + wavePhase) % 4 === 0
                          return (
                            <View
                              key={i}
                              style={{
                                width: 3,
                                height: animated ? h * 0.45 : h * 0.2,
                                borderRadius: 2,
                                backgroundColor: animated ? acc : `${acc}50`,
                                transition: 'height 0.12s ease',
                              } as any}
                            />
                          )
                        })}
                      </XStack>
                    </YStack>
                  </YStack>
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

              {/* ── Callback Mode ── */}
              <View style={{ animation: 'bentoFadeUp 0.5s ease-out both 0.2s' } as any}>
                <BentoCard fullHeight>
                  <YStack justifyContent="center" alignItems="center" height={130}>
                    <XStack gap="$3" alignItems="center">
                      {/* Your phone */}
                      <YStack alignItems="center" gap="$1.5">
                        <YStack
                          width={44} height={44} borderRadius={14}
                          alignItems="center" justifyContent="center"
                          style={{ background: `linear-gradient(135deg, ${gs}20, ${ge}20)`, border: `1px solid ${acc}40` } as any}
                        >
                          <Ionicons name="phone-portrait-outline" size={22} color={acc} />
                        </YStack>
                        <Text fontSize={9} color="$mutedText" textAlign="center">Your{'\n'}phone</Text>
                      </YStack>
                      {/* Arrow */}
                      <YStack gap="$0.5" alignItems="center">
                        <Ionicons name="arrow-forward" size={14} color={`${acc}70`} />
                        <Ionicons name="arrow-forward" size={14} color={`${acc}70`} />
                      </YStack>
                      {/* Cloud */}
                      <YStack alignItems="center" gap="$1.5">
                        <YStack
                          width={44} height={44} borderRadius={14}
                          alignItems="center" justifyContent="center"
                          style={{ background: `linear-gradient(135deg, ${gs}, ${ge})` } as any}
                        >
                          <Ionicons name="cloud-outline" size={22} color="white" />
                        </YStack>
                        <Text fontSize={9} color="$mutedText" textAlign="center">CallSheet{'\n'}Cloud</Text>
                      </YStack>
                      {/* Arrow */}
                      <YStack gap="$0.5" alignItems="center">
                        <Ionicons name="arrow-forward" size={14} color={`${acc}70`} />
                        <Ionicons name="arrow-forward" size={14} color={`${acc}70`} />
                      </YStack>
                      {/* Client */}
                      <YStack alignItems="center" gap="$1.5">
                        <YStack
                          width={44} height={44} borderRadius={14}
                          alignItems="center" justifyContent="center"
                          style={{ background: `linear-gradient(135deg, ${gs}20, ${ge}20)`, border: `1px solid ${acc}40` } as any}
                        >
                          <Ionicons name="person-outline" size={22} color={acc} />
                        </YStack>
                        <Text fontSize={9} color="$mutedText" textAlign="center">Client{'\n'}phone</Text>
                      </YStack>
                    </XStack>
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

              {/* ── Auto-Save Results ── */}
              <View style={{ animation: 'bentoFadeUp 0.5s ease-out both 0.3s' } as any}>
                <BentoCard fullHeight>
                  <YStack
                    borderRadius={12} padding="$3" gap="$2"
                    height={130} justifyContent="center"
                    style={{ backgroundColor: '#0d1117' } as any}
                  >
                    <Text fontSize={10} color="#8b949e" style={{ fontFamily: 'monospace' } as any}>
                      Row 4 — updating...
                    </Text>
                    {[
                      { col: 'E', label: 'Status', value: saveStep >= 1 ? `${saveText}${saveStep < 4 ? '|' : ''}` : '|', color: acc },
                      { col: 'F', label: 'Duration', value: saveStep >= 2 ? '2:47' : '—', color: '#4ade80' },
                      { col: 'G', label: 'Note', value: saveStep >= 3 ? '"Interested, call back"' : '—', color: '#e6edf3' },
                      { col: 'H', label: 'Date', value: saveStep >= 4 ? '07.03.2026' : '—', color: '#8b949e' },
                    ].map(({ col, label, value, color }) => (
                      <XStack key={col} gap="$2" alignItems="center">
                        <Text fontSize={10} color="#484f58" style={{ fontFamily: 'monospace', width: 14 } as any}>{col}</Text>
                        <Text fontSize={10} color="#484f58" style={{ fontFamily: 'monospace', width: 60 } as any}>{label}</Text>
                        <Text fontSize={10} style={{ fontFamily: 'monospace', color } as any} numberOfLines={1}>{value}</Text>
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

              {/* ── Call Recording ── */}
              <View style={{ animation: 'bentoFadeUp 0.5s ease-out both 0.33s' } as any}>
                <BentoCard fullHeight>
                  <YStack justifyContent="center" alignItems="center" height={130} gap="$3">
                    {/* Waveform visualization */}
                    <XStack gap={3} alignItems="center" height={50}>
                      {WAVEFORM.map((h, i) => {
                        const animated = Math.abs(i - wavePhase % WAVEFORM.length) < 3
                        return (
                          <View
                            key={i}
                            style={{
                              width: 4,
                              height: animated ? h * 0.9 : h * 0.35,
                              borderRadius: 3,
                              background: animated
                                ? `linear-gradient(180deg, ${gs}, ${ge})`
                                : `${acc}30`,
                              transition: 'height 0.12s ease',
                            } as any}
                          />
                        )
                      })}
                    </XStack>
                    <XStack gap="$3" alignItems="center">
                      <YStack
                        width={36} height={36} borderRadius={18}
                        alignItems="center" justifyContent="center"
                        style={{ background: `linear-gradient(135deg, ${gs}, ${ge})` } as any}
                      >
                        <Ionicons name="play" size={16} color="white" />
                      </YStack>
                      <Text fontSize="$3" color="$mutedText">2:47 / 2:47</Text>
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

              {/* ── Call History (wide) ── */}
              <View style={{ gridColumn: 'span 3', animation: 'bentoFadeUp 0.5s ease-out both 0.35s' } as any}>
                <BentoCard>
                  <XStack gap="$4" alignItems="flex-end">
                    <YStack gap="$1" flex={1}>
                      <Text fontWeight="bold" fontSize="$5" color="$color">
                        {t('landing.featureAnalytics' as any)}
                      </Text>
                      <Text fontSize="$3" color="$mutedText" lineHeight={22}>
                        {t('landing.featureAnalyticsDesc' as any)}
                      </Text>
                      <XStack gap="$4" marginTop="$2">
                        <XStack gap="$1.5" alignItems="center">
                          <View style={{ width: 10, height: 10, borderRadius: 3, background: `linear-gradient(135deg, ${gs}, ${ge})` } as any} />
                          <Text fontSize="$2" color="$mutedText">Answered</Text>
                        </XStack>
                        <XStack gap="$1.5" alignItems="center">
                          <View style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: `${acc}30` } as any} />
                          <Text fontSize="$2" color="$mutedText">Missed</Text>
                        </XStack>
                      </XStack>
                    </YStack>
                    <XStack gap={4} alignItems="flex-end" height={70}>
                      {BAR_HEIGHTS.map((h, i) => (
                        <View
                          key={i}
                          style={{
                            width: 18,
                            height: barAnimate ? h * 0.75 : 0,
                            borderRadius: 4,
                            background: i % 5 === 3
                              ? `${acc}35`
                              : `linear-gradient(180deg, ${gs}, ${ge})`,
                            transition: `height 0.6s ease-out ${i * 0.05}s`,
                          } as any}
                        />
                      ))}
                    </XStack>
                  </XStack>
                </BentoCard>
              </View>
            </>
          ) : (
            <>
              <View style={{ gridColumn: 'span 2', height: 280, opacity: 0 } as any} />
              <View style={{ height: 280, opacity: 0 } as any} />
              <View style={{ height: 280, opacity: 0 } as any} />
              <View style={{ height: 280, opacity: 0 } as any} />
              <View style={{ height: 280, opacity: 0 } as any} />
              <View style={{ gridColumn: 'span 3', height: 120, opacity: 0 } as any} />
            </>
          )}
        </View>

        {/* ── Feature bar ── */}
        {isInView && (
          <View
            style={{
              display: 'flex' as any,
              flexDirection: 'row',
              justifyContent: 'center',
              gap: 48,
              paddingTop: 8,
              animation: 'bentoFadeUp 0.5s ease-out both 0.45s',
            } as any}
            nativeID="feature-bar"
          >
            {[
              { icon: 'save-outline' as const, titleKey: 'landing.featureAuth', tags: 'Status · Duration · Notes · Date' },
              { icon: 'gift-outline' as const, titleKey: 'landing.featurePayments', tags: '30 free calls/month · PRO unlimited' },
              { icon: 'grid-outline' as const, titleKey: 'landing.featureExtension', tags: 'Any Google Sheet · Auto-detect columns' },
            ].map((item, idx) => (
              <XStack key={item.titleKey} gap="$3" alignItems="center">
                {idx > 0 && (
                  <View style={{ width: 1, height: 32, backgroundColor: `${acc}20`, marginRight: 12 } as any} />
                )}
                <YStack
                  width={40} height={40} borderRadius={12}
                  alignItems="center" justifyContent="center"
                  style={{ background: `linear-gradient(135deg, ${gs}18, ${ge}18)` } as any}
                >
                  <Ionicons name={item.icon} size={20} color={acc} />
                </YStack>
                <YStack gap={2}>
                  <Text fontWeight="bold" fontSize="$4" color="$color">
                    {t(item.titleKey as any)}
                  </Text>
                  <Text fontSize="$2" color="$mutedText">
                    {item.tags}
                  </Text>
                </YStack>
              </XStack>
            ))}
          </View>
        )}
      </YStack>
    </YStack>
  )
}

/* ── Reusable bento card wrapper ── */
function BentoCard({
  children,
  fullHeight,
}: {
  children: React.ReactNode
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