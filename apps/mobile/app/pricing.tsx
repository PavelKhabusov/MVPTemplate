import { useState, useEffect, useCallback, useMemo } from 'react'
import { Platform, ScrollView, Linking, Alert, TouchableOpacity, useWindowDimensions } from 'react-native'
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

  // Check for ?success=true URL param (after checkout redirect)
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
        // ignore other errors silently
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

  // Check if there are both monthly and yearly plans
  const hasIntervalOptions = useMemo(() => {
    const hasMonthly = plans.some((p) => p.interval === 'month')
    const hasYearly = plans.some((p) => p.interval === 'year')
    return hasMonthly && hasYearly
  }, [plans])

  // Filter plans by selected interval (one_time always shown)
  const filteredPlans = useMemo(() => {
    if (!hasIntervalOptions) return plans
    return plans.filter((p) => p.interval === billingInterval || p.interval === 'one_time')
  }, [plans, billingInterval, hasIntervalOptions])

  // Find highlighted plan (middle plan or highest sortOrder active plan)
  const highlightedPlanId = useMemo(() => {
    if (filteredPlans.length < 2) return null
    const sorted = [...filteredPlans].sort((a, b) => a.sortOrder - b.sortOrder)
    return sorted[Math.floor(sorted.length / 2)]?.id ?? null
  }, [filteredPlans])

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
      if (window.confirm(t('payments.cancelConfirm'))) {
        doCancel()
      }
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
      contentContainerStyle={{
        paddingBottom: insets.bottom + 32,
        paddingTop: 8,
      }}
    >
      <FadeIn>
        <YStack gap="$5" alignItems="center">
          {/* Header */}
          <YStack alignItems="center" gap="$2" paddingTop="$5" paddingHorizontal={16}>
            <Text fontWeight="800" fontSize={32} color="$color" textAlign="center" letterSpacing={-0.5}>
              {t('payments.title')}
            </Text>
            <Text color="$mutedText" fontSize="$4" textAlign="center" maxWidth={460} lineHeight={22}>
              {t('payments.subtitle')}
            </Text>
          </YStack>

          {/* Success banner */}
          {showSuccess && (
            <XStack
              backgroundColor="#059669"
              borderRadius="$4"
              padding="$4"
              gap="$3"
              alignItems="center"
              marginHorizontal={16}
              alignSelf={isWide ? 'center' : 'stretch'}
              maxWidth={600}
              {...(isWide ? { width: '100%' as any } : {})}
            >
              <Ionicons name="checkmark-circle" size={24} color="white" />
              <YStack flex={1} gap="$1">
                <Text fontWeight="700" color="white" fontSize="$4">
                  {t('payments.successTitle')}
                </Text>
                <Text color="white" fontSize="$2" opacity={0.9}>
                  {t('payments.successMessage')}
                </Text>
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
              {...(isWide ? { width: '100%' as any } : {})}
            >
              <XStack alignItems="center" justifyContent="space-between">
                <SubscriptionBadge subscription={subscription} />
              </XStack>
              <Text color="$mutedText" fontSize="$2">
                {subscription.cancelAtPeriodEnd
                  ? t('payments.expiresOn', {
                      date: new Date(subscription.currentPeriodEnd).toLocaleDateString(),
                    })
                  : t('payments.renewsOn', {
                      date: new Date(subscription.currentPeriodEnd).toLocaleDateString(),
                    })}
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
            <XStack
              backgroundColor="$subtleBackground"
              borderRadius="$4"
              padding="$1"
            >
              <ScalePress onPress={() => setBillingInterval('month')}>
                <XStack
                  backgroundColor={billingInterval === 'month' ? '$cardBackground' : 'transparent'}
                  paddingHorizontal="$4"
                  paddingVertical="$2"
                  borderRadius="$3"
                  {...(billingInterval === 'month' ? {
                    shadowColor: 'rgba(0,0,0,0.1)',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 1,
                    shadowRadius: 3,
                  } : {})}
                >
                  <Text
                    fontWeight={billingInterval === 'month' ? '700' : '500'}
                    color={billingInterval === 'month' ? '$color' : '$mutedText'}
                    fontSize="$3"
                  >
                    {t('payments.perMonth').replace('/', '')}
                  </Text>
                </XStack>
              </ScalePress>
              <ScalePress onPress={() => setBillingInterval('year')}>
                <XStack
                  backgroundColor={billingInterval === 'year' ? '$cardBackground' : 'transparent'}
                  paddingHorizontal="$4"
                  paddingVertical="$2"
                  borderRadius="$3"
                  {...(billingInterval === 'year' ? {
                    shadowColor: 'rgba(0,0,0,0.1)',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 1,
                    shadowRadius: 3,
                  } : {})}
                >
                  <Text
                    fontWeight={billingInterval === 'year' ? '700' : '500'}
                    color={billingInterval === 'year' ? '$color' : '$mutedText'}
                    fontSize="$3"
                  >
                    {t('payments.perYear').replace('/', '')}
                  </Text>
                </XStack>
              </ScalePress>
            </XStack>
          )}

          {/* Plans */}
          {loading ? (
            <Text color="$mutedText" textAlign="center" paddingVertical="$6">
              {t('common.loading')}
            </Text>
          ) : filteredPlans.length === 0 ? (
            <YStack alignItems="center" gap="$3" paddingVertical="$8">
              <Ionicons name="pricetags-outline" size={48} color={theme.mutedText.val} />
              <Text color="$mutedText" textAlign="center" fontSize="$4">
                {t('payments.noPlans')}
              </Text>
            </YStack>
          ) : isWide ? (
            /* Web wide: side-by-side grid */
            <XStack
              gap="$4"
              justifyContent="center"
              alignItems="stretch"
              paddingHorizontal={24}
              flexWrap="wrap"
              maxWidth={1000}
            >
              {filteredPlans.map((plan) => (
                <YStack key={plan.id} flex={1} minWidth={280} maxWidth={360}>
                  <PricingCard
                    plan={plan}
                    isCurrentPlan={subscription?.planId === plan.id}
                    isHighlighted={highlightedPlanId === plan.id}
                    onSelect={handleSelect}
                    loading={checkoutLoading === plan.id}
                  />
                </YStack>
              ))}
            </XStack>
          ) : (
            /* Mobile: vertical stack */
            <YStack gap="$3" paddingHorizontal={16} alignSelf="stretch">
              {filteredPlans.map((plan) => (
                <PricingCard
                  key={plan.id}
                  plan={plan}
                  isCurrentPlan={subscription?.planId === plan.id}
                  isHighlighted={highlightedPlanId === plan.id}
                  onSelect={handleSelect}
                  loading={checkoutLoading === plan.id}
                />
              ))}
            </YStack>
          )}
        </YStack>
      </FadeIn>
    </ScrollView>
  )
}
