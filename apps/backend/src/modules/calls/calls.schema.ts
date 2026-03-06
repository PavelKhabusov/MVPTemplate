import { z } from 'zod'

export const initiateCallSchema = z.object({
  to: z.string(),
  mode: z.enum(['browser', 'phone']),
  contactName: z.string().optional(),
  sheetId: z.string(),
  rowIndex: z.number().int(),
  managerPhone: z.string().optional(),
})

export const callsQuerySchema = z.object({
  sheetId: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
})

export type InitiateCallInput = z.infer<typeof initiateCallSchema>
export type CallsQuery = z.infer<typeof callsQuerySchema>