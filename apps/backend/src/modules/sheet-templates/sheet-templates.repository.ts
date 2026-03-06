import { eq, and } from 'drizzle-orm'
import { db } from '../../config/database'
import { sheetTemplates } from '../../database/schema'
import type { NewSheetTemplate, ColumnMappings } from '../../database/schema'

export const sheetTemplatesRepository = {
  async list(userId: string) {
    return db
      .select()
      .from(sheetTemplates)
      .where(eq(sheetTemplates.userId, userId))
      .orderBy(sheetTemplates.createdAt)
  },

  async findById(id: string, userId: string) {
    const result = await db
      .select()
      .from(sheetTemplates)
      .where(and(eq(sheetTemplates.id, id), eq(sheetTemplates.userId, userId)))
      .limit(1)
    return result[0] ?? null
  },

  async findBySheet(userId: string, spreadsheetId: string, sheetName: string) {
    const result = await db
      .select()
      .from(sheetTemplates)
      .where(
        and(
          eq(sheetTemplates.userId, userId),
          eq(sheetTemplates.spreadsheetId, spreadsheetId),
          eq(sheetTemplates.sheetName, sheetName)
        )
      )
      .limit(1)
    return result[0] ?? null
  },

  async findDefault(userId: string) {
    const result = await db
      .select()
      .from(sheetTemplates)
      .where(and(eq(sheetTemplates.userId, userId), eq(sheetTemplates.isDefault, true)))
      .limit(1)
    return result[0] ?? null
  },

  async create(data: Omit<NewSheetTemplate, 'id' | 'createdAt' | 'updatedAt'>) {
    const result = await db.insert(sheetTemplates).values(data).returning()
    return result[0]
  },

  async update(
    id: string,
    userId: string,
    data: Partial<{
      name: string
      spreadsheetId: string | null
      spreadsheetName: string | null
      sheetName: string | null
      columnMappings: ColumnMappings
      isDefault: boolean
    }>
  ) {
    const result = await db
      .update(sheetTemplates)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(sheetTemplates.id, id), eq(sheetTemplates.userId, userId)))
      .returning()
    return result[0] ?? null
  },

  async delete(id: string, userId: string) {
    await db
      .delete(sheetTemplates)
      .where(and(eq(sheetTemplates.id, id), eq(sheetTemplates.userId, userId)))
  },

  async clearDefault(userId: string) {
    await db
      .update(sheetTemplates)
      .set({ isDefault: false })
      .where(and(eq(sheetTemplates.userId, userId), eq(sheetTemplates.isDefault, true)))
  },
}
