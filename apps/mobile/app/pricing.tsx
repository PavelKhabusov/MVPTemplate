import { useState, useEffect, useCallback } from 'react'
import { Platform, ScrollView, Linking, Alert } from 'react-native'
import { YStack, XStack, Text, useTheme } from 'tamagui'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTranslation } from '@mvp/i18n'
import { AppButton, FadeIn } from '@mvp/ui'
import { Ionicons } from '@expo/vector-icons'
import { PricingCard, SubscriptionBadge } from '@mvp/payments'
import type { Plan, Subscription } from '@mvp/payments'
import { api } from '../src/services/api'

export default function PricingScreen() {
  const { t } = useTranslation()
  const theme = useTheme()
  const insets = useSafeAreaInsets()
  const [plans, setPlans] = useState<Plan[]>([])
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null)
  const [canceling, setCanceling] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const [plansRes, subRes] = await Promise.all([
        api.get('/payments/plans'),
        api.get('/payments/subscription').catch(() => null),
      ])
      setPlans(plansRes.data.data ?? [])
      setSubscription(subRes?.data?.data ?? null)
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

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
    Alert.alert(t('payments.cancelSubscription'), t('payments.cancelConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('payments.cancelSubscription'),
        style: 'destructive',
        onPress: async () => {
          setCanceling(true)
          try {
            await api.post('/payments/cancel')
            await fetchData()
          } catch (err: any) {
            Alert.alert(t('common.error'), err.response?.data?.message ?? t('common.retry'))
          } finally {
            setCanceling(false)
          }
        },
      },
    ])
  }

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{
        paddingHorizontal: 16,
        paddingBottom: insets.bottom + 20,
        gap: 16,
        paddingTop: 8,
      }}
    >
      <FadeIn>
        <YStack gap="$3">
          <Text color="$mutedText" fontSize="$3" textAlign="center">
            {t('payments.subtitle')}
          </Text>

          {/* Current subscription */}
          {subscription && (
            <YStack
              backgroundColor="$subtleBackground"
              borderRadius="$4"
              padding="$4"
              gap="$3"
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

          {/* Plans */}
          {loading ? (
            <Text color="$mutedText" textAlign="center" paddingVertical="$6">
              {t('common.loading')}
            </Text>
          ) : plans.length === 0 ? (
            <Text color="$mutedText" textAlign="center" paddingVertical="$6">
              {t('payments.noHistory')}
            </Text>
          ) : (
            plans.map((plan) => (
              <PricingCard
                key={plan.id}
                plan={plan}
                isCurrentPlan={subscription?.planId === plan.id}
                onSelect={handleSelect}
                loading={checkoutLoading === plan.id}
              />
            ))
          )}
        </YStack>
      </FadeIn>
    </ScrollView>
  )
}
