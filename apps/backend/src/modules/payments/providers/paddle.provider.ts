import crypto from 'crypto'
import type {
  PaymentProvider,
  CreateCheckoutParams,
  CheckoutResult,
  WebhookEvent,
  CancelSubscriptionParams,
  RefundResult,
} from './payment-provider'

const PADDLE_API_BASE_SANDBOX = 'https://sandbox-api.paddle.com'
const PADDLE_API_BASE_LIVE = 'https://api.paddle.com'

export class PaddleProvider implements PaymentProvider {
  readonly name = 'paddle' as const
  private baseUrl: string

  constructor(
    private apiKey: string,
    private webhookSecret?: string,
    private sandbox = true,
  ) {
    this.baseUrl = sandbox ? PADDLE_API_BASE_SANDBOX : PADDLE_API_BASE_LIVE
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        ...(options.headers ?? {}),
      },
    })
    if (!res.ok) {
      const body = await res.text()
      throw new Error(`Paddle API error ${res.status}: ${body}`)
    }
    const json = await res.json() as { data: T }
    return json.data
  }

  async createCheckoutSession(params: CreateCheckoutParams): Promise<CheckoutResult> {
    // Paddle checkout is URL-based using their JS overlay or hosted pages
    // We create a transaction that redirects to Paddle Checkout
    const body = {
      items: [{ price_id: params.priceId, quantity: 1 }],
      customer: { email: params.userEmail },
      custom_data: {
        userId: params.userId,
        planId: params.planId,
        ...(params.metadata ?? {}),
      },
      success_url: params.successUrl,
    }

    const transaction = await this.request<{
      id: string
      checkout: { url: string }
    }>('/transactions', { method: 'POST', body: JSON.stringify(body) })

    return {
      checkoutUrl: transaction.checkout.url,
      sessionId: transaction.id,
    }
  }

  async parseWebhook(rawBody: string, headers: Record<string, string>): Promise<WebhookEvent> {
    if (this.webhookSecret) {
      const signature = headers['paddle-signature']
      if (!signature) throw new Error('Missing Paddle-Signature header')

      // Paddle signature format: ts=TIMESTAMP;h1=HASH
      const parts = Object.fromEntries(signature.split(';').map((p) => p.split('=')))
      const ts = parts['ts']
      const h1 = parts['h1']

      if (!ts || !h1) throw new Error('Invalid Paddle-Signature format')

      // Max 5 second tolerance
      if (Math.abs(Date.now() / 1000 - parseInt(ts)) > 5) {
        throw new Error('Paddle webhook timestamp too old')
      }

      const signedContent = `${ts}:${rawBody}`
      const expected = crypto.createHmac('sha256', this.webhookSecret).update(signedContent).digest('hex')
      if (expected !== h1) throw new Error('Invalid Paddle webhook signature')
    }

    const event = JSON.parse(rawBody) as { event_type: string; data: any }
    const { event_type, data } = event

    // transaction.completed → one-time payment succeeded
    if (event_type === 'transaction.completed') {
      const customData = data.custom_data ?? {}
      const amount = data.details?.totals?.grand_total ?? 0
      const currency = data.currency_code ?? 'usd'
      return {
        type: 'payment.succeeded',
        providerPaymentId: data.id,
        userId: customData.userId,
        planId: customData.planId,
        amount,
        currency: currency.toLowerCase(),
        rawEvent: event,
      }
    }

    // transaction.payment_failed
    if (event_type === 'transaction.payment_failed') {
      return {
        type: 'payment.failed',
        providerPaymentId: data.id,
        rawEvent: event,
      }
    }

    // subscription.created
    if (event_type === 'subscription.created') {
      const customData = data.custom_data ?? {}
      return {
        type: 'subscription.created',
        providerSubscriptionId: data.id,
        providerCustomerId: data.customer_id,
        userId: customData.userId,
        planId: customData.planId,
        currentPeriodStart: data.current_billing_period?.starts_at
          ? new Date(data.current_billing_period.starts_at)
          : undefined,
        currentPeriodEnd: data.current_billing_period?.ends_at
          ? new Date(data.current_billing_period.ends_at)
          : undefined,
        rawEvent: event,
      }
    }

    // subscription.updated
    if (event_type === 'subscription.updated') {
      return {
        type: 'subscription.updated',
        providerSubscriptionId: data.id,
        status: data.status,
        currentPeriodStart: data.current_billing_period?.starts_at
          ? new Date(data.current_billing_period.starts_at)
          : undefined,
        currentPeriodEnd: data.current_billing_period?.ends_at
          ? new Date(data.current_billing_period.ends_at)
          : undefined,
        cancelAtPeriodEnd: data.scheduled_change?.action === 'cancel',
        rawEvent: event,
      }
    }

    // subscription.canceled
    if (event_type === 'subscription.canceled') {
      return {
        type: 'subscription.canceled',
        providerSubscriptionId: data.id,
        rawEvent: event,
      }
    }

    // subscription.renewed (next billing cycle)
    if (event_type === 'subscription.renewed') {
      return {
        type: 'subscription.renewed',
        providerSubscriptionId: data.id,
        currentPeriodStart: data.current_billing_period?.starts_at
          ? new Date(data.current_billing_period.starts_at)
          : undefined,
        currentPeriodEnd: data.current_billing_period?.ends_at
          ? new Date(data.current_billing_period.ends_at)
          : undefined,
        rawEvent: event,
      }
    }

    throw new Error(`Unhandled Paddle event type: ${event_type}`)
  }

  async cancelSubscription(params: CancelSubscriptionParams): Promise<void> {
    const body = params.cancelImmediately
      ? { effective_from: 'immediately' }
      : { effective_from: 'next_billing_period' }

    await this.request(`/subscriptions/${params.providerSubscriptionId}/cancel`, {
      method: 'POST',
      body: JSON.stringify(body),
    })
  }

  async getSubscription(providerSubscriptionId: string): Promise<{
    status: string
    currentPeriodEnd: Date
    cancelAtPeriodEnd: boolean
  }> {
    const sub = await this.request<{
      status: string
      current_billing_period: { ends_at: string }
      scheduled_change: { action: string } | null
    }>(`/subscriptions/${providerSubscriptionId}`)

    return {
      status: sub.status,
      currentPeriodEnd: new Date(sub.current_billing_period.ends_at),
      cancelAtPeriodEnd: sub.scheduled_change?.action === 'cancel',
    }
  }

  async refundPayment(providerPaymentId: string, amountMinorUnits?: number): Promise<RefundResult> {
    const body: Record<string, unknown> = { reason: 'other' }
    if (amountMinorUnits != null) body.amount = String(amountMinorUnits)

    // Paddle refunds are created on the transaction's payments
    const refund = await this.request<{
      id: string
      amount: string
      currency_code: string
      status: string
    }>(`/transactions/${providerPaymentId}/refunds`, {
      method: 'POST',
      body: JSON.stringify(body),
    })

    return {
      refundId: refund.id,
      amount: parseInt(refund.amount),
      currency: refund.currency_code.toLowerCase(),
      status: refund.status,
    }
  }
}
