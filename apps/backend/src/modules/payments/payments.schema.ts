import { z } from 'zod'

export const checkoutSchema = z.object({
  planId: z.string().uuid(),
  successUrl: z.string().url(),
  cancelUrl: z.string().url(),
})

export const cancelSubscriptionSchema = z.object({
  immediately: z.boolean().optional().default(false),
})

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})

export const createPlanSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
  priceAmount: z.number().int().min(0),
  currency: z.string().min(3).max(10).default('usd'),
  interval: z.enum(['month', 'year', 'one_time']),
  features: z.array(z.string()).default([]),
  providerPriceId: z.string().optional(),
  provider: z.enum(['stripe', 'yookassa', 'robokassa', 'paypal']),
  sortOrder: z.number().int().optional().default(0),
})

export const updatePlanSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(1000).optional(),
  priceAmount: z.number().int().min(0).optional(),
  currency: z.string().min(3).max(10).optional(),
  interval: z.enum(['month', 'year', 'one_time']).optional(),
  features: z.array(z.string()).optional(),
  providerPriceId: z.string().optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
})
