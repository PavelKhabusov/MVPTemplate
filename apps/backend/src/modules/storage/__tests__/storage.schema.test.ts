import { describe, it, expect } from 'vitest'
import { updateStorageConfigSchema } from '../storage.schema'

describe('updateStorageConfigSchema', () => {
  it('should accept valid s3 config', () => {
    const result = updateStorageConfigSchema.safeParse({
      storageType: 's3',
      s3Endpoint: 'https://s3.example.com',
      s3Bucket: 'my-bucket',
      s3AccessKey: 'AKIA...',
      s3SecretKey: 'secret',
      s3Region: 'us-east-1',
      s3PublicUrl: 'https://cdn.example.com',
    })
    expect(result.success).toBe(true)
  })

  it('should accept valid local config', () => {
    const result = updateStorageConfigSchema.safeParse({
      storageType: 'local',
    })
    expect(result.success).toBe(true)
  })

  it('should accept empty object (all fields optional)', () => {
    const result = updateStorageConfigSchema.safeParse({})
    expect(result.success).toBe(true)
  })

  it('should reject invalid storageType', () => {
    const result = updateStorageConfigSchema.safeParse({
      storageType: 'gcs',
    })
    expect(result.success).toBe(false)
  })

  it('should reject non-string s3Endpoint', () => {
    const result = updateStorageConfigSchema.safeParse({
      s3Endpoint: 123,
    })
    expect(result.success).toBe(false)
  })

  it('should accept partial update with only s3Region', () => {
    const result = updateStorageConfigSchema.safeParse({
      s3Region: 'eu-west-1',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.s3Region).toBe('eu-west-1')
    }
  })
})
