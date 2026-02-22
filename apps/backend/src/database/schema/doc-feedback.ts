import { pgTable, uuid, varchar, boolean, timestamp, index } from 'drizzle-orm/pg-core'
import { users } from './users'

export const docFeedback = pgTable('doc_feedback', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  pageId: varchar('page_id', { length: 255 }).notNull(),
  helpful: boolean('helpful').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('doc_feedback_page_id_idx').on(table.pageId),
  index('doc_feedback_user_id_idx').on(table.userId),
])

export type DocFeedback = typeof docFeedback.$inferSelect
export type NewDocFeedback = typeof docFeedback.$inferInsert
