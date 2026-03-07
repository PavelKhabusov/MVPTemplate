import { describe, it, expect } from 'vitest'
import {
  checkoutSchema,
  cancelSubscriptionSchema,
  paginationSchema,
  createPlanSchema,
  updatePlanSchema,
} from '../payments.schema'

describe('checkoutSchema', () => {
  const validData = {
    planId: '550e8400-e29b-41d4-a716-446655440000',
    successUrl: 'https://example.com/success',
    cancelUrl: 'https://example.com/cancel',
  }

  it('accepts valid checkout data', () => {
    const result = checkoutSchema.safeParse(validData)
    expect(result.success).toBe(true)
  })

  it('rejects non-uuid planId', () => {
    const result = checkoutSchema.safeParse({ ...validData, planId: 'not-a-uuid' })
    expect(result.success).toBe(false)
  })

  it('rejects invalid successUrl', () => {
    const result = checkoutSchema.safeParse({ ...validData, successUrl: 'not-a-url' })
    expect(result.success).toBe(false)
  })

  it('rejects invalid cancelUrl', () => {
    const result = checkoutSchema.safeParse({ ...validData, cancelUrl: 'not-a-url' })
    expect(result.success).toBe(false)
  })

  it('rejects missing planId', () => {
    const { planId, ...rest } = validData
    const result = checkoutSchema.safeParse(rest)
    expect(result.success).toBe(false)
  })
})

describe('cancelSubscriptionSchema', () => {
  it('accepts immediately: true', () => {
    const result = cancelSubscriptionSchema.safeParse({ immediately: true })
    expect(result.success).toBe(true)
  })

  it('defaults immediately to false when omitted', () => {
    const result = cancelSubscriptionSchema.safeParse({})
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.immediately).toBe(false)
    }
  })

  it('rejects non-boolean immediately', () => {
    const result = cancelSubscriptionSchema.safeParse({ immediately: 'yes' })
    expect(result.success).toBe(false)
  })
})

describe('paginationSchema', () => {
  it('accepts valid page and limit', () => {
    const result = paginationSchema.safeParse({ page: 2, limit: 50 })
    expect(result.success).toBe(true)
  })

  it('defaults page to 1 and limit to 20 when omitted', () => {
    const result = paginationSchema.safeParse({})
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.page).toBe(1)
      expect(result.data.limit).toBe(20)
    }
  })

  it('coerces string numbers', () => {
    const result = paginationSchema.safeParse({ page: '3', limit: '10' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.page).toBe(3)
      expect(result.data.limit).toBe(10)
    }
  })

  it('rejects page less than 1', () => {
    const result = paginationSchema.safeParse({ page: 0 })
    expect(result.success).toBe(false)
  })

  it('rejects limit greater than 100', () => {
    const result = paginationSchema.safeParse({ limit: 101 })
    expect(result.success).toBe(false)
  })

  it('rejects limit less than 1', () => {
    const result = paginationSchema.safeParse({ limit: 0 })
    expect(result.success).toBe(false)
  })
})

describe('createPlanSchema', () => {
  const validData = {
    name: 'Pro Plan',
    priceAmount: 999,
    interval: 'month' as const,
    provider: 'stripe' as const,
  }

  it('accepts valid plan data with required fields only', () => {
    const result = createPlanSchema.safeParse(validData)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.currency).toBe('usd')
      expect(result.data.features).toEqual([])
      expect(result.data.sortOrder).toBe(0)
    }
  })

  it('accepts valid plan data with all optional fields', () => {
    const result = createPlanSchema.safeParse({
      ...validData,
      description: 'Best plan ever',
      currency: 'eur',
      features: ['unlimited', 'priority'],
      providerPriceId: 'price_123',
      sortOrder: 5,
    })
    expect(result.success).toBe(true)
  })

  it('rejects missing name', () => {
    const { name, ...rest } = validData
    const result = createPlanSchema.safeParse(rest)
    expect(result.success).toBe(false)
  })

  it('rejects empty name', () => {
    const result = createPlanSchema.safeParse({ ...validData, name: '' })
    expect(result.success).toBe(false)
  })

  it('rejects name longer than 255 characters', () => {
    const result = createPlanSchema.safeParse({ ...validData, name: 'a'.repeat(256) })
    expect(result.success).toBe(false)
  })

  it('rejects negative priceAmount', () => {
    const result = createPlanSchema.safeParse({ ...validData, priceAmount: -1 })
    expect(result.success).toBe(false)
  })

  it('rejects non-integer priceAmount', () => {
    const result = createPlanSchema.safeParse({ ...validData, priceAmount: 9.99 })
    expect(result.success).toBe(false)
  })

  it('accepts priceAmount of 0 (free plan)', () => {
    const result = createPlanSchema.safeParse({ ...validData, priceAmount: 0 })
    expect(result.success).toBe(true)
  })

  it('rejects missing interval', () => {
    const { interval, ...rest } = validData
    const result = createPlanSchema.safeParse(rest)
    expect(result.success).toBe(false)
  })

  it('rejects invalid interval value', () => {
    const result = createPlanSchema.safeParse({ ...validData, interval: 'week' })
    expect(result.success).toBe(false)
  })

  it('accepts all valid intervals', () => {
    for (const interval of ['month', 'year', 'one_time'] as const) {
      const result = createPlanSchema.safeParse({ ...validData, interval })
      expect(result.success).toBe(true)
    }
  })

  it('rejects missing provider', () => {
    const { provider, ...rest } = validData
    const result = createPlanSchema.safeParse(rest)
    expect(result.success).toBe(false)
  })

  it('rejects invalid provider', () => {
    const result = createPlanSchema.safeParse({ ...validData, provider: 'bitcoin' })
    expect(result.success).toBe(false)
  })

  it('accepts all valid providers', () => {
    for (const provider of ['stripe', 'yookassa', 'robokassa', 'paypal', 'polar'] as const) {
      const result = createPlanSchema.safeParse({ ...validData, provider })
      expect(result.success).toBe(true)
    }
  })

  it('rejects description longer than 1000 characters', () => {
    const result = createPlanSchema.safeParse({ ...validData, description: 'x'.repeat(1001) })
    expect(result.success).toBe(false)
  })
})

describe('updatePlanSchema', () => {
  it('accepts empty object (all fields optional)', () => {
    const result = updatePlanSchema.safeParse({})
    expect(result.success).toBe(true)
  })

  it('accepts partial update with name only', () => {
    const result = updatePlanSchema.safeParse({ name: 'New Name' })
    expect(result.success).toBe(true)
  })

  it('accepts partial update with isActive', () => {
    const result = updatePlanSchema.safeParse({ isActive: false })
    expect(result.success).toBe(true)
  })

  it('accepts partial update with multiple fields', () => {
    const result = updatePlanSchema.safeParse({
      name: 'Updated',
      priceAmount: 1999,
      features: ['feature1'],
    })
    expect(result.success).toBe(true)
  })

  it('rejects invalid priceAmount when provided', () => {
    const result = updatePlanSchema.safeParse({ priceAmount: -5 })
    expect(result.success).toBe(false)
  })

  it('rejects empty name when provided', () => {
    const result = updatePlanSchema.safeParse({ name: '' })
    expect(result.success).toBe(false)
  })

  it('rejects invalid interval when provided', () => {
    const result = updatePlanSchema.safeParse({ interval: 'weekly' })
    expect(result.success).toBe(false)
  })
})
