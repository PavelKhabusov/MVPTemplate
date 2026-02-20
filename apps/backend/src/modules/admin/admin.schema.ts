import { z } from 'zod'

export const AVAILABLE_ROLES = ['user', 'admin', 'moderator'] as const
export type UserRole = (typeof AVAILABLE_ROLES)[number]

export const AVAILABLE_FEATURES = [
  'beta_access',
  'premium',
  'push_notifications',
  'advanced_analytics',
  'api_access',
  'custom_theme',
  'export_data',
  'priority_support',
] as const
export type UserFeature = (typeof AVAILABLE_FEATURES)[number]

export const listUsersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
})

export const updateUserAdminSchema = z.object({
  role: z.enum(AVAILABLE_ROLES).optional(),
  features: z.array(z.enum(AVAILABLE_FEATURES)).optional(),
})

export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>
export type UpdateUserAdminInput = z.infer<typeof updateUserAdminSchema>
