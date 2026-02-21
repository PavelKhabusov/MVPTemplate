import { pgTable, uuid, varchar, timestamp, jsonb, index, integer } from 'drizzle-orm/pg-core'
import { users } from './users'

export const analyticsEvents = pgTable('analytics_events', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  deviceId: varchar('device_id', { length: 255 }),
  event: varchar('event', { length: 255 }).notNull(),
  eventType: varchar('event_type', { length: 50 }).notNull().default('track'),
  properties: jsonb('properties').$type<Record<string, unknown>>(),
  screenName: varchar('screen_name', { length: 255 }),
  sessionDuration: integer('session_duration'),
  clientTimestamp: timestamp('client_timestamp', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('analytics_events_user_id_idx').on(table.userId),
  index('analytics_events_event_idx').on(table.event),
  index('analytics_events_event_type_idx').on(table.eventType),
  index('analytics_events_created_at_idx').on(table.createdAt),
  index('analytics_events_screen_name_idx').on(table.screenName),
])

export type AnalyticsEvent = typeof analyticsEvents.$inferSelect
export type NewAnalyticsEvent = typeof analyticsEvents.$inferInsert
