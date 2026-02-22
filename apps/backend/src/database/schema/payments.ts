import { pgTable, uuid, varchar, integer, timestamp, index } from 'drizzle-orm/pg-core'
import { users } from './users'

export const payments = pgTable('payments', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  amount: integer('amount').notNull(),
  currency: varchar('currency', { length: 10 }).notNull(),
  status: varchar('status', { length: 50 }).notNull().default('pending'),
  type: varchar('type', { length: 50 }).notNull(), // 'one_time' | 'subscription'
  provider: varchar('provider', { length: 50 }).notNull(),
  providerPaymentId: varchar('provider_payment_id', { length: 255 }),
  description: varchar('description', { length: 500 }),
  subscriptionId: uuid('subscription_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('payments_user_id_idx').on(table.userId),
  index('payments_provider_payment_id_idx').on(table.providerPaymentId),
  index('payments_status_idx').on(table.status),
  index('payments_created_at_idx').on(table.createdAt),
])

export type Payment = typeof payments.$inferSelect
export type NewPayment = typeof payments.$inferInsert
