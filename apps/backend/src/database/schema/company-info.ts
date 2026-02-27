import { pgTable, integer, varchar, text, timestamp } from 'drizzle-orm/pg-core'

// Single-row singleton table (id is always 1)
export const companyInfo = pgTable('company_info', {
  id: integer('id').primaryKey().default(1),
  appName: varchar('app_name', { length: 255 }).notNull().default('MVPTemplate'),
  companyName: varchar('company_name', { length: 255 }).notNull().default(''),
  tagline: varchar('tagline', { length: 500 }).notNull().default(''),
  supportEmail: varchar('support_email', { length: 255 }).notNull().default(''),
  website: varchar('website', { length: 500 }).notNull().default(''),
  phone: varchar('phone', { length: 50 }).notNull().default(''),
  address: text('address').notNull().default(''),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

export type CompanyInfo = typeof companyInfo.$inferSelect
export type NewCompanyInfo = typeof companyInfo.$inferInsert
