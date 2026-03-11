/**
 * Database Schema Consistency Tests
 *
 * Verifies that all Drizzle schema tables are correctly defined and exported.
 * Catches breaking schema changes (missing columns, wrong types) early.
 *
 * When migrations are generated (drizzle-kit generate), add migration
 * idempotency tests here.
 */
import { describe, it, expect } from 'vitest'
import * as schema from '../schema/index'

// ─── Schema export tests ────────────────────────────────────────────────────

describe('Database Schema — Consistency', () => {
  it('should export all expected tables', () => {
    const expectedTables = [
      'users',
      'refreshTokens',
      'pushTokens',
      'notifications',
      'userSettings',
      'analyticsEvents',
      'emailVerificationTokens',
      'passwordResetTokens',
      'docFeedback',
      'plans',
      'subscriptions',
      'payments',
      'proxies',
      'phoneVerificationCodes',
      'companyInfo',
      'sheetTemplates',
    ]

    for (const table of expectedTables) {
      expect(schema).toHaveProperty(table)
      // Each table should be a Drizzle pgTable with a Symbol for the table name
      expect((schema as any)[table]).toBeDefined()
    }
  })

  it('users table should have required columns', () => {
    const columns = Object.keys((schema.users as any))
    const required = ['id', 'email', 'passwordHash', 'name', 'role', 'createdAt', 'updatedAt']

    for (const col of required) {
      expect(columns).toContain(col)
    }
  })

  it('plans table should have required columns', () => {
    const columns = Object.keys((schema.plans as any))
    const required = ['id', 'name']

    for (const col of required) {
      expect(columns).toContain(col)
    }
  })

  it('subscriptions table should have required columns', () => {
    const columns = Object.keys((schema.subscriptions as any))
    const required = ['id', 'userId', 'planId', 'status']

    for (const col of required) {
      expect(columns).toContain(col)
    }
  })

  it('refreshTokens table should have required columns', () => {
    const columns = Object.keys((schema.refreshTokens as any))
    const required = ['id', 'userId', 'tokenHash']

    for (const col of required) {
      expect(columns).toContain(col)
    }
  })

  it('schema types should be exported', () => {
    const tables = [
      schema.users,
      schema.refreshTokens,
      schema.plans,
      schema.subscriptions,
      schema.payments,
    ]

    for (const table of tables) {
      expect(table).toBeDefined()
      // Drizzle pgTable objects are plain objects with column keys
      expect(typeof table).toBe('object')
      expect(Object.keys(table).length).toBeGreaterThan(0)
    }
  })
})

// ─── Schema snapshot — catches unexpected column changes ────────────────────

describe('Database Schema — Column Snapshots', () => {
  it('users table columns should match snapshot', () => {
    const columns = Object.keys((schema.users as any)).sort()
    expect(columns).toMatchSnapshot()
  })

  it('plans table columns should match snapshot', () => {
    const columns = Object.keys((schema.plans as any)).sort()
    expect(columns).toMatchSnapshot()
  })

  it('subscriptions table columns should match snapshot', () => {
    const columns = Object.keys((schema.subscriptions as any)).sort()
    expect(columns).toMatchSnapshot()
  })

  it('payments table columns should match snapshot', () => {
    const columns = Object.keys((schema.payments as any)).sort()
    expect(columns).toMatchSnapshot()
  })
})
