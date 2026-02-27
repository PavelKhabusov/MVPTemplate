import { AppError } from '../../common/errors/app-error'
import { paymentsRepository } from './payments.repository'
import { getPaymentProvider, getEnabledProviders } from './providers/provider-factory'
import type { WebhookEvent } from './providers/payment-provider'
import type { z } from 'zod'
import type { createPlanSchema, updatePlanSchema } from './payments.schema'

export const paymentsService = {
  async getPlans() {
    const providers = getEnabledProviders()
    return paymentsRepository.getActivePlans(providers.length > 0 ? providers : undefined)
  },

  async createCheckout(
    userId: string,
    userEmail: string,
    input: { planId: string; successUrl: string; cancelUrl: string },
  ) {
    const plan = await paymentsRepository.getPlanById(input.planId)
    if (!plan || !plan.isActive) throw AppError.notFound('Plan not found')

    const provider = getPaymentProvider(plan.provider as 'stripe' | 'yookassa' | 'robokassa')

    const result = await provider.createCheckoutSession({
      userId,
      userEmail,
      planId: plan.id,
      priceId: plan.providerPriceId ?? '',
      planName: plan.name,
      amount: plan.priceAmount,
      currency: plan.currency,
      interval: plan.interval as 'month' | 'year' | 'one_time',
      successUrl: input.successUrl,
      cancelUrl: input.cancelUrl,
    })

    await paymentsRepository.createPayment({
      userId,
      amount: plan.priceAmount,
      currency: plan.currency,
      status: 'pending',
      type: plan.interval === 'one_time' ? 'one_time' : 'subscription',
      provider: plan.provider,
      providerPaymentId: result.sessionId,
      description: plan.name,
    })

    return result
  },

  async handleWebhookEvent(event: WebhookEvent) {
    switch (event.type) {
      case 'payment.succeeded': {
        if (event.providerPaymentId) {
          await paymentsRepository.updatePaymentByProviderId(event.providerPaymentId, {
            status: 'succeeded',
          })
        }
        break
      }

      case 'subscription.created': {
        if (event.userId && event.planId) {
          // Idempotency guard: skip if this subscription was already processed
          if (event.providerSubscriptionId) {
            const existing = await paymentsRepository.findSubscriptionByProviderId(
              event.providerSubscriptionId,
            )
            if (existing) break
          }

          const plan = await paymentsRepository.getPlanById(event.planId)
          if (plan) {
            const now = new Date()
            const periodEnd = new Date(now)
            if (plan.interval === 'month') periodEnd.setMonth(periodEnd.getMonth() + 1)
            else if (plan.interval === 'year') periodEnd.setFullYear(periodEnd.getFullYear() + 1)

            await paymentsRepository.createSubscription({
              userId: event.userId,
              planId: event.planId,
              status: 'active',
              provider: plan.provider,
              providerSubscriptionId: event.providerSubscriptionId ?? null,
              providerCustomerId: event.providerCustomerId ?? null,
              currentPeriodStart: now,
              currentPeriodEnd: event.currentPeriodEnd ?? periodEnd,
              cancelAtPeriodEnd: false,
            })

            // Also mark the payment as succeeded (needed for providers like Robokassa
            // that emit a single webhook for both payment and subscription)
            if (event.providerPaymentId) {
              await paymentsRepository.updatePaymentByProviderId(event.providerPaymentId, {
                status: 'succeeded',
              })
            }
          }
        }
        break
      }

      case 'subscription.updated': {
        if (event.providerSubscriptionId) {
          await paymentsRepository.updateSubscriptionByProviderId(
            event.providerSubscriptionId,
            {
              status: event.status ?? 'active',
              cancelAtPeriodEnd: event.cancelAtPeriodEnd ?? false,
              currentPeriodEnd: event.currentPeriodEnd,
            },
          )
        }
        break
      }

      case 'subscription.canceled': {
        if (event.providerSubscriptionId) {
          await paymentsRepository.updateSubscriptionByProviderId(
            event.providerSubscriptionId,
            { status: 'canceled', canceledAt: new Date() },
          )
        }
        break
      }

      case 'subscription.renewed': {
        if (event.providerSubscriptionId) {
          await paymentsRepository.updateSubscriptionByProviderId(
            event.providerSubscriptionId,
            {
              currentPeriodStart: event.currentPeriodStart,
              currentPeriodEnd: event.currentPeriodEnd,
              status: 'active',
            },
          )
        }
        break
      }

      case 'payment.failed': {
        if (event.providerPaymentId) {
          await paymentsRepository.updatePaymentByProviderId(event.providerPaymentId, {
            status: 'failed',
          })
        }
        break
      }
    }
  },

  async getSubscription(userId: string) {
    const sub = await paymentsRepository.getActiveSubscription(userId)
    if (!sub) return null
    return {
      id: sub.subscription.id,
      planId: sub.subscription.planId,
      planName: sub.planName,
      status: sub.subscription.status,
      provider: sub.subscription.provider,
      currentPeriodStart: sub.subscription.currentPeriodStart.toISOString(),
      currentPeriodEnd: sub.subscription.currentPeriodEnd.toISOString(),
      cancelAtPeriodEnd: sub.subscription.cancelAtPeriodEnd,
    }
  },

  async cancelSubscription(userId: string) {
    const sub = await paymentsRepository.getActiveSubscription(userId)
    if (!sub) throw AppError.notFound('No active subscription')

    if (sub.subscription.providerSubscriptionId) {
      try {
        const provider = getPaymentProvider(sub.subscription.provider as 'stripe' | 'yookassa' | 'robokassa')
        await provider.cancelSubscription({
          providerSubscriptionId: sub.subscription.providerSubscriptionId,
        })
      } catch {
        // Provider cancel failed, still cancel locally
      }
    }

    await paymentsRepository.cancelSubscription(userId)
    return { message: 'Subscription will cancel at end of billing period' }
  },

  async getPaymentHistory(userId: string, page: number, limit: number) {
    return paymentsRepository.getPaymentHistory(userId, page, limit)
  },

  async createPlan(input: z.infer<typeof createPlanSchema>) {
    return paymentsRepository.createPlan(input)
  },

  async getAllPlans() {
    return paymentsRepository.getAllPlans()
  },

  async updatePlan(planId: string, input: z.infer<typeof updatePlanSchema>) {
    const plan = await paymentsRepository.getPlanById(planId)
    if (!plan) throw AppError.notFound('Plan not found')
    return paymentsRepository.updatePlan(planId, input)
  },

  async deletePlan(planId: string) {
    const plan = await paymentsRepository.getPlanById(planId)
    if (!plan) throw AppError.notFound('Plan not found')

    const subCount = await paymentsRepository.getPlanSubscriptionCount(planId)
    if (subCount > 0) {
      throw AppError.conflict(
        `Cannot delete plan "${plan.name}" — it has ${subCount} associated subscription(s). Deactivate it instead.`,
      )
    }

    return paymentsRepository.deletePlan(planId)
  },

  async getAdminStats(days: number) {
    return paymentsRepository.getRevenueStats(days)
  },

  async refundPayment(paymentId: string, amountMinorUnits?: number) {
    const payment = await paymentsRepository.getPaymentById(paymentId)
    if (!payment) throw AppError.notFound('Payment not found')

    if (payment.status === 'refunded') {
      throw AppError.conflict('Payment has already been refunded')
    }

    if (payment.status !== 'succeeded') {
      throw AppError.badRequest('Only succeeded payments can be refunded')
    }

    if (!payment.providerPaymentId) {
      throw AppError.badRequest('Payment has no provider payment ID — cannot refund')
    }

    const provider = getPaymentProvider(payment.provider as 'stripe' | 'yookassa' | 'robokassa' | 'paypal')
    const refund = await provider.refundPayment(payment.providerPaymentId, amountMinorUnits)

    await paymentsRepository.updatePaymentByProviderId(payment.providerPaymentId, {
      status: 'refunded',
    })

    return {
      refundId: refund.refundId,
      paymentId: payment.id,
      amount: refund.amount,
      currency: refund.currency,
      status: refund.status,
    }
  },
}
