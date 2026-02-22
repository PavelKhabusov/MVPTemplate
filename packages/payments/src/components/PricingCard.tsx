import { YStack, XStack, Text, useTheme } from 'tamagui'
import { Ionicons } from '@expo/vector-icons'
import { useTranslation } from '@mvp/i18n'
import { AppCard, AppButton } from '@mvp/ui'
import type { Plan, PlanInterval } from '../types'

function formatPrice(amount: number, currency: string): string {
  const value = amount / 100
  const fmt = new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: currency.toUpperCase(),
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })
  return fmt.format(value)
}

interface PricingCardProps {
  plan: Plan
  isCurrentPlan?: boolean
  onSelect: (planId: string) => void
  loading?: boolean
}

export function PricingCard({ plan, isCurrentPlan, onSelect, loading }: PricingCardProps) {
  const { t } = useTranslation()
  const theme = useTheme()

  const intervalLabel: Record<PlanInterval, string> = {
    month: t('payments.perMonth'),
    year: t('payments.perYear'),
    one_time: '',
  }

  return (
    <AppCard animated={false}>
      <YStack gap="$3">
        <Text fontWeight="700" fontSize="$5" color="$color">
          {plan.name}
        </Text>

        {plan.description && (
          <Text fontSize="$2" color="$mutedText" numberOfLines={2}>
            {plan.description}
          </Text>
        )}

        <XStack alignItems="baseline" gap="$1">
          <Text fontWeight="800" fontSize="$8" color="$accent">
            {plan.priceAmount === 0 ? t('payments.free') : formatPrice(plan.priceAmount, plan.currency)}
          </Text>
          {plan.priceAmount > 0 && plan.interval !== 'one_time' && (
            <Text fontSize="$2" color="$mutedText">
              {intervalLabel[plan.interval]}
            </Text>
          )}
        </XStack>

        {plan.features.length > 0 && (
          <YStack gap="$1.5">
            <Text fontSize="$2" fontWeight="600" color="$color">
              {t('payments.features')}
            </Text>
            {plan.features.map((feature) => (
              <XStack key={feature} alignItems="center" gap="$2">
                <Ionicons name="checkmark-circle" size={16} color={theme.accent.val} />
                <Text fontSize="$2" color="$color" flex={1}>
                  {feature}
                </Text>
              </XStack>
            ))}
          </YStack>
        )}

        {isCurrentPlan ? (
          <XStack
            backgroundColor="$subtleBackground"
            paddingVertical="$2"
            borderRadius="$3"
            justifyContent="center"
          >
            <Text fontWeight="600" color="$accent" fontSize="$3">
              {t('payments.currentPlan')}
            </Text>
          </XStack>
        ) : (
          <AppButton onPress={() => onSelect(plan.id)} loading={loading}>
            {plan.interval === 'one_time' ? t('payments.buyNow') : t('payments.subscribe')}
          </AppButton>
        )}
      </YStack>
    </AppCard>
  )
}
