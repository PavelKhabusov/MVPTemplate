import Stripe from 'stripe'
import type {
  PaymentProvider,
  CreateCheckoutParams,
  CheckoutResult,
  WebhookEvent,
  CancelSubscriptionParams,
  RefundResult,
} from './payment-provider'

export class StripeProvider implements PaymentProvider {
  readonly name = 'stripe' as const
  private stripe: Stripe

  constructor(
    secretKey: string,
    private webhookSecret: string,
  ) {
    this.stripe = new Stripe(secretKey)
  }

  async createCheckoutSession(params: CreateCheckoutParams): Promise<CheckoutResult> {
    const isSubscription = params.interval !== 'one_time'

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: isSubscription ? 'subscription' : 'payment',
      customer_email: params.userEmail,
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
      metadata: {
        userId: params.userId,
        planId: params.planId,
        ...params.metadata,
      },
    }

    if (params.priceId) {
      sessionParams.line_items = [{ price: params.priceId, quantity: 1 }]
    } else {
      sessionParams.line_items = [
        {
          price_data: {
            currency: params.currency,
            unit_amount: params.amount,
            product_data: { name: params.planName },
            ...(isSubscription
              ? { recurring: { interval: params.interval as 'month' | 'year' } }
              : {}),
          },
          quantity: 1,
        },
      ]
    }

    if (isSubscription) {
      sessionParams.subscription_data = {
        metadata: { userId: params.userId, planId: params.planId },
      }
    }

    const session = await this.stripe.checkout.sessions.create(sessionParams)

    return { checkoutUrl: session.url!, sessionId: session.id }
  }

  async parseWebhook(rawBody: string, headers: Record<string, string>): Promise<WebhookEvent> {
    const sig = headers['stripe-signature']
    const event = this.stripe.webhooks.constructEvent(rawBody, sig, this.webhookSecret)

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        if (session.mode === 'subscription') {
          return {
            type: 'subscription.created',
            providerSubscriptionId: session.subscription as string,
            providerCustomerId: session.customer as string,
            userId: session.metadata?.userId,
            planId: session.metadata?.planId,
            amount: session.amount_total ?? undefined,
            currency: session.currency ?? undefined,
            rawEvent: event,
          }
        }
        return {
          type: 'payment.succeeded',
          providerPaymentId: session.payment_intent as string,
          userId: session.metadata?.userId,
          planId: session.metadata?.planId,
          amount: session.amount_total ?? undefined,
          currency: session.currency ?? undefined,
          rawEvent: event,
        }
      }

      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice
        const period = invoice.lines.data[0]?.period
        const subId = invoice.parent?.subscription_details?.subscription
        return {
          type: 'subscription.renewed',
          providerSubscriptionId: typeof subId === 'string' ? subId : subId?.id,
          amount: invoice.amount_paid,
          currency: invoice.currency,
          currentPeriodStart: period ? new Date(period.start * 1000) : undefined,
          currentPeriodEnd: period ? new Date(period.end * 1000) : undefined,
          rawEvent: event,
        }
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription
        const item = sub.items.data[0]
        return {
          type: 'subscription.updated',
          providerSubscriptionId: sub.id,
          status: sub.status,
          cancelAtPeriodEnd: sub.cancel_at_period_end,
          currentPeriodStart: item ? new Date(item.current_period_start * 1000) : undefined,
          currentPeriodEnd: item ? new Date(item.current_period_end * 1000) : undefined,
          userId: sub.metadata?.userId,
          planId: sub.metadata?.planId,
          rawEvent: event,
        }
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription
        return {
          type: 'subscription.canceled',
          providerSubscriptionId: sub.id,
          userId: sub.metadata?.userId,
          rawEvent: event,
        }
      }

      default:
        throw new Error(`Unhandled Stripe event type: ${event.type}`)
    }
  }

  async cancelSubscription(params: CancelSubscriptionParams): Promise<void> {
    if (params.cancelImmediately) {
      await this.stripe.subscriptions.cancel(params.providerSubscriptionId)
    } else {
      await this.stripe.subscriptions.update(params.providerSubscriptionId, {
        cancel_at_period_end: true,
      })
    }
  }

  async getSubscription(providerSubscriptionId: string) {
    const sub = await this.stripe.subscriptions.retrieve(providerSubscriptionId, {
      expand: ['items'],
    })
    const item = sub.items.data[0]
    return {
      status: sub.status,
      currentPeriodEnd: item ? new Date(item.current_period_end * 1000) : new Date(),
      cancelAtPeriodEnd: sub.cancel_at_period_end,
    }
  }
}
