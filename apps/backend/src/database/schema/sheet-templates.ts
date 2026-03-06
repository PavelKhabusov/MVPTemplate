import { pgTable, uuid, varchar, boolean, timestamp, jsonb, index } from 'drizzle-orm/pg-core'
import { users } from './users'

export interface ColumnMappings {
  phone?: string
  name?: string
  status?: string
  date?: string
  duration?: string
  note?: string
  recording?: string
}

export const sheetTemplates = pgTable('sheet_templates', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  spreadsheetId: varchar('spreadsheet_id', { length: 255 }),
  spreadsheetName: varchar('spreadsheet_name', { length: 255 }),
  sheetName: varchar('sheet_name', { length: 255 }),
  columnMappings: jsonb('column_mappings').$type<ColumnMappings>().notNull().default({}),
  isDefault: boolean('is_default').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('sheet_templates_user_id_idx').on(table.userId),
  index('sheet_templates_spreadsheet_idx').on(table.userId, table.spreadsheetId, table.sheetName),
])

export type SheetTemplate = typeof sheetTemplates.$inferSelect
export type NewSheetTemplate = typeof sheetTemplates.$inferInsert
