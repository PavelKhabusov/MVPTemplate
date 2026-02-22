import { YStack, XStack, Text, useTheme } from 'tamagui'
import { Ionicons } from '@expo/vector-icons'
import { useTranslation } from '@mvp/i18n'
import { AppButton } from '@mvp/ui'
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
  isHighlighted?: boolean
  onSelect: (planId: string) => void
  loading?: boolean
}

export function PricingCard({ plan, isCurrentPlan, isHighlighted, onSelect, loading }: PricingCardProps) {
  const { t } = useTranslation()
  const theme = useTheme()

  const intervalLabel: Record<PlanInterval, string> = {
    month: t('payments.perMonth'),
    year: t('payments.perYear'),
    one_time: '',
  }

  return (
    <YStack
      backgroundColor="$cardBackground"
      borderRadius="$5"
      borderWidth={isHighlighted ? 2 : 1}
      borderColor={isHighlighted ? '$accent' : '$borderColor'}
      position="relative"
      overflow="hidden"
    >
      {/* Highlight badge */}
      {isHighlighted && (
        <XStack
          backgroundColor="$accent"
          paddingVertical="$1.5"
          justifyContent="center"
          alignItems="center"
        >
          <Text color="white" fontSize={11} fontWeight="700" textTransform="uppercase" letterSpacing={0.5}>
            {t('payments.popular')}
          </Text>
        </XStack>
      )}

      <YStack gap="$3" padding="$4">
        {/* Plan name */}
        <Text fontWeight="700" fontSize="$5" color="$color">
          {plan.name}
        </Text>

        {plan.description && (
          <Text fontSize="$3" color="$mutedText" numberOfLines={2}>
            {plan.description}
          </Text>
        )}

        {/* Price */}
        <XStack alignItems="baseline" gap="$1">
          <Text fontWeight="800" fontSize={36} color="$color" letterSpacing={-1}>
            {plan.priceAmount === 0 ? t('payments.free') : formatPrice(plan.priceAmount, plan.currency)}
          </Text>
          {plan.priceAmount > 0 && plan.interval !== 'one_time' && (
            <Text fontSize="$3" color="$mutedText" fontWeight="500">
              {intervalLabel[plan.interval]}
            </Text>
          )}
          {plan.interval === 'one_time' && plan.priceAmount > 0 && (
            <Text fontSize="$2" color="$mutedText" fontWeight="500">
              {t('payments.one_time')}
            </Text>
          )}
        </XStack>

        {/* Features */}
        {plan.features.length > 0 && (
          <YStack gap="$2.5" paddingTop="$1">
            {plan.features.map((feature) => (
              <XStack key={feature} alignItems="flex-start" gap="$2.5">
                <YStack
                  width={20}
                  height={20}
                  borderRadius={10}
                  backgroundColor={isHighlighted ? '$accent' : '$subtleBackground'}
                  alignItems="center"
                  justifyContent="center"
                  marginTop={1}
                >
                  <Ionicons
                    name="checkmark"
                    size={12}
                    color={isHighlighted ? '#fff' : theme.accent.val}
                  />
                </YStack>
                <Text fontSize="$3" color="$color" flex={1} lineHeight={22}>
                  {feature}
                </Text>
              </XStack>
            ))}
          </YStack>
        )}

        {/* Action button */}
        {isCurrentPlan ? (
          <XStack
            backgroundColor="$subtleBackground"
            paddingVertical="$2.5"
            borderRadius="$4"
            justifyContent="center"
            alignItems="center"
            gap="$2"
          >
            <Ionicons name="checkmark-circle" size={18} color={theme.accent.val} />
            <Text fontWeight="600" color="$accent" fontSize="$3">
              {t('payments.currentPlan')}
            </Text>
          </XStack>
        ) : (
          <AppButton
            onPress={() => onSelect(plan.id)}
            loading={loading}
            variant={isHighlighted ? undefined : 'outline'}
          >
            {plan.interval === 'one_time' ? t('payments.buyNow') : t('payments.subscribe')}
          </AppButton>
        )}
      </YStack>
    </YStack>
  )
}
