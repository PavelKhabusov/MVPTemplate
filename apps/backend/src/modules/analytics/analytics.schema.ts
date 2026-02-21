import { z } from 'zod'

const analyticsEventSchema = z.object({
  event: z.string().min(1).max(255),
  eventType: z.enum(['track', 'screen', 'identify', 'session_start', 'session_end']).default('track'),
  properties: z.record(z.unknown()).optional(),
  screenName: z.string().max(255).optional(),
  sessionDuration: z.number().int().min(0).optional(),
  clientTimestamp: z.string().datetime(),
})

export const ingestEventsSchema = z.object({
  deviceId: z.string().min(1).max(255),
  events: z.array(analyticsEventSchema).min(1).max(100),
})

export const analyticsQuerySchema = z.object({
  days: z.coerce.number().int().min(1).max(365).default(30),
})

export type IngestEventsInput = z.infer<typeof ingestEventsSchema>
export type AnalyticsQuery = z.infer<typeof analyticsQuerySchema>
