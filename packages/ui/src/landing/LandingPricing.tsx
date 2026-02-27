import { useState, useEffect, useCallback } from 'react'
import { Platform, View } from 'react-native'
import { YStack, XStack, Text, useTheme } from 'tamagui'
import { Ionicons } from '@expo/vector-icons'
import { useTranslation } from '@mvp/i18n'
import { SlideIn } from '../animations/SlideIn'
import { FadeIn } from '../animations/FadeIn'
import { ScalePress } from '../animations/ScalePress'

interface LandingPlan {
  id: string
  name: string
  description?: string
  priceAmount: number
  currency: string
  interval: string
  features: string[]
  sortOrder: number
}

interface LandingPricingProps {
  onNavigate: (href: string) => void
  plans?: LandingPlan[]
}

function formatPrice(amount: number, currency: string, t: (key: string) => string): string {
  if (amount === 0) return t('payments.free')
  const value = amount / 100
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: currency.toUpperCase(),
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value)
}

export function LandingPricing({ onNavigate, plans = [] }: LandingPricingProps) {
  const { t } = useTranslation()
  const theme = useTheme()
  const [billingInterval, setBillingInterval] = useState<'month' | 'year'>('month')

  const hasIntervalOptions = plans.some((p) => p.interval === 'month') && plans.some((p) => p.interval === 'year')

  const filteredPlans = hasIntervalOptions
    ? plans.filter((p) => p.interval === billingInterval || p.interval === 'one_time')
    : plans

  const sortedPlans = [...filteredPlans].sort((a, b) => a.sortOrder - b.sortOrder)

  const highlightedIdx = sortedPlans.length >= 2 ? Math.floor(sortedPlans.length / 2) : 0

  // Savings %
  const savingsPercent = (() => {
    if (!hasIntervalOptions) return 0
    const monthlyPlans = plans.filter((p) => p.interval === 'month')
    const yearlyPlans = plans.filter((p) => p.interval === 'year')
    if (!monthlyPlans.length || !yearlyPlans.length) return 0
    const avgMonthly = monthlyPlans.reduce((s, p) => s + p.priceAmount, 0) / monthlyPlans.length
    const avgYearly = yearlyPlans.reduce((s, p) => s + p.priceAmount, 0) / yearlyPlans.length
    if (avgMonthly === 0) return 0
    return Math.round(((avgMonthly - avgYearly / 12) / avgMonthly) * 100)
  })()

  // CSS injection for section
  useEffect(() => {
    if (Platform.OS !== 'web') return
    const style = document.createElement('style')
    style.textContent = `
      .landing-pricing-card {
        transition: transform 0.25s ease, box-shadow 0.25s ease;
      }
      .landing-pricing-card:hover {
        transform: translateY(-4px);
      }
      .landing-pricing-card-popular {
        transform: translateY(-8px);
      }
      .landing-pricing-card-popular:hover {
        transform: translateY(-12px);
      }
      @keyframes pricingPopularGlow {
        0%, 100% { box-shadow: 0 0 32px 4px rgba(0,200,180,0.18), 0 8px 32px rgba(0,0,0,0.2); }
        50% { box-shadow: 0 0 48px 8px rgba(0,200,180,0.30), 0 8px 32px rgba(0,0,0,0.2); }
      }
      .landing-pricing-glow { animation: pricingPopularGlow 3s ease-in-out infinite; }
      @media (max-width: 768px) {
        .landing-pricing-card-popular { transform: translateY(0) !important; }
        .landing-pricing-card-popular:hover { transform: translateY(-4px) !important; }
      }
    `
    document.head.appendChild(style)
    return () => { document.head.removeChild(style) }
  }, [])

  if (Platform.OS !== 'web') return null

  const intervalLabel = (interval: string) => {
    if (interval === 'month') return t('payments.perMonth')
    if (interval === 'year') return t('payments.perYear')
    return ''
  }

  const trustItems = [
    { icon: 'shield-checkmark-outline' as const, label: t('payments.securePayments') },
    { icon: 'refresh-outline' as const, label: t('payments.guarantee') },
    { icon: 'close-circle-outline' as const, label: t('payments.cancelAnytime') },
  ]

  return (
    <YStack
      nativeID="pricing"
      paddingVertical="$12"
      paddingHorizontal="$5"
      alignItems="center"
      style={{
        background: `radial-gradient(ellipse at 50% 0%, ${theme.accentGradientStart.val}10 0%, transparent 70%), ${theme.background.val}`,
        position: 'relative',
        overflow: 'hidden',
      } as any}
    >
      {/* Background decoration */}
      <View
        style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: `radial-gradient(ellipse at 80% 50%, ${theme.accentGradientEnd.val}08 0%, transparent 60%)`,
        } as any}
      />

      <YStack maxWidth={1100} width="100%" gap="$8" alignItems="center">
        {/* Header */}
        <SlideIn from="bottom">
          <YStack alignItems="center" gap="$3" maxWidth={600}>
            <XStack
              backgroundColor={`${theme.accent.val}15`}
              paddingHorizontal="$3"
              paddingVertical="$1.5"
              borderRadius={20}
              borderWidth={1}
              borderColor={`${theme.accent.val}30`}
            >
              <Text color="$accent" fontSize="$2" fontWeight="600">
                {t('landing.navPricing')}
              </Text>
            </XStack>

            <Text
              fontWeight="800"
              fontSize={40}
              color="$color"
              textAlign="center"
              letterSpacing={-1}
              lineHeight={46}
            >
              {t('landing.pricingTitle')}
            </Text>
            <Text fontSize="$4" color="$mutedText" textAlign="center" lineHeight={26}>
              {t('landing.pricingSubtitle')}
            </Text>
          </YStack>
        </SlideIn>

        {/* Interval toggle */}
        {sortedPlans.length > 0 && hasIntervalOptions && (
          <FadeIn>
            <YStack alignItems="center" gap="$2">
              <XStack
                backgroundColor="$subtleBackground"
                borderRadius="$4"
                padding="$1"
                borderWidth={1}
                borderColor="$borderColor"
              >
                <ScalePress onPress={() => setBillingInterval('month')}>
                  <XStack
                    paddingHorizontal="$5"
                    paddingVertical="$2.5"
                    borderRadius="$3"
                    alignItems="center"
                    backgroundColor={billingInterval === 'month' ? '$cardBackground' : 'transparent'}
                    style={billingInterval === 'month' ? { boxShadow: '0 1px 4px rgba(0,0,0,0.1)' } as any : {}}
                  >
                    <Text
                      fontSize="$3"
                      fontWeight={billingInterval === 'month' ? '700' : '500'}
                      color={billingInterval === 'month' ? '$color' : '$mutedText'}
                    >
                      {t('landing.pricingMonthly')}
                    </Text>
                  </XStack>
                </ScalePress>

                <ScalePress onPress={() => setBillingInterval('year')}>
                  <XStack
                    paddingHorizontal="$5"
                    paddingVertical="$2.5"
                    borderRadius="$3"
                    alignItems="center"
                    gap="$2"
                    backgroundColor={billingInterval === 'year' ? '$cardBackground' : 'transparent'}
                    style={billingInterval === 'year' ? { boxShadow: '0 1px 4px rgba(0,0,0,0.1)' } as any : {}}
                  >
                    <Text
                      fontSize="$3"
                      fontWeight={billingInterval === 'year' ? '700' : '500'}
                      color={billingInterval === 'year' ? '$color' : '$mutedText'}
                    >
                      {t('landing.pricingYearly')}
                    </Text>
                    {savingsPercent > 0 && (
                      <XStack
                        backgroundColor={billingInterval === 'year' ? '$accent' : `${theme.accent.val}25`}
                        borderRadius="$2"
                        paddingHorizontal="$1.5"
                        paddingVertical={2}
                      >
                        <Text
                          fontSize={10}
                          fontWeight="700"
                          color={billingInterval === 'year' ? 'white' : '$accent'}
                        >
                          -{savingsPercent}%
                        </Text>
                      </XStack>
                    )}
                  </XStack>
                </ScalePress>
              </XStack>
            </YStack>
          </FadeIn>
        )}

        {/* Cards */}
        {sortedPlans.length > 0 ? (
          <XStack
            gap="$4"
            justifyContent="center"
            alignItems="flex-start"
            flexWrap="wrap"
            width="100%"
          >
            {sortedPlans.map((plan, idx) => {
              const isPopular = idx === highlightedIdx && sortedPlans.length >= 2
              return (
                <LandingPricingCard
                  key={plan.id}
                  plan={plan}
                  isPopular={isPopular}
                  intervalLabel={intervalLabel(plan.interval)}
                  savingsPercent={billingInterval === 'year' && plan.interval === 'year' ? savingsPercent : 0}
                  onSelect={() => onNavigate('/pricing')}
                  theme={theme}
                  t={t}
                  formatPrice={formatPrice}
                />
              )
            })}
          </XStack>
        ) : (
          /* Placeholder when no plans configured — show demo cards */
          <PlaceholderCards theme={theme} t={t} onNavigate={onNavigate} />
        )}

        {/* Trust signals */}
        <FadeIn>
          <XStack gap="$6" justifyContent="center" flexWrap="wrap">
            {trustItems.map(({ icon, label }) => (
              <XStack key={label} alignItems="center" gap="$2">
                <Ionicons name={icon} size={16} color={theme.mutedText.val} />
                <Text fontSize="$3" color="$mutedText">{label}</Text>
              </XStack>
            ))}
          </XStack>
        </FadeIn>
      </YStack>
    </YStack>
  )
}

