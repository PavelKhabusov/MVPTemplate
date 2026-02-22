import { XStack, Text } from 'tamagui'
import { useTranslation } from '@mvp/i18n'
import type { Subscription } from '../types'

const STATUS_COLORS: Record<string, string> = {
  active: '#059669',
  canceled: '#EF4444',
  past_due: '#F59E0B',
  trialing: '#6366F1',
  expired: '#6B7280',
}

interface SubscriptionBadgeProps {
  subscription: Subscription | null
}

export function SubscriptionBadge({ subscription }: SubscriptionBadgeProps) {
  const { t } = useTranslation()

  if (!subscription) return null

  const color = STATUS_COLORS[subscription.status] ?? STATUS_COLORS.expired

  return (
    <XStack alignItems="center" gap="$2">
      <Text fontWeight="600" color="$color" fontSize="$3">
        {subscription.planName}
      </Text>
      <XStack
        backgroundColor={color}
        paddingHorizontal="$2"
        paddingVertical="$1"
        borderRadius="$2"
      >
        <Text color="white" fontSize="$1" fontWeight="600">
          {t(`payments.${subscription.status}` as any)}
        </Text>
      </XStack>
    </XStack>
  )
}
