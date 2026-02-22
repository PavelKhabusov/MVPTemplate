import type {
  PaymentProvider,
  CreateCheckoutParams,
  CheckoutResult,
  WebhookEvent,
  CancelSubscriptionParams,
} from './payment-provider'

const YOOKASSA_API = 'https://api.yookassa.ru/v3'

export class YooKassaProvider implements PaymentProvider {
  readonly name = 'yookassa' as const
  private authHeader: string

  constructor(
    private shopId: string,
    secretKey: string,
  ) {
    this.authHeader = 'Basic ' + Buffer.from(`${shopId}:${secretKey}`).toString('base64')
  }

  async createCheckoutSession(params: CreateCheckoutParams): Promise<CheckoutResult> {
    const isSubscription = params.interval !== 'one_time'

    const body: Record<string, unknown> = {
      amount: {
        value: (params.amount / 100).toFixed(2),
        currency: params.currency.toUpperCase(),
      },
      confirmation: {
        type: 'redirect',
        return_url: params.successUrl,
      },
      description: params.planName,
      metadata: {
        userId: params.userId,
        planId: params.planId,
        ...params.metadata,
      },
      capture: true,
    }

    if (isSubscription) {
      body.save_payment_method = true
    }

    const idempotenceKey = `${params.userId}-${params.planId}-${Date.now()}`

    const res = await fetch(`${YOOKASSA_API}/payments`, {
      method: 'POST',
      headers: {
        Authorization: this.authHeader,
        'Content-Type': 'application/json',
        'Idempotence-Key': idempotenceKey,
      },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const err = await res.text()
      throw new Error(`YooKassa API error: ${res.status} ${err}`)
    }

    const payment = (await res.json()) as {
      id: string
      confirmation: { confirmation_url: string }
    }

    return {
      checkoutUrl: payment.confirmation.confirmation_url,
      sessionId: payment.id,
    }
  }

  async parseWebhook(rawBody: string, _headers: Record<string, string>): Promise<WebhookEvent> {
    const notification = JSON.parse(rawBody) as {
      event: string
      object: {
        id: string
        status: string
        amount: { value: string; currency: string }
        metadata?: { userId?: string; planId?: string }
        payment_method?: { saved: boolean; id: string }
      }
    }

    switch (notification.event) {
      case 'payment.succeeded':
        return {
          type: 'payment.succeeded',
          providerPaymentId: notification.object.id,
          userId: notification.object.metadata?.userId,
          planId: notification.object.metadata?.planId,
          amount: Math.round(parseFloat(notification.object.amount.value) * 100),
          currency: notification.object.amount.currency.toLowerCase(),
          rawEvent: notification,
        }

      case 'payment.canceled':
        return {
          type: 'payment.failed',
          providerPaymentId: notification.object.id,
          userId: notification.object.metadata?.userId,
          rawEvent: notification,
        }

      case 'refund.succeeded':
        return {
          type: 'payment.failed',
          providerPaymentId: notification.object.id,
          rawEvent: notification,
        }

      default:
        throw new Error(`Unhandled YooKassa event: ${notification.event}`)
    }
  }

  async cancelSubscription(_params: CancelSubscriptionParams): Promise<void> {
    // YooKassa doesn't have native subscription management.
    // Cancellation is handled by updating our DB and stopping recurring charges.
  }

  async getSubscription(_providerSubscriptionId: string): Promise<{
    status: string
    currentPeriodEnd: Date
    cancelAtPeriodEnd: boolean
  }> {
    // YooKassa subscriptions are managed locally in our database.
    throw new Error('YooKassa subscriptions are managed locally')
  }
}
