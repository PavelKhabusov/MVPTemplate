export type PaymentProviderType = 'stripe' | 'yookassa' | 'robokassa'

export type PlanInterval = 'month' | 'year' | 'one_time'

export type SubscriptionStatus =
  | 'active'
  | 'canceled'
  | 'past_due'
  | 'trialing'
  | 'incomplete'
  | 'expired'

export type PaymentStatus = 'pending' | 'succeeded' | 'failed' | 'refunded'

export type PaymentType = 'one_time' | 'subscription'

export interface Plan {
  id: string
  name: string
  description: string | null
  priceAmount: number
  currency: string
  interval: PlanInterval
  features: string[]
  provider: PaymentProviderType
  isActive: boolean
  sortOrder: number
}

export interface Subscription {
  id: string
  planId: string
  planName: string
  status: SubscriptionStatus
  provider: PaymentProviderType
  currentPeriodStart: string
  currentPeriodEnd: string
  cancelAtPeriodEnd: boolean
}

export interface PaymentRecord {
  id: string
  amount: number
  currency: string
  status: PaymentStatus
  type: PaymentType
  provider: PaymentProviderType
  description: string | null
  createdAt: string
}

export interface CheckoutResponse {
  checkoutUrl: string
  sessionId: string
}
