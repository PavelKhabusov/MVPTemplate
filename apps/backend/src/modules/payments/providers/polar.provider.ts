import { Polar } from '@polar-sh/sdk'
import type {
  PaymentProvider,
  CreateCheckoutParams,
  CheckoutResult,
  WebhookEvent,
  CancelSubscriptionParams,
  RefundResult,
} from './payment-provider'

export class PolarProvider implements PaymentProvider {
  readonly name = 'polar' as const
  private client: Polar

  constructor(
    accessToken: string,
    private organizationId?: string,
  ) {
    this.client = new Polar({ accessToken })
  }

  async createCheckoutSession(params: CreateCheckoutParams): Promise<CheckoutResult> {
    // Polar uses product IDs — priceId maps to Polar product ID
    const checkout = await this.client.checkouts.create({
      products: [params.priceId],
      successUrl: params.successUrl,
      customerEmail: params.userEmail,
      metadata: {
        userId: params.userId,
        planId: params.planId,
        ...(params.metadata ?? {}),
      },
    })

    return {
      checkoutUrl: checkout.url,
      sessionId: checkout.id,
    }
  }

  async parseWebhook(rawBody: string, headers: Record<string, string>): Promise<WebhookEvent> {
    // Build a Request-like object for Polar SDK validateWebhook
    const event = await this.client.validateWebhook({
      request: {
        body: rawBody,
        method: 'POST',
        url: 'https://placeholder',
        headers,
      },
    })

    const eventType = (event as { type?: string }).type ?? ''

    // checkout.updated with status succeeded → payment.succeeded
    if (eventType === 'checkout.updated') {
      const data = (event as any).data
      if (data?.status === 'succeeded') {
        const meta = data.metadata ?? {}
        return {
          type: 'payment.succeeded',
          providerPaymentId: data.id,
          userId: meta.userId,
          planId: meta.planId,
          amount: data.amount ?? 0,
          currency: data.currency ?? 'usd',
          rawEvent: event,
        }
      }
    }

    // subscription.created
    if (eventType === 'subscription.created') {
      const data = (event as any).data
      const meta = data?.metadata ?? {}
      return {
        type: 'subscription.created',
        providerSubscriptionId: data?.id,
        userId: meta.userId,
        planId: meta.planId,
        currentPeriodStart: data?.currentPeriodStart ? new Date(data.currentPeriodStart) : undefined,
        currentPeriodEnd: data?.currentPeriodEnd ? new Date(data.currentPeriodEnd) : undefined,
        rawEvent: event,
      }
    }

    // subscription.updated / subscription.active
    if (eventType === 'subscription.updated' || eventType === 'subscription.active') {
      const data = (event as any).data
      return {
        type: 'subscription.updated',
        providerSubscriptionId: data?.id,
        status: data?.status,
        currentPeriodStart: data?.currentPeriodStart ? new Date(data.currentPeriodStart) : undefined,
        currentPeriodEnd: data?.currentPeriodEnd ? new Date(data.currentPeriodEnd) : undefined,
        cancelAtPeriodEnd: data?.cancelAtPeriodEnd ?? false,
        rawEvent: event,
      }
    }

    // subscription.canceled / subscription.revoked
    if (eventType === 'subscription.canceled' || eventType === 'subscription.revoked') {
      const data = (event as any).data
      return {
        type: 'subscription.canceled',
        providerSubscriptionId: data?.id,
        rawEvent: event,
      }
    }

    // order.paid
    if (eventType === 'order.paid') {
      const data = (event as any).data
      const meta = data?.metadata ?? {}
      return {
        type: 'payment.succeeded',
        providerPaymentId: data?.id,
        userId: meta.userId,
        planId: meta.planId,
        amount: data?.amount ?? 0,
        currency: data?.currency ?? 'usd',
        rawEvent: event,
      }
    }

    throw new Error(`Unhandled Polar event type: ${eventType}`)
  }

  async cancelSubscription(params: CancelSubscriptionParams): Promise<void> {
    await this.client.subscriptions.revoke({ id: params.providerSubscriptionId })
  }

  async getSubscription(providerSubscriptionId: string): Promise<{
    status: string
    currentPeriodEnd: Date
    cancelAtPeriodEnd: boolean
  }> {
    const sub = await this.client.subscriptions.get({ id: providerSubscriptionId })

    return {
      status: sub.status,
      currentPeriodEnd: sub.currentPeriodEnd ? new Date(sub.currentPeriodEnd) : new Date(),
      cancelAtPeriodEnd: sub.cancelAtPeriodEnd ?? false,
    }
  }

  async refundPayment(providerPaymentId: string, amountMinorUnits?: number): Promise<RefundResult> {
    const refund = await this.client.refunds.create({
      orderId: providerPaymentId,
      reason: 'customer_request',
      amount: amountMinorUnits ?? 0,
    })

    return {
      refundId: refund.id,
      amount: refund.amount,
      currency: refund.currency,
      status: refund.status,
    }
  }
}
