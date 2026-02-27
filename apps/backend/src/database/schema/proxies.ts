import { pgTable, uuid, varchar, integer, boolean, timestamp, text } from 'drizzle-orm/pg-core'

export const proxies = pgTable('proxies', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  host: varchar('host', { length: 255 }).notNull(),
  protocol: varchar('protocol', { length: 20 }).default('http').notNull(),
  httpPort: integer('http_port'),
  socks5Port: integer('socks5_port'),
  username: varchar('username', { length: 255 }),
  password: varchar('password', { length: 512 }),
  isActive: boolean('is_active').default(true).notNull(),
  priority: integer('priority').default(0).notNull(),
  lastCheckedAt: timestamp('last_checked_at', { withTimezone: true }),
  lastCheckStatus: varchar('last_check_status', { length: 50 }),
  lastCheckMessage: text('last_check_message'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

export type ProxyRecord = typeof proxies.$inferSelect
export type NewProxy = typeof proxies.$inferInsert
