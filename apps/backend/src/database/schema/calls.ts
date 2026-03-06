import { pgTable, uuid, varchar, integer, timestamp, text, index } from 'drizzle-orm/pg-core'
import { users } from './users'

export const callStatusEnum = ['answered', 'missed', 'busy', 'failed'] as const
export type CallStatus = (typeof callStatusEnum)[number]

export const calls = pgTable('calls', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  sheetId: varchar('sheet_id', { length: 255 }).notNull(),
  rowIndex: integer('row_index').notNull(),
  contactName: varchar('contact_name', { length: 255 }),
  contactPhone: varchar('contact_phone', { length: 100 }).notNull(),
  mode: varchar('mode', { length: 20 }).notNull().default('browser'), // 'browser' | 'phone'
  managerPhone: varchar('manager_phone', { length: 100 }),
  status: varchar('status', { length: 20 }).$type<CallStatus>().notNull(),
  duration: integer('duration'), // seconds
  recordingUrl: text('recording_url'),
  note: text('note'),
  startedAt: timestamp('started_at', { withTimezone: true }).notNull(),
  endedAt: timestamp('ended_at', { withTimezone: true }),
  voximplantCallId: varchar('voximplant_call_id', { length: 255 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('calls_user_id_idx').on(table.userId),
  index('calls_sheet_id_idx').on(table.sheetId),
  index('calls_voximplant_call_id_idx').on(table.voximplantCallId),
])

export type Call = typeof calls.$inferSelect
export type NewCall = typeof calls.$inferInsert