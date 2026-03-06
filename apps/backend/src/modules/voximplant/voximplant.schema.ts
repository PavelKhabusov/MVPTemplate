import { z } from 'zod'

export const connectSchema = z.object({
  login: z.string(),
  password: z.string(),
  appId: z.string().optional(),
})

export const webhookSchema = z.object({
  voximplantCallId: z.string(),
  event: z.enum(['call.connected', 'call.disconnected', 'call.failed']).optional(),
  duration: z.number().optional(),
  recordingUrl: z.string().optional(),
  status: z.string().optional(),
})

export type ConnectInput = z.infer<typeof connectSchema>
export type WebhookInput = z.infer<typeof webhookSchema>