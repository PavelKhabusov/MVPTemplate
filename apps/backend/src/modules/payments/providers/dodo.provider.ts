import crypto from 'crypto'
import type {
  PaymentProvider,
  CreateCheckoutParams,
  CheckoutResult,
  WebhookEvent,
  CancelSubscriptionParams,
  RefundResult,
} from './payment-provider'

const DODO_API_BASE = 'https://api.dodopayments.com'

export class DodoProvider implements PaymentProvider {
  readonly name = 'dodopayment' as const

  constructor(
    private apiKey: string,
    private webhookSecret?: string,
  ) {}

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const res = await fetch(`${DODO_API_BASE}${path}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        ...(options.headers ?? {}),
      },
    })
    if (!res.ok) {
      const body = await res.text()
      throw new Error(`Dodo API error ${res.status}: ${body}`)
    }
    return res.json() as Promise<T>
  }

  async createCheckoutSession(params: CreateCheckoutParams): Promise<CheckoutResult> {
    const body: Record<string, unknown> = {
      product_id: params.priceId,
      quantity: 1,
      payment_link: true,
      customer: { email: params.userEmail },
      metadata: {
        userId: params.userId,
        planId: params.planId,
        ...(params.metadata ?? {}),
      },
      redirect_url: params.successUrl,
      cancel_url: params.cancelUrl,
    }

    const checkout = await this.request<{ payment_link: string; payment_id: string }>(
      '/payments',
      { method: 'POST', body: JSON.stringify(body) },
    )

    return {
      checkoutUrl: checkout.payment_link,
      sessionId: checkout.payment_id,
    }
  }

  async parseWebhook(rawBody: string, headers: Record<string, string>): Promise<WebhookEvent> {
    // Dodo uses Svix-style webhook signatures
    if (this.webhookSecret) {
      const webhookId = headers['webhook-id']
      const webhookTimestamp = headers['webhook-timestamp']
      const webhookSignature = headers['webhook-signature']

      if (!webhookId || !webhookTimestamp || !webhookSignature) {
        throw new Error('Missing Dodo webhook signature headers')
      }

      const signedContent = `${webhookId}.${webhookTimestamp}.${rawBody}`
      const secretBytes = Buffer.from(this.webhookSecret.replace(/^whsec_/, ''), 'base64')
      const hmac = crypto.createHmac('sha256', secretBytes)
      hmac.update(signedContent)
      const expectedSig = `v1,${hmac.digest('base64')}`

      const signatures = webhookSignature.split(' ')
      const valid = signatures.some((sig) => sig === expectedSig)
      if (!valid) throw new Error('Invalid Dodo webhook signature')
    }

    const event = JSON.parse(rawBody) as { type: string; data: any }
    const { type, data } = event

    if (type === 'payment.succeeded') {
      const meta = data.metadata ?? {}
      return {
        type: 'payment.succeeded',
        providerPaymentId: data.payment_id,
        userId: meta.userId,
        planId: meta.planId,
        amount: data.total_amount ?? 0,
        currency: (data.currency ?? 'usd').toLowerCase(),
        rawEvent: event,
      }
    }

    if (type === 'payment.failed') {
      return {
        type: 'payment.failed',
        providerPaymentId: data.payment_id,
        rawEvent: event,
      }
    }

    if (type === 'subscription.created') {
      const meta = data.metadata ?? {}
      return {
        type: 'subscription.created',
        providerSubscriptionId: data.subscription_id,
        userId: meta.userId,
        planId: meta.planId,
        currentPeriodStart: data.current_period_start ? new Date(data.current_period_start) : undefined,
        currentPeriodEnd: data.current_period_end ? new Date(data.current_period_end) : undefined,
        rawEvent: event,
      }
    }

    if (type === 'subscription.updated' || type === 'subscription.renewed') {
      return {
        type: type === 'subscription.renewed' ? 'subscription.renewed' : 'subscription.updated',
        providerSubscriptionId: data.subscription_id,
        status: data.status,
        currentPeriodStart: data.current_period_start ? new Date(data.current_period_start) : undefined,
        currentPeriodEnd: data.current_period_end ? new Date(data.current_period_end) : undefined,
        cancelAtPeriodEnd: data.cancel_at_period_end ?? false,
        rawEvent: event,
      }
    }

    if (type === 'subscription.cancelled') {
      return {
        type: 'subscription.canceled',
        providerSubscriptionId: data.subscription_id,
        rawEvent: event,
      }
    }

    throw new Error(`Unhandled Dodo event type: ${type}`)
  }

  async cancelSubscription(params: CancelSubscriptionParams): Promise<void> {
    await this.request(`/subscriptions/${params.providerSubscriptionId}/cancel`, {
      method: 'POST',
    })
  }

  async getSubscription(providerSubscriptionId: string): Promise<{
    status: string
    currentPeriodEnd: Date
    cancelAtPeriodEnd: boolean
  }> {
    const sub = await this.request<{
      status: string
      current_period_end: string
      cancel_at_period_end: boolean
    }>(`/subscriptions/${providerSubscriptionId}`)

    return {
      status: sub.status,
      currentPeriodEnd: new Date(sub.current_period_end),
      cancelAtPeriodEnd: sub.cancel_at_period_end ?? false,
    }
  }

  async refundPayment(providerPaymentId: string, amountMinorUnits?: number): Promise<RefundResult> {
    const body: Record<string, unknown> = { payment_id: providerPaymentId }
    if (amountMinorUnits != null) body.amount = amountMinorUnits

    const refund = await this.request<{
      refund_id: string
      amount: number
      currency: string
      status: string
    }>('/refunds', { method: 'POST', body: JSON.stringify(body) })

    return {
      refundId: refund.refund_id,
      amount: refund.amount,
      currency: refund.currency,
      status: refund.status,
    }
  }
}
