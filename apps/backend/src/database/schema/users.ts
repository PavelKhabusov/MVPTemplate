import { sql } from 'drizzle-orm'
import { pgTable, uuid, varchar, timestamp, text, jsonb, date, boolean, index } from 'drizzle-orm/pg-core'

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }),
  name: varchar('name', { length: 255 }).notNull(),
  avatarUrl: text('avatar_url'),
  bio: text('bio'),
  phone: varchar('phone', { length: 50 }),
  location: varchar('location', { length: 255 }),
  birthday: date('birthday'),
  role: varchar('role', { length: 50 }).default('user').notNull(),
  features: jsonb('features').$type<string[]>().default([]).notNull(),
  emailVerified: boolean('email_verified').default(false).notNull(),
  phoneVerified: boolean('phone_verified').default(false).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('users_name_tsv_idx').using('gin', sql`to_tsvector('english', ${table.name})`),
])

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
