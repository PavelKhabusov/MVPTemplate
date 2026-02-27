export interface CreateCheckoutParams {
  userId: string
  userEmail: string
  planId: string
  priceId: string
  planName: string
  amount: number
  currency: string
  interval: 'month' | 'year' | 'one_time'
  successUrl: string
  cancelUrl: string
  metadata?: Record<string, string>
}

export interface CheckoutResult {
  checkoutUrl: string
  sessionId: string
}

export interface WebhookEvent {
  type:
    | 'payment.succeeded'
    | 'payment.failed'
    | 'subscription.created'
    | 'subscription.updated'
    | 'subscription.canceled'
    | 'subscription.renewed'
  providerPaymentId?: string
  providerSubscriptionId?: string
  providerCustomerId?: string
  userId?: string
  planId?: string
  amount?: number
  currency?: string
  status?: string
  currentPeriodStart?: Date
  currentPeriodEnd?: Date
  cancelAtPeriodEnd?: boolean
  rawEvent: unknown
}

export interface CancelSubscriptionParams {
  providerSubscriptionId: string
  cancelImmediately?: boolean
}

export interface PaymentProvider {
  readonly name: 'stripe' | 'yookassa' | 'robokassa' | 'paypal'

  createCheckoutSession(params: CreateCheckoutParams): Promise<CheckoutResult>

  parseWebhook(rawBody: string, headers: Record<string, string>): Promise<WebhookEvent>

  cancelSubscription(params: CancelSubscriptionParams): Promise<void>

  getSubscription(providerSubscriptionId: string): Promise<{
    status: string
    currentPeriodEnd: Date
    cancelAtPeriodEnd: boolean
  }>
}
