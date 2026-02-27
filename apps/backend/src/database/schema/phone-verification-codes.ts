import { pgTable, uuid, varchar, timestamp, index, uniqueIndex } from 'drizzle-orm/pg-core'
import { users } from './users'

export const phoneVerificationCodes = pgTable('phone_verification_codes', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  phone: varchar('phone', { length: 50 }).notNull(),
  codeHash: varchar('code_hash', { length: 64 }).notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  verifiedAt: timestamp('verified_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('phone_verification_codes_user_id_idx').on(table.userId),
  uniqueIndex('phone_verification_codes_user_id_unique').on(table.userId),
])

export type PhoneVerificationCode = typeof phoneVerificationCodes.$inferSelect
export type NewPhoneVerificationCode = typeof phoneVerificationCodes.$inferInsert
