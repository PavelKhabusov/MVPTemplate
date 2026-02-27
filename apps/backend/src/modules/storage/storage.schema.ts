import { z } from 'zod'

export const updateStorageConfigSchema = z.object({
  storageType: z.enum(['local', 's3']).optional(),
  s3Endpoint: z.string().optional(),
  s3Bucket: z.string().optional(),
  s3AccessKey: z.string().optional(),
  s3SecretKey: z.string().optional(),
  s3Region: z.string().optional(),
  s3PublicUrl: z.string().optional(),
})

export type UpdateStorageConfigInput = z.infer<typeof updateStorageConfigSchema>
