import { useState, useEffect, useCallback, useMemo } from 'react'
import { Platform, ScrollView, Linking, Alert, TouchableOpacity, useWindowDimensions, View } from 'react-native'
import { YStack, XStack, Text, useTheme } from 'tamagui'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTranslation } from '@mvp/i18n'
import { AppButton, FadeIn, ScalePress } from '@mvp/ui'
import { Ionicons } from '@expo/vector-icons'
import { PricingCard, SubscriptionBadge } from '@mvp/payments'
import type { Plan, Subscription } from '@mvp/payments'
import { api } from '../src/services/api'

export default function PricingScreen() {
  const { t } = useTranslation()
  const theme = useTheme()
  const insets = useSafeAreaInsets()
  const { width } = useWindowDimensions()
  const [plans, setPlans] = useState<Plan[]>([])
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null)
  const [canceling, setCanceling] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [billingInterval, setBillingInterval] = useState<'month' | 'year'>('month')

  const isWide = Platform.OS === 'web' && width > 768

  useEffect(() => {
    if (Platform.OS === 'web') {
      const params = new URLSearchParams(window.location.search)
      if (params.get('success') === 'true') {
        setShowSuccess(true)
        window.history.replaceState({}, '', window.location.pathname)
      }
    }
  }, [])

  const fetchData = useCallback(async (signal?: AbortSignal) => {
    try {
      setLoading(true)
      const [plansRes, subRes] = await Promise.all([
        api.get('/payments/plans', { signal }),
        api.get('/payments/subscription', { signal }).catch(() => null),
      ])
      setPlans(plansRes.data.data ?? [])
      setSubscription(subRes?.data?.data ?? null)
    } catch (err: any) {
      if (err?.name !== 'CanceledError' && err?.name !== 'AbortError') {
        // ignore silently
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    fetchData(controller.signal)
    return () => controller.abort()
  }, [fetchData])

  const hasIntervalOptions = useMemo(() => {
    const hasMonthly = plans.some((p) => p.interval === 'month')
    const hasYearly = plans.some((p) => p.interval === 'year')
    return hasMonthly && hasYearly
  }, [plans])

  const filteredPlans = useMemo(() => {
    if (!hasIntervalOptions) return plans
    return plans.filter((p) => p.interval === billingInterval || p.interval === 'one_time')
  }, [plans, billingInterval, hasIntervalOptions])

  const highlightedPlanId = useMemo(() => {
    if (filteredPlans.length < 2) return null
    const sorted = [...filteredPlans].sort((a, b) => a.sortOrder - b.sortOrder)
    return sorted[Math.floor(sorted.length / 2)]?.id ?? null
  }, [filteredPlans])

  // Calculate yearly savings vs monthly
  const savingsPercent = useMemo(() => {
    if (!hasIntervalOptions) return 0
    const monthlyPlans = plans.filter((p) => p.interval === 'month')
    const yearlyPlans = plans.filter((p) => p.interval === 'year')
    if (!monthlyPlans.length || !yearlyPlans.length) return 0
    const avgMonthly = monthlyPlans.reduce((s, p) => s + p.priceAmount, 0) / monthlyPlans.length
    const avgYearly = yearlyPlans.reduce((s, p) => s + p.priceAmount, 0) / yearlyPlans.length
    const monthlyEquiv = avgYearly / 12
    if (avgMonthly === 0) return 0
    return Math.round(((avgMonthly - monthlyEquiv) / avgMonthly) * 100)
  }, [plans, hasIntervalOptions])

  const handleSelect = async (planId: string) => {
    setCheckoutLoading(planId)
    try {
      const baseUrl = Platform.OS === 'web' ? window.location.origin : 'https://localhost:8081'
      const res = await api.post('/payments/checkout', {
        planId,
        successUrl: `${baseUrl}/pricing?success=true`,
        cancelUrl: `${baseUrl}/pricing`,
      })
      const { checkoutUrl } = res.data.data
      if (Platform.OS === 'web') {
        window.location.href = checkoutUrl
      } else {
        await Linking.openURL(checkoutUrl)
      }
    } catch (err: any) {
      Alert.alert(t('common.error'), err.response?.data?.message ?? t('common.retry'))
    } finally {
      setCheckoutLoading(null)
    }
  }

  const handleCancel = async () => {
    const doCancel = async () => {
      setCanceling(true)
      try {
        await api.post('/payments/cancel')
        await fetchData()
      } catch (err: any) {
        Alert.alert(t('common.error'), err.response?.data?.message ?? t('common.retry'))
      } finally {
        setCanceling(false)
      }
    }

    if (Platform.OS === 'web') {
      if (window.confirm(t('payments.cancelConfirm'))) doCancel()
    } else {
      Alert.alert(t('payments.cancelSubscription'), t('payments.cancelConfirm'), [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('payments.cancelSubscription'), style: 'destructive', onPress: doCancel },
      ])
    }
  }

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ paddingBottom: insets.bottom + 40, paddingTop: 8 }}
    >
      <FadeIn>
        <YStack gap="$6" alignItems="center">
          {/* Header */}
          <YStack alignItems="center" gap="$2" paddingTop="$6" paddingHorizontal={20} maxWidth={560} alignSelf="center">
            <Text fontWeight="800" fontSize={34} color="$color" textAlign="center" letterSpacing={-0.8} lineHeight={40}>
              {t('payments.title')}
            </Text>
            <Text color="$mutedText" fontSize="$4" textAlign="center" lineHeight={24}>
              {t('payments.subtitle')}
            </Text>
          </YStack>

          {/* Success banner */}
          {showSuccess && (
            <XStack
              borderRadius="$4"
              padding="$4"
              gap="$3"
              alignItems="center"
              marginHorizontal={16}
              alignSelf={isWide ? 'center' : 'stretch'}
              maxWidth={600}
              {...(isWide ? { width: '100%' as any } : {})}
              style={{ background: 'linear-gradient(135deg, #059669, #047857)' } as any}
            >
              <Ionicons name="checkmark-circle" size={24} color="white" />
              <YStack flex={1} gap="$0.5">
                <Text fontWeight="700" color="white" fontSize="$4">{t('payments.successTitle')}</Text>
                <Text color="white" fontSize="$2" opacity={0.9}>{t('payments.successMessage')}</Text>
              </YStack>
              <TouchableOpacity onPress={() => setShowSuccess(false)}>
                <Ionicons name="close" size={20} color="white" />
              </TouchableOpacity>
            </XStack>
          )}

          {/* Current subscription */}
          {subscription && (
            <YStack
              backgroundColor="$subtleBackground"
              borderRadius="$4"
              padding="$4"
              gap="$3"
              marginHorizontal={16}
              alignSelf={isWide ? 'center' : 'stretch'}
              maxWidth={600}
              borderWidth={1}
              borderColor="$borderColor"
              {...(isWide ? { width: '100%' as any } : {})}
            >
              <XStack alignItems="center" justifyContent="space-between">
                <SubscriptionBadge subscription={subscription} />
              </XStack>
              <Text color="$mutedText" fontSize="$2">
                {subscription.cancelAtPeriodEnd
                  ? t('payments.expiresOn', { date: new Date(subscription.currentPeriodEnd).toLocaleDateString() })
                  : t('payments.renewsOn', { date: new Date(subscription.currentPeriodEnd).toLocaleDateString() })}
              </Text>
              {!subscription.cancelAtPeriodEnd && (
                <AppButton variant="outline" size="sm" onPress={handleCancel} loading={canceling}>
                  {t('payments.cancelSubscription')}
                </AppButton>
              )}
            </YStack>
          )}

          {/* Billing interval toggle */}
          {!loading && hasIntervalOptions && (
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
                    backgroundColor={billingInterval === 'month' ? '$cardBackground' : 'transparent'}
                    paddingHorizontal="$4"
                    paddingVertical="$2.5"
                    borderRadius="$3"
                    alignItems="center"
                    gap="$1.5"
                    style={billingInterval === 'month' ? {
                      boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
                    } as any : {}}
                  >
                    <Text
                      fontWeight={billingInterval === 'month' ? '700' : '500'}
                      color={billingInterval === 'month' ? '$color' : '$mutedText'}
                      fontSize="$3"
                    >
                      {t('landing.pricingMonthly')}
                    </Text>
                  </XStack>
                </ScalePress>
                <ScalePress onPress={() => setBillingInterval('year')}>
                  <XStack
                    backgroundColor={billingInterval === 'year' ? '$cardBackground' : 'transparent'}
                    paddingHorizontal="$4"
                    paddingVertical="$2.5"
                    borderRadius="$3"
                    alignItems="center"
                    gap="$1.5"
                    style={billingInterval === 'year' ? {
                      boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
                    } as any : {}}
                  >
                    <Text
                      fontWeight={billingInterval === 'year' ? '700' : '500'}
                      color={billingInterval === 'year' ? '$color' : '$mutedText'}
                      fontSize="$3"
                    >
                      {t('landing.pricingYearly')}
                    </Text>
                    {savingsPercent > 0 && billingInterval !== 'year' && (
                      <XStack
                        backgroundColor="$accent"
                        borderRadius="$2"
                        paddingHorizontal="$1.5"
                        paddingVertical={2}
                      >
                        <Text fontSize={10} fontWeight="700" color="white">
                          -{savingsPercent}%
                        </Text>
                      </XStack>
                    )}
                  </XStack>
                </ScalePress>
              </XStack>
            </YStack>
          )}

          {/* Plans */}
          {loading ? (
            <XStack
              gap="$4"
              justifyContent="center"
              paddingHorizontal={isWide ? 24 : 16}
              flexWrap="wrap"
              maxWidth={1000}
              alignSelf="center"
            >
              {[1, 2, 3].map((i) => (
                <YStack
                  key={i}
                  flex={1}
                  minWidth={isWide ? 260 : undefined}
                  maxWidth={360}
                  height={380}
                  backgroundColor="$subtleBackground"
                  borderRadius="$5"
                  borderWidth={1}
                  borderColor="$borderColor"
                  style={{ opacity: 0.5 } as any}
                />
              ))}
            </XStack>
          ) : filteredPlans.length === 0 ? (
            <YStack alignItems="center" gap="$3" paddingVertical="$10">
              <Ionicons name="pricetags-outline" size={48} color={theme.mutedText.val} />
              <Text color="$mutedText" textAlign="center" fontSize="$4">{t('payments.noPlans')}</Text>
            </YStack>
          ) : isWide ? (
            <XStack
              gap="$4"
              justifyContent="center"
              alignItems="stretch"
              paddingHorizontal={24}
              flexWrap="wrap"
              maxWidth={1100}
            >
              {filteredPlans.map((plan) => (
                <YStack
                  key={plan.id}
                  flex={1}
                  minWidth={260}
                  maxWidth={360}
                  style={plan.id === highlightedPlanId ? { transform: [{ translateY: -8 }] } as any : {}}
                >
                  <PricingCard
                    plan={plan}
                    isCurrentPlan={subscription?.planId === plan.id}
                    isHighlighted={highlightedPlanId === plan.id}
                    onSelect={handleSelect}
                    loading={checkoutLoading === plan.id}
                    savingsPercent={billingInterval === 'year' ? savingsPercent : 0}
                  />
                </YStack>
              ))}
            </XStack>
          ) : (
            <YStack gap="$3" paddingHorizontal={16} alignSelf="stretch">
              {filteredPlans.map((plan) => (
                <PricingCard
                  key={plan.id}
                  plan={plan}
                  isCurrentPlan={subscription?.planId === plan.id}
                  isHighlighted={highlightedPlanId === plan.id}
                  onSelect={handleSelect}
                  loading={checkoutLoading === plan.id}
                  savingsPercent={billingInterval === 'year' ? savingsPercent : 0}
                />
              ))}
            </YStack>
          )}

          {/* Trust signals */}
          {!loading && filteredPlans.length > 0 && (
            <XStack
              gap="$5"
              justifyContent="center"
              flexWrap="wrap"
              paddingHorizontal={16}
              paddingBottom="$2"
            >
              {[
                { icon: 'shield-checkmark-outline' as const, label: t('payments.securePayments') },
                { icon: 'refresh-outline' as const, label: t('payments.guarantee') },
                { icon: 'close-circle-outline' as const, label: t('payments.cancelAnytime') },
              ].map(({ icon, label }) => (
                <XStack key={label} alignItems="center" gap="$1.5">
                  <Ionicons name={icon} size={15} color={theme.mutedText.val} />
                  <Text fontSize="$2" color="$mutedText">{label}</Text>
                </XStack>
              ))}
            </XStack>
          )}
        </YStack>
      </FadeIn>
    </ScrollView>
  )
}
