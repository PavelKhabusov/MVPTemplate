import { z } from 'zod'

const VALID_NODES = ['NODE_1','NODE_2','NODE_3','NODE_4','NODE_5','NODE_6','NODE_7','NODE_8','NODE_9','NODE_10','NODE_11','NODE_12'] as const

export const connectSchema = z.object({
  login: z.string(),
  password: z.string(),
  appId: z.string().optional(),
  node: z.enum(VALID_NODES).optional(),
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