import { vi, describe, it, expect, beforeEach } from 'vitest'

vi.mock('../../config/env', () => ({
  env: {
    PAYMENTS_ENABLED: true,
  },
}))

vi.mock('../payments.repository', () => ({
  paymentsRepository: {
    getActivePlans: vi.fn(),
    getPlanById: vi.fn(),
    createPlan: vi.fn(),
    getAllPlans: vi.fn(),
    updatePlan: vi.fn(),
    deactivatePlan: vi.fn(),
    deletePlan: vi.fn(),
    getPlanSubscriptionCount: vi.fn(),
    getActiveSubscription: vi.fn(),
    findSubscriptionByProviderId: vi.fn(),
    createSubscription: vi.fn(),
    updateSubscriptionByProviderId: vi.fn(),
    cancelSubscription: vi.fn(),
    createPayment: vi.fn(),
    updatePaymentByProviderId: vi.fn(),
    getPaymentHistory: vi.fn(),
    getRevenueStats: vi.fn(),
  },
}))

vi.mock('../providers/provider-factory', () => ({
  getPaymentProvider: vi.fn(),
  getEnabledProviders: vi.fn().mockReturnValue([]),
}))

import { paymentsService } from '../payments.service'
import { paymentsRepository } from '../payments.repository'

const mockPlan = {
  id: 'plan-123',
  name: 'Pro Monthly',
  description: 'Pro plan billed monthly',
  priceAmount: 999,
  currency: 'usd',
  interval: 'month',
  features: ['Feature A', 'Feature B'],
  providerPriceId: 'price_stripe_123',
  provider: 'stripe',
  isActive: true,
  sortOrder: 1,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
}

const mockSubscription = {
  id: 'sub-db-123',
  userId: 'user-123',
  planId: 'plan-123',
  status: 'active',
  provider: 'stripe',
  providerSubscriptionId: 'sub_stripe_abc123',
  providerCustomerId: 'cus_stripe_xyz',
  currentPeriodStart: new Date('2024-01-01'),
  currentPeriodEnd: new Date('2024-02-01'),
  cancelAtPeriodEnd: false,
  canceledAt: null as Date | null,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
}

describe('paymentsService.handleWebhookEvent', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(paymentsRepository.updatePaymentByProviderId).mockResolvedValue(null)
    vi.mocked(paymentsRepository.updateSubscriptionByProviderId).mockResolvedValue(null)
  })

  // ─── payment.succeeded ───────────────────────────────────────────────────────

  describe('payment.succeeded', () => {
    it('marks the payment as succeeded by providerPaymentId', async () => {
      await paymentsService.handleWebhookEvent({
        type: 'payment.succeeded',
        providerPaymentId: 'pi_abc123',
        rawEvent: {},
      })

      expect(paymentsRepository.updatePaymentByProviderId).toHaveBeenCalledWith('pi_abc123', {
        status: 'succeeded',
      })
    })

    it('does nothing when providerPaymentId is missing', async () => {
      await paymentsService.handleWebhookEvent({
        type: 'payment.succeeded',
        rawEvent: {},
      })

      expect(paymentsRepository.updatePaymentByProviderId).not.toHaveBeenCalled()
    })
  })

  // ─── payment.failed ──────────────────────────────────────────────────────────

  describe('payment.failed', () => {
    it('marks the payment as failed by providerPaymentId', async () => {
      await paymentsService.handleWebhookEvent({
        type: 'payment.failed',
        providerPaymentId: 'pi_failed_456',
        rawEvent: {},
      })

      expect(paymentsRepository.updatePaymentByProviderId).toHaveBeenCalledWith('pi_failed_456', {
        status: 'failed',
      })
    })
  })

  // ─── subscription.created ────────────────────────────────────────────────────

  describe('subscription.created', () => {
    it('creates a subscription record on first webhook delivery', async () => {
      vi.mocked(paymentsRepository.findSubscriptionByProviderId).mockResolvedValue(null)
      vi.mocked(paymentsRepository.getPlanById).mockResolvedValue(mockPlan)
      vi.mocked(paymentsRepository.createSubscription).mockResolvedValue(mockSubscription)

      await paymentsService.handleWebhookEvent({
        type: 'subscription.created',
        userId: 'user-123',
        planId: 'plan-123',
        providerSubscriptionId: 'sub_stripe_abc123',
        rawEvent: {},
      })

      expect(paymentsRepository.findSubscriptionByProviderId).toHaveBeenCalledWith(
        'sub_stripe_abc123',
      )
      expect(paymentsRepository.createSubscription).toHaveBeenCalledOnce()
      expect(paymentsRepository.createSubscription).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-123',
          planId: 'plan-123',
          status: 'active',
          provider: 'stripe',
          providerSubscriptionId: 'sub_stripe_abc123',
        }),
      )
    })

    it('is idempotent — skips duplicate webhook with same providerSubscriptionId', async () => {
      vi.mocked(paymentsRepository.findSubscriptionByProviderId).mockResolvedValue(
        mockSubscription,
      )

      await paymentsService.handleWebhookEvent({
        type: 'subscription.created',
        userId: 'user-123',
        planId: 'plan-123',
        providerSubscriptionId: 'sub_stripe_abc123',
        rawEvent: {},
      })

      expect(paymentsRepository.createSubscription).not.toHaveBeenCalled()
    })

    it('does nothing when userId or planId is missing', async () => {
      await paymentsService.handleWebhookEvent({
        type: 'subscription.created',
        providerSubscriptionId: 'sub_stripe_abc123',
        rawEvent: {},
      })

      expect(paymentsRepository.createSubscription).not.toHaveBeenCalled()
    })

    it('also marks the associated payment as succeeded (Robokassa combined webhook)', async () => {
      vi.mocked(paymentsRepository.findSubscriptionByProviderId).mockResolvedValue(null)
      vi.mocked(paymentsRepository.getPlanById).mockResolvedValue(mockPlan)
      vi.mocked(paymentsRepository.createSubscription).mockResolvedValue(mockSubscription)

      await paymentsService.handleWebhookEvent({
        type: 'subscription.created',
        userId: 'user-123',
        planId: 'plan-123',
        providerSubscriptionId: 'sub_stripe_abc123',
        providerPaymentId: 'pi_combined_789',
        rawEvent: {},
      })

      expect(paymentsRepository.updatePaymentByProviderId).toHaveBeenCalledWith(
        'pi_combined_789',
        { status: 'succeeded' },
      )
    })
  })

  // ─── subscription.updated ────────────────────────────────────────────────────

  describe('subscription.updated', () => {
    it('updates subscription status and period end', async () => {
      const newPeriodEnd = new Date('2024-03-01')

      await paymentsService.handleWebhookEvent({
        type: 'subscription.updated',
        providerSubscriptionId: 'sub_stripe_abc123',
        status: 'active',
        cancelAtPeriodEnd: true,
        currentPeriodEnd: newPeriodEnd,
        rawEvent: {},
      })

      expect(paymentsRepository.updateSubscriptionByProviderId).toHaveBeenCalledWith(
        'sub_stripe_abc123',
        expect.objectContaining({
          status: 'active',
          cancelAtPeriodEnd: true,
          currentPeriodEnd: newPeriodEnd,
        }),
      )
    })
  })

  // ─── subscription.canceled ───────────────────────────────────────────────────

  describe('subscription.canceled', () => {
    it('sets subscription status to canceled with canceledAt timestamp', async () => {
      await paymentsService.handleWebhookEvent({
        type: 'subscription.canceled',
        providerSubscriptionId: 'sub_stripe_abc123',
        rawEvent: {},
      })

      expect(paymentsRepository.updateSubscriptionByProviderId).toHaveBeenCalledWith(
        'sub_stripe_abc123',
        expect.objectContaining({
          status: 'canceled',
          canceledAt: expect.any(Date),
        }),
      )
    })
  })

  // ─── subscription.renewed ────────────────────────────────────────────────────

  describe('subscription.renewed', () => {
    it('updates subscription period dates and resets status to active', async () => {
      const newStart = new Date('2024-02-01')
      const newEnd = new Date('2024-03-01')

      await paymentsService.handleWebhookEvent({
        type: 'subscription.renewed',
        providerSubscriptionId: 'sub_stripe_abc123',
        currentPeriodStart: newStart,
        currentPeriodEnd: newEnd,
        rawEvent: {},
      })

      expect(paymentsRepository.updateSubscriptionByProviderId).toHaveBeenCalledWith(
        'sub_stripe_abc123',
        expect.objectContaining({
          status: 'active',
          currentPeriodStart: newStart,
          currentPeriodEnd: newEnd,
        }),
      )
    })
  })
})
