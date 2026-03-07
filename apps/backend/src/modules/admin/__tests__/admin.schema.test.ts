import { describe, it, expect } from 'vitest'
import {
  listUsersQuerySchema,
  updateUserAdminSchema,
  AVAILABLE_ROLES,
  AVAILABLE_FEATURES,
} from '../admin.schema'

describe('listUsersQuerySchema', () => {
  it('accepts valid page and limit', () => {
    const result = listUsersQuerySchema.safeParse({ page: 2, limit: 50 })
    expect(result.success).toBe(true)
  })

  it('defaults page to 1 and limit to 20 when omitted', () => {
    const result = listUsersQuerySchema.safeParse({})
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.page).toBe(1)
      expect(result.data.limit).toBe(20)
    }
  })

  it('coerces string numbers', () => {
    const result = listUsersQuerySchema.safeParse({ page: '3', limit: '10' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.page).toBe(3)
      expect(result.data.limit).toBe(10)
    }
  })

  it('rejects page less than 1', () => {
    const result = listUsersQuerySchema.safeParse({ page: 0 })
    expect(result.success).toBe(false)
  })

  it('rejects limit greater than 100', () => {
    const result = listUsersQuerySchema.safeParse({ limit: 101 })
    expect(result.success).toBe(false)
  })

  it('rejects limit less than 1', () => {
    const result = listUsersQuerySchema.safeParse({ limit: 0 })
    expect(result.success).toBe(false)
  })

  it('accepts optional search string', () => {
    const result = listUsersQuerySchema.safeParse({ search: 'john' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.search).toBe('john')
    }
  })

  it('accepts missing search (undefined)', () => {
    const result = listUsersQuerySchema.safeParse({ page: 1 })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.search).toBeUndefined()
    }
  })
})

describe('updateUserAdminSchema', () => {
  it('accepts empty object (all fields optional)', () => {
    const result = updateUserAdminSchema.safeParse({})
    expect(result.success).toBe(true)
  })

  it('accepts valid role', () => {
    for (const role of AVAILABLE_ROLES) {
      const result = updateUserAdminSchema.safeParse({ role })
      expect(result.success).toBe(true)
    }
  })

  it('rejects invalid role', () => {
    const result = updateUserAdminSchema.safeParse({ role: 'superadmin' })
    expect(result.success).toBe(false)
  })

  it('accepts valid features array', () => {
    const result = updateUserAdminSchema.safeParse({ features: ['beta_access', 'premium'] })
    expect(result.success).toBe(true)
  })

  it('accepts empty features array', () => {
    const result = updateUserAdminSchema.safeParse({ features: [] })
    expect(result.success).toBe(true)
  })

  it('accepts all available features', () => {
    const result = updateUserAdminSchema.safeParse({ features: [...AVAILABLE_FEATURES] })
    expect(result.success).toBe(true)
  })

  it('rejects invalid feature in array', () => {
    const result = updateUserAdminSchema.safeParse({ features: ['beta_access', 'nonexistent'] })
    expect(result.success).toBe(false)
  })

  it('accepts role and features together', () => {
    const result = updateUserAdminSchema.safeParse({
      role: 'admin',
      features: ['api_access', 'priority_support'],
    })
    expect(result.success).toBe(true)
  })
})
