import type {
  PaymentProvider,
  CreateCheckoutParams,
  CheckoutResult,
  WebhookEvent,
  CancelSubscriptionParams,
  RefundResult,
} from './payment-provider'

export class PayPalProvider implements PaymentProvider {
  readonly name = 'paypal' as const
  private baseUrl: string
  private accessToken: string | null = null
  private tokenExpiresAt = 0

  constructor(
    private clientId: string,
    private clientSecret: string,
    private webhookId: string,
    mode: 'sandbox' | 'live' = 'sandbox',
  ) {
    this.baseUrl = mode === 'live' ? 'https://api.paypal.com' : 'https://api.sandbox.paypal.com'
  }

  private async getAccessToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.tokenExpiresAt) {
      return this.accessToken
    }

    const credentials = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64')
    const res = await fetch(`${this.baseUrl}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    })

    if (!res.ok) {
      const err = await res.text()
      throw new Error(`PayPal auth error: ${res.status} ${err}`)
    }

    const data = (await res.json()) as { access_token: string; expires_in: number }
    this.accessToken = data.access_token
    this.tokenExpiresAt = Date.now() + (data.expires_in - 60) * 1000
    return this.accessToken
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const token = await this.getAccessToken()
    const res = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
        ...(options.headers ?? {}),
      },
    })

    if (!res.ok) {
      const err = await res.text()
      throw new Error(`PayPal API error ${res.status}: ${err}`)
    }

    return res.json() as Promise<T>
  }

  async createCheckoutSession(params: CreateCheckoutParams): Promise<CheckoutResult> {
    const isSubscription = params.interval !== 'one_time'

    if (isSubscription) {
      return this.createSubscriptionSession(params)
    }

    // One-time payment via Orders API v2
    const order = await this.request<{
      id: string
      links: Array<{ href: string; rel: string }>
    }>('/v2/checkout/orders', {
      method: 'POST',
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [
          {
            amount: {
              currency_code: params.currency.toUpperCase(),
              value: (params.amount / 100).toFixed(2),
            },
            description: params.planName,
            custom_id: JSON.stringify({ userId: params.userId, planId: params.planId }),
          },
        ],
        application_context: {
          return_url: params.successUrl,
          cancel_url: params.cancelUrl,
          brand_name: params.planName,
          user_action: 'PAY_NOW',
        },
      }),
    })

    const approveLink = order.links.find((l) => l.rel === 'approve')
    if (!approveLink) throw new Error('PayPal: no approve link in order response')

    return { checkoutUrl: approveLink.href, sessionId: order.id }
  }

  private async createSubscriptionSession(params: CreateCheckoutParams): Promise<CheckoutResult> {
    // Requires a pre-created PayPal Plan (product + billing plan)
    // If providerPriceId (plan_id) is set, use it directly; otherwise create a one-off order
    if (!params.priceId) {
      throw new Error('PayPal subscriptions require a pre-created billing plan ID (providerPriceId)')
    }

    const sub = await this.request<{
      id: string
      links: Array<{ href: string; rel: string }>
    }>('/v1/billing/subscriptions', {
      method: 'POST',
      body: JSON.stringify({
        plan_id: params.priceId,
        subscriber: { email_address: params.userEmail },
        application_context: {
          return_url: params.successUrl,
          cancel_url: params.cancelUrl,
          user_action: 'SUBSCRIBE_NOW',
        },
        custom_id: JSON.stringify({ userId: params.userId, planId: params.planId }),
      }),
    })

    const approveLink = sub.links.find((l) => l.rel === 'approve')
    if (!approveLink) throw new Error('PayPal: no approve link in subscription response')

    return { checkoutUrl: approveLink.href, sessionId: sub.id }
  }

  async parseWebhook(rawBody: string, headers: Record<string, string>): Promise<WebhookEvent> {
    // Verify webhook signature
    await this.verifyWebhookSignature(rawBody, headers)

    const event = JSON.parse(rawBody) as {
      event_type: string
      resource: Record<string, unknown>
    }

    switch (event.event_type) {
      case 'PAYMENT.CAPTURE.COMPLETED': {
        const resource = event.resource as {
          id: string
          amount: { value: string; currency_code: string }
          custom_id?: string
        }
        const meta = resource.custom_id ? this.parseMeta(resource.custom_id) : {}
        return {
          type: 'payment.succeeded',
          providerPaymentId: resource.id,
          userId: meta.userId,
          planId: meta.planId,
          amount: Math.round(parseFloat(resource.amount.value) * 100),
          currency: resource.amount.currency_code.toLowerCase(),
          rawEvent: event,
        }
      }

      case 'PAYMENT.CAPTURE.DENIED':
      case 'PAYMENT.CAPTURE.REVERSED': {
        const resource = event.resource as { id: string }
        return {
          type: 'payment.failed',
          providerPaymentId: resource.id,
          rawEvent: event,
        }
      }

      case 'BILLING.SUBSCRIPTION.CREATED': {
        const resource = event.resource as {
          id: string
          custom_id?: string
          billing_info?: { next_billing_time?: string }
        }
        const meta = resource.custom_id ? this.parseMeta(resource.custom_id) : {}
        return {
          type: 'subscription.created',
          providerSubscriptionId: resource.id,
          userId: meta.userId,
          planId: meta.planId,
          rawEvent: event,
        }
      }

      case 'BILLING.SUBSCRIPTION.ACTIVATED': {
        const resource = event.resource as {
          id: string
          billing_info?: { next_billing_time?: string }
        }
        const periodEnd = resource.billing_info?.next_billing_time
          ? new Date(resource.billing_info.next_billing_time)
          : undefined
        return {
          type: 'subscription.updated',
          providerSubscriptionId: resource.id,
          status: 'active',
          currentPeriodEnd: periodEnd,
          cancelAtPeriodEnd: false,
          rawEvent: event,
        }
      }

      case 'BILLING.SUBSCRIPTION.CANCELLED':
      case 'BILLING.SUBSCRIPTION.EXPIRED': {
        const resource = event.resource as { id: string }
        return {
          type: 'subscription.canceled',
          providerSubscriptionId: resource.id,
          rawEvent: event,
        }
      }

      case 'BILLING.SUBSCRIPTION.RENEWED': {
        const resource = event.resource as {
          id: string
          billing_info?: { next_billing_time?: string; last_payment?: { time?: string } }
        }
        const periodEnd = resource.billing_info?.next_billing_time
          ? new Date(resource.billing_info.next_billing_time)
          : undefined
        const periodStart = resource.billing_info?.last_payment?.time
          ? new Date(resource.billing_info.last_payment.time)
          : undefined
        return {
          type: 'subscription.renewed',
          providerSubscriptionId: resource.id,
          currentPeriodStart: periodStart,
          currentPeriodEnd: periodEnd,
          rawEvent: event,
        }
      }

      default:
        throw new Error(`Unhandled PayPal event type: ${event.event_type}`)
    }
  }

  private async verifyWebhookSignature(rawBody: string, headers: Record<string, string>): Promise<void> {
    if (!this.webhookId) return

    const token = await this.getAccessToken()
    const res = await fetch(`${this.baseUrl}/v1/notifications/verify-webhook-signature`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        auth_algo: headers['paypal-auth-algo'],
        cert_url: headers['paypal-cert-url'],
        transmission_id: headers['paypal-transmission-id'],
        transmission_sig: headers['paypal-transmission-sig'],
        transmission_time: headers['paypal-transmission-time'],
        webhook_id: this.webhookId,
        webhook_event: JSON.parse(rawBody),
      }),
    })

    if (!res.ok) throw new Error('PayPal webhook signature verification request failed')
    const data = (await res.json()) as { verification_status: string }
    if (data.verification_status !== 'SUCCESS') {
      throw new Error('PayPal webhook signature verification failed')
    }
  }

  async cancelSubscription(params: CancelSubscriptionParams): Promise<void> {
    const token = await this.getAccessToken()
    const res = await fetch(
      `${this.baseUrl}/v1/billing/subscriptions/${params.providerSubscriptionId}/cancel`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Cancelled by user' }),
      },
    )

    if (!res.ok && res.status !== 204) {
      const err = await res.text()
      throw new Error(`PayPal cancel subscription error: ${res.status} ${err}`)
    }
  }

  async getSubscription(providerSubscriptionId: string): Promise<{
    status: string
    currentPeriodEnd: Date
    cancelAtPeriodEnd: boolean
  }> {
    const sub = await this.request<{
      status: string
      billing_info?: { next_billing_time?: string }
    }>(`/v1/billing/subscriptions/${providerSubscriptionId}`)

    const periodEnd = sub.billing_info?.next_billing_time
      ? new Date(sub.billing_info.next_billing_time)
      : new Date()

    return {
      status: sub.status.toLowerCase(),
      currentPeriodEnd: periodEnd,
      cancelAtPeriodEnd: sub.status === 'CANCELLED',
    }
  }

  async refundPayment(_providerPaymentId: string, _amountMinorUnits?: number): Promise<RefundResult> {
    throw new Error('PayPal refunds are not yet implemented')
  }

  private parseMeta(raw: string): { userId?: string; planId?: string } {
    try {
      return JSON.parse(raw)
    } catch {
      return {}
    }
  }
}
