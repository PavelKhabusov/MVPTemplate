import { z } from 'zod'

export const createProxySchema = z.object({
  name: z.string().min(1),
  host: z.string().min(1),
  protocol: z.enum(['http', 'socks5']).default('http'),
  httpPort: z.number().int().min(1).max(65535).optional(),
  socks5Port: z.number().int().min(1).max(65535).optional(),
  username: z.string().optional(),
  password: z.string().optional(),
  isActive: z.boolean().default(true),
  priority: z.number().int().min(0).max(100).default(0),
})

export const updateProxySchema = createProxySchema.partial()

export const toggleProxySchema = z.object({
  isActive: z.boolean(),
})
