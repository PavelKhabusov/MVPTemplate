import { pgTable, uuid, varchar, integer, timestamp, boolean, jsonb, index } from 'drizzle-orm/pg-core'

export const plans = pgTable('plans', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: varchar('description', { length: 1000 }),
  priceAmount: integer('price_amount').notNull(),
  currency: varchar('currency', { length: 10 }).notNull().default('usd'),
  interval: varchar('interval', { length: 20 }).notNull(), // 'month' | 'year' | 'one_time'
  features: jsonb('features').$type<string[]>().default([]).notNull(),
  providerPriceId: varchar('provider_price_id', { length: 255 }),
  provider: varchar('provider', { length: 50 }).notNull(), // 'stripe' | 'yookassa'
  isActive: boolean('is_active').default(true).notNull(),
  sortOrder: integer('sort_order').default(0).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('plans_provider_idx').on(table.provider),
  index('plans_is_active_idx').on(table.isActive),
])

export type Plan = typeof plans.$inferSelect
export type NewPlan = typeof plans.$inferInsert
