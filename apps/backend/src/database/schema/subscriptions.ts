import { pgTable, uuid, varchar, timestamp, boolean, index } from 'drizzle-orm/pg-core'
import { users } from './users'
import { plans } from './plans'

export const subscriptions = pgTable('subscriptions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  planId: uuid('plan_id')
    .notNull()
    .references(() => plans.id),
  status: varchar('status', { length: 50 }).notNull().default('active'),
  provider: varchar('provider', { length: 50 }).notNull(),
  providerSubscriptionId: varchar('provider_subscription_id', { length: 255 }),
  providerCustomerId: varchar('provider_customer_id', { length: 255 }),
  currentPeriodStart: timestamp('current_period_start', { withTimezone: true }).notNull(),
  currentPeriodEnd: timestamp('current_period_end', { withTimezone: true }).notNull(),
  cancelAtPeriodEnd: boolean('cancel_at_period_end').default(false).notNull(),
  canceledAt: timestamp('canceled_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('subscriptions_user_id_idx').on(table.userId),
  index('subscriptions_provider_sub_id_idx').on(table.providerSubscriptionId),
  index('subscriptions_status_idx').on(table.status),
])

export type Subscription = typeof subscriptions.$inferSelect
export type NewSubscription = typeof subscriptions.$inferInsert
