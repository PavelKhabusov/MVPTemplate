import { YStack, XStack, Text, useTheme } from 'tamagui'
import { CheckCircle2, Clock, XCircle, Undo2, HelpCircle } from 'lucide-react-native'
import type { LucideIcon } from 'lucide-react-native'
import { useTranslation } from '@mvp/i18n'
import { AppCard } from '@mvp/ui'
import type { PaymentRecord } from '../types'

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

const STATUS_ICONS: Record<string, LucideIcon> = {
  succeeded: CheckCircle2,
  pending: Clock,
  failed: XCircle,
  refunded: Undo2,
}

const STATUS_COLORS: Record<string, string> = {
  succeeded: '#059669',
  pending: '#F59E0B',
  failed: '#EF4444',
  refunded: '#6B7280',
}

interface PaymentHistoryProps {
  payments: PaymentRecord[]
  loading?: boolean
}

export function PaymentHistory({ payments, loading }: PaymentHistoryProps) {
  const { t } = useTranslation()
  const theme = useTheme()

  if (loading) {
    return <Text color="$mutedText" fontSize="$2">{t('common.loading')}</Text>
  }

  if (payments.length === 0) {
    return <Text color="$mutedText" fontSize="$2">{t('payments.noHistory')}</Text>
  }

  return (
    <YStack gap="$2">
      {payments.map((payment) => {
        const StatusIcon = STATUS_ICONS[payment.status] ?? HelpCircle
        return (
          <AppCard key={payment.id} animated={false}>
            <XStack alignItems="center" justifyContent="space-between">
              <XStack alignItems="center" gap="$2" flex={1}>
                <StatusIcon
                  size={20}
                  color={STATUS_COLORS[payment.status] ?? theme.mutedText.val}
                />
                <YStack flex={1}>
                  <Text fontWeight="600" color="$color" fontSize="$3" numberOfLines={1}>
                    {payment.description ?? t(`payments.${payment.type}` as any)}
                  </Text>
                  <Text color="$mutedText" fontSize="$1">
                    {new Date(payment.createdAt).toLocaleDateString()}
                  </Text>
                </YStack>
              </XStack>
              <YStack alignItems="flex-end">
                <Text fontWeight="700" fontSize="$3" color="$color">
                  {formatPrice(payment.amount, payment.currency)}
                </Text>
                <Text
                  fontSize="$1"
                  color={STATUS_COLORS[payment.status] ?? '$mutedText'}
                  fontWeight="600"
                >
                  {t(`payments.${payment.status}` as any)}
                </Text>
              </YStack>
            </XStack>
          </AppCard>
        )
      })}
    </YStack>
  )
}
