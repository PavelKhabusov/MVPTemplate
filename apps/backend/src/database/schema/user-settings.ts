import { pgTable, uuid, jsonb, timestamp } from 'drizzle-orm/pg-core'
import { users } from './users.js'

export interface UserSettingsData {
  theme?: 'system' | 'light' | 'dark'
  language?: string
  pushEnabled?: boolean
  emailNotifications?: boolean
}

export const userSettings = pgTable('user_settings', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: 'cascade' }),
  settings: jsonb('settings').$type<UserSettingsData>().default({}).notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

export type UserSettings = typeof userSettings.$inferSelect
export type NewUserSettings = typeof userSettings.$inferInsert
