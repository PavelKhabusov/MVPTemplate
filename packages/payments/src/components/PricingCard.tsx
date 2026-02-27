import { useEffect } from 'react'
import { Platform, View } from 'react-native'
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
  savingsPercent?: number
}

export function PricingCard({ plan, isCurrentPlan, isHighlighted, onSelect, loading, savingsPercent }: PricingCardProps) {
  const { t } = useTranslation()
  const theme = useTheme()

  const intervalLabel: Record<PlanInterval, string> = {
    month: t('payments.perMonth'),
    year: t('payments.perYear'),
    one_time: '',
  }

  // Inject glow CSS for highlighted card on web
  useEffect(() => {
    if (Platform.OS !== 'web' || !isHighlighted) return
    const style = document.createElement('style')
    style.textContent = `
      @keyframes pricingGlow {
        0%, 100% { box-shadow: 0 0 24px 4px var(--pricing-glow, rgba(0,200,180,0.18)); }
        50% { box-shadow: 0 0 40px 8px var(--pricing-glow, rgba(0,200,180,0.30)); }
      }
      .pricing-card-popular { animation: pricingGlow 3s ease-in-out infinite; }
      .pricing-card-popular:hover { transform: translateY(-4px); transition: transform 0.25s ease; }
    `
    document.head.appendChild(style)
    return () => { document.head.removeChild(style) }
  }, [isHighlighted])

  return (
    <YStack
      position="relative"
      overflow="hidden"
      borderRadius="$5"
      borderWidth={isHighlighted ? 0 : 1}
      borderColor="$borderColor"
      flexGrow={1}
      flexShrink={1}
      className={isHighlighted && Platform.OS === 'web' ? 'pricing-card-popular' : undefined}
      style={isHighlighted ? {
        background: `linear-gradient(160deg, ${theme.accentGradientStart.val}22 0%, ${theme.cardBackground.val} 40%, ${theme.cardBackground.val} 100%)`,
        borderWidth: 1.5,
        borderColor: `${theme.accent.val}60`,
        boxShadow: `0 0 0 1px ${theme.accent.val}30, 0 8px 32px rgba(0,0,0,0.15)`,
        transition: 'transform 0.25s ease',
      } as any : {
        boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
      } as any}
    >
      {/* Popular badge */}
      {isHighlighted && (
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
        {/* Plan name + description */}
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

        {/* Price block */}
        <YStack gap="$1">
          <XStack alignItems="flex-end" gap="$1.5">
            <Text
              fontWeight="800"
              fontSize={44}
              color={isHighlighted ? '$accent' : '$color'}
              letterSpacing={-2}
              lineHeight={48}
            >
              {plan.priceAmount === 0 ? t('payments.free') : formatPrice(plan.priceAmount, plan.currency)}
            </Text>
            {plan.priceAmount > 0 && plan.interval !== 'one_time' && (
              <Text fontSize="$3" color="$mutedText" fontWeight="500" paddingBottom={6}>
                {intervalLabel[plan.interval]}
              </Text>
            )}
            {plan.interval === 'one_time' && plan.priceAmount > 0 && (
              <Text fontSize="$2" color="$mutedText" fontWeight="500" paddingBottom={6}>
                {t('payments.one_time')}
              </Text>
            )}
          </XStack>

          {/* Savings badge for yearly */}
          {savingsPercent && savingsPercent > 0 && plan.interval === 'year' && (
            <XStack alignItems="center" gap="$1.5">
              <XStack
                backgroundColor={`${theme.accent.val}20`}
                borderRadius="$2"
                paddingHorizontal="$2"
                paddingVertical="$0.5"
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
        <View style={{ height: 1, backgroundColor: isHighlighted ? `${theme.accent.val}20` : theme.borderColor.val }} />

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
                  style={isHighlighted ? {
                    background: `linear-gradient(135deg, ${theme.accentGradientStart.val}, ${theme.accentGradientEnd.val})`,
                  } as any : {
                    backgroundColor: `${theme.accent.val}15`,
                  } as any}
                >
                  <Ionicons
                    name="checkmark"
                    size={11}
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

        {/* Action */}
        {isCurrentPlan ? (
          <XStack
            backgroundColor={`${theme.accent.val}10`}
            paddingVertical="$3"
            borderRadius="$4"
            justifyContent="center"
            alignItems="center"
            gap="$2"
            borderWidth={1}
            borderColor={`${theme.accent.val}25`}
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
            size="lg"
          >
            {plan.interval === 'one_time' ? t('payments.buyNow') : t('payments.getStarted')}
          </AppButton>
        )}
      </YStack>
    </YStack>
  )
}
