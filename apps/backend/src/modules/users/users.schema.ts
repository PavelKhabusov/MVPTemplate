import { z } from 'zod'

export const updateProfileSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  avatarUrl: z.string().url().nullable().optional(),
  bio: z.string().max(500).nullable().optional(),
  phone: z.string().max(50).nullable().optional(),
  location: z.string().max(255).nullable().optional(),
})

export const updateSettingsSchema = z.object({
  theme: z.enum(['system', 'light', 'dark']).optional(),
  language: z.string().max(10).optional(),
  pushEnabled: z.boolean().optional(),
  emailNotifications: z.boolean().optional(),
})

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>
export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>