// Individual card for the landing section
function LandingPricingCard({
  plan, isPopular, intervalLabel, savingsPercent, onSelect, theme, t, formatPrice,
}: {
  plan: LandingPlan
  isPopular: boolean
  intervalLabel: string
  savingsPercent: number
  onSelect: () => void
  theme: any
  t: (key: string, opts?: any) => string
  formatPrice: (amount: number, currency: string, t: any) => string
}) {
  return (
    <YStack
      flex={1}
      minWidth={260}
      maxWidth={360}
      borderRadius="$5"
      overflow="hidden"
      className={isPopular
        ? 'landing-pricing-card landing-pricing-card-popular landing-pricing-glow'
        : 'landing-pricing-card'}
      style={isPopular ? {
        borderWidth: 1.5,
        borderColor: `${theme.accent.val}60`,
        background: `linear-gradient(160deg, ${theme.accentGradientStart.val}22 0%, ${theme.cardBackground.val} 40%)`,
      } as any : {
        borderWidth: 1,
        borderColor: theme.borderColor.val,
        backgroundColor: theme.cardBackground.val,
        boxShadow: '0 2px 16px rgba(0,0,0,0.08)',
      } as any}
    >
      {/* Popular badge */}
      {isPopular && (
        <XStack
          paddingVertical="$2"
          justifyContent="center"
          alignItems="center"
          gap="$1.5"
          style={{
            background: `linear-gradient(90deg, ${theme.accentGradientStart.val}, ${theme.accentGradientEnd.val})`,
          } as any}
        >
          <Ionicons name="star" size={11} color="white" />
          <Text color="white" fontSize={11} fontWeight="700" textTransform="uppercase" letterSpacing={1}>
            {t('payments.popular')}
          </Text>
        </XStack>
      )}

      <YStack gap="$4" padding="$5">
        {/* Name + description */}
        <YStack gap="$1.5">
          <Text fontWeight="700" fontSize="$6" color="$color" letterSpacing={-0.3}>
            {plan.name}
          </Text>
          {plan.description && (
            <Text fontSize="$3" color="$mutedText" numberOfLines={2} lineHeight={20}>
              {plan.description}
            </Text>
          )}
        </YStack>

        {/* Price */}
        <YStack gap="$1">
          <XStack alignItems="flex-end" gap="$1.5">
            <Text
              fontWeight="800"
              fontSize={44}
              color={isPopular ? '$accent' : '$color'}
              letterSpacing={-2}
              lineHeight={48}
            >
              {formatPrice(plan.priceAmount, plan.currency, t)}
            </Text>
            {plan.priceAmount > 0 && plan.interval !== 'one_time' && (
              <Text fontSize="$3" color="$mutedText" fontWeight="500" paddingBottom={6}>
                {intervalLabel}
              </Text>
            )}
          </XStack>
          {savingsPercent > 0 && (
            <XStack alignItems="center" gap="$1.5">
              <XStack
                backgroundColor={`${theme.accent.val}20`}
                borderRadius="$2"
                paddingHorizontal="$2"
                paddingVertical={2}
              >
                <Text fontSize={11} fontWeight="700" color="$accent">
                  {t('payments.savePercent', { percent: savingsPercent })}
                </Text>
              </XStack>
              <Text fontSize={11} color="$mutedText">{t('payments.billedYearly')}</Text>
            </XStack>
          )}
        </YStack>

        {/* Divider */}
        <View style={{
          height: 1,
          backgroundColor: isPopular ? `${theme.accent.val}20` : theme.borderColor.val,
        }} />

        {/* Features */}
        {plan.features.length > 0 && (
          <YStack gap="$2.5">
            <Text fontSize="$2" fontWeight="600" color="$mutedText" textTransform="uppercase" letterSpacing={0.5}>
              {t('payments.features')}
            </Text>
            {plan.features.map((feature) => (
              <XStack key={feature} alignItems="flex-start" gap="$2.5">
                <YStack
                  width={20}
                  height={20}
                  borderRadius={10}
                  alignItems="center"
                  justifyContent="center"
                  marginTop={1}
                  flexShrink={0}
                  style={isPopular ? {
                    background: `linear-gradient(135deg, ${theme.accentGradientStart.val}, ${theme.accentGradientEnd.val})`,
                  } as any : {
                    backgroundColor: `${theme.accent.val}15`,
                  } as any}
                >
                  <Ionicons name="checkmark" size={11} color={isPopular ? '#fff' : theme.accent.val} />
                </YStack>
                <Text fontSize="$3" color="$color" flex={1} lineHeight={22}>{feature}</Text>
              </XStack>
            ))}
          </YStack>
        )}

        {/* CTA */}
        <ScalePress onPress={onSelect}>
          <XStack
            paddingVertical="$3.5"
            borderRadius="$4"
            justifyContent="center"
            alignItems="center"
            gap="$2"
            style={isPopular ? {
              background: `linear-gradient(135deg, ${theme.accentGradientStart.val}, ${theme.accentGradientEnd.val})`,
            } as any : {
              borderWidth: 1.5,
              borderColor: `${theme.accent.val}50`,
              backgroundColor: `${theme.accent.val}08`,
            } as any}
          >
            <Text
              fontWeight="700"
              fontSize="$4"
              color={isPopular ? 'white' : '$accent'}
            >
              {t('payments.getStarted')}
            </Text>
            <Ionicons
              name="arrow-forward"
              size={16}
              color={isPopular ? 'white' : theme.accent.val}
            />
          </XStack>
        </ScalePress>
      </YStack>
    </YStack>
  )
}

