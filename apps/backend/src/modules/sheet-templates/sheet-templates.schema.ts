import { z } from 'zod'

const columnMappingsSchema = z.object({
  phone: z.string().optional(),
  name: z.string().optional(),
  status: z.string().optional(),
  date: z.string().optional(),
  duration: z.string().optional(),
  note: z.string().optional(),
  recording: z.string().optional(),
})

export const createTemplateSchema = z.object({
  name: z.string().min(1).max(255),
  spreadsheetId: z.string().max(255).optional(),
  spreadsheetName: z.string().max(255).optional(),
  sheetName: z.string().max(255).optional(),
  columnMappings: columnMappingsSchema.optional().default({}),
  isDefault: z.boolean().optional().default(false),
})

export const updateTemplateSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  spreadsheetId: z.string().max(255).nullable().optional(),
  spreadsheetName: z.string().max(255).nullable().optional(),
  sheetName: z.string().max(255).nullable().optional(),
  columnMappings: columnMappingsSchema.optional(),
  isDefault: z.boolean().optional(),
})

export const linkTemplateSchema = z.object({
  spreadsheetId: z.string().min(1).max(255),
  spreadsheetName: z.string().max(255).optional(),
  sheetName: z.string().max(255).optional(),
})