// Placeholder cards shown when no plans are configured yet
function PlaceholderCards({
  theme, t, onNavigate,
}: {
  theme: any
  t: (key: string) => string
  onNavigate: (href: string) => void
}) {
  const plans = [
    {
      name: 'Starter',
      price: '$9',
      interval: t('payments.perMonth'),
      features: ['Core features', 'Up to 5 users', 'Email support', '10 GB storage'],
      isPopular: false,
    },
    {
      name: 'Pro',
      price: '$29',
      interval: t('payments.perMonth'),
      features: ['All Starter features', 'Unlimited users', 'Priority support', '100 GB storage', 'Advanced analytics'],
      isPopular: true,
    },
    {
      name: 'Enterprise',
      price: '$99',
      interval: t('payments.perMonth'),
      features: ['All Pro features', 'Custom integrations', 'SLA guarantee', 'Dedicated support', 'Unlimited storage'],
      isPopular: false,
    },
  ]

  return (
    <XStack gap="$4" justifyContent="center" alignItems="flex-start" flexWrap="wrap" width="100%">
      {plans.map((plan, idx) => (
        <YStack
          key={plan.name}
          flex={1}
          minWidth={260}
          maxWidth={360}
          borderRadius="$5"
          overflow="hidden"
          className={plan.isPopular
            ? 'landing-pricing-card landing-pricing-card-popular landing-pricing-glow'
            : 'landing-pricing-card'}
          style={plan.isPopular ? {
            borderWidth: 1.5,
            borderColor: `${theme.accent.val}60`,
            background: `linear-gradient(160deg, ${theme.accentGradientStart.val}22 0%, ${theme.cardBackground.val} 40%)`,
          } as any : {
            borderWidth: 1,
            borderColor: theme.borderColor.val,
            backgroundColor: theme.cardBackground.val,
            boxShadow: '0 2px 16px rgba(0,0,0,0.08)',
          } as any}
        >
          {plan.isPopular && (
            <XStack
              paddingVertical="$2"
              justifyContent="center"
              alignItems="center"
              gap="$1.5"
              style={{
                background: `linear-gradient(90deg, ${theme.accentGradientStart.val}, ${theme.accentGradientEnd.val})`,
              } as any}
            >
              <Ionicons name="star" size={11} color="white" />
              <Text color="white" fontSize={11} fontWeight="700" textTransform="uppercase" letterSpacing={1}>
                {t('payments.popular')}
              </Text>
            </XStack>
          )}
          <YStack gap="$4" padding="$5">
            <Text fontWeight="700" fontSize="$6" color="$color" letterSpacing={-0.3}>{plan.name}</Text>
            <XStack alignItems="flex-end" gap="$1.5">
              <Text
                fontWeight="800"
                fontSize={44}
                color={plan.isPopular ? '$accent' : '$color'}
                letterSpacing={-2}
                lineHeight={48}
              >
                {plan.price}
              </Text>
              <Text fontSize="$3" color="$mutedText" fontWeight="500" paddingBottom={6}>{plan.interval}</Text>
            </XStack>
            <View style={{ height: 1, backgroundColor: plan.isPopular ? `${theme.accent.val}20` : theme.borderColor.val }} />
            <YStack gap="$2.5">
              <Text fontSize="$2" fontWeight="600" color="$mutedText" textTransform="uppercase" letterSpacing={0.5}>
                {t('payments.features')}
              </Text>
              {plan.features.map((f) => (
                <XStack key={f} alignItems="flex-start" gap="$2.5">
                  <YStack
                    width={20} height={20} borderRadius={10}
                    alignItems="center" justifyContent="center" marginTop={1} flexShrink={0}
                    style={plan.isPopular ? {
                      background: `linear-gradient(135deg, ${theme.accentGradientStart.val}, ${theme.accentGradientEnd.val})`,
                    } as any : { backgroundColor: `${theme.accent.val}15` } as any}
                  >
                    <Ionicons name="checkmark" size={11} color={plan.isPopular ? '#fff' : theme.accent.val} />
                  </YStack>
                  <Text fontSize="$3" color="$color" flex={1} lineHeight={22}>{f}</Text>
                </XStack>
              ))}
            </YStack>
            <ScalePress onPress={() => onNavigate('/sign-up')}>
              <XStack
                paddingVertical="$3.5" borderRadius="$4"
                justifyContent="center" alignItems="center" gap="$2"
                style={plan.isPopular ? {
                  background: `linear-gradient(135deg, ${theme.accentGradientStart.val}, ${theme.accentGradientEnd.val})`,
                } as any : {
                  borderWidth: 1.5,
                  borderColor: `${theme.accent.val}50`,
                  backgroundColor: `${theme.accent.val}08`,
                } as any}
              >
                <Text fontWeight="700" fontSize="$4" color={plan.isPopular ? 'white' : '$accent'}>
                  {t('payments.getStarted')}
                </Text>
                <Ionicons name="arrow-forward" size={16} color={plan.isPopular ? 'white' : theme.accent.val} />
              </XStack>
            </ScalePress>
          </YStack>
        </YStack>
      ))}
    </XStack>
  )
}
