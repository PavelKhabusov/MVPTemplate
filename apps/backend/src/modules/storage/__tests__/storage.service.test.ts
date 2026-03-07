import { vi, describe, it, expect, beforeEach } from 'vitest'

// --- Mocks (hoisted to avoid TDZ issues) ---

const {
  mockS3Send,
  mockWriteFile,
  mockUnlink,
  mockMkdir,
  mockExistsSync,
  mockEnv,
} = vi.hoisted(() => {
  const mockS3Send = vi.fn()
  const mockWriteFile = vi.fn().mockResolvedValue(undefined)
  const mockUnlink = vi.fn().mockResolvedValue(undefined)
  const mockMkdir = vi.fn().mockResolvedValue(undefined)
  const mockExistsSync = vi.fn().mockReturnValue(false)
  const mockEnv = {
    STORAGE_TYPE: 'local' as const,
    S3_ENDPOINT: undefined as string | undefined,
    S3_BUCKET: undefined as string | undefined,
    S3_ACCESS_KEY: undefined as string | undefined,
    S3_SECRET_KEY: undefined as string | undefined,
    S3_REGION: 'us-east-1',
    S3_PUBLIC_URL: undefined as string | undefined,
    APP_URL: 'http://localhost:8081',
  }
  return { mockS3Send, mockWriteFile, mockUnlink, mockMkdir, mockExistsSync, mockEnv }
})

vi.mock('@aws-sdk/client-s3', () => ({
  S3Client: vi.fn().mockImplementation(() => ({ send: mockS3Send })),
  PutObjectCommand: vi.fn().mockImplementation((input) => ({ _type: 'PutObject', ...input })),
  DeleteObjectCommand: vi.fn().mockImplementation((input) => ({ _type: 'DeleteObject', ...input })),
  HeadObjectCommand: vi.fn().mockImplementation((input) => ({ _type: 'HeadObject', ...input })),
  ListObjectsV2Command: vi.fn().mockImplementation((input) => ({ _type: 'ListObjectsV2', ...input })),
}))

vi.mock('fs/promises', () => ({
  writeFile: (...args: unknown[]) => mockWriteFile(...args),
  unlink: (...args: unknown[]) => mockUnlink(...args),
  mkdir: (...args: unknown[]) => mockMkdir(...args),
}))

vi.mock('fs', () => ({
  existsSync: (...args: unknown[]) => mockExistsSync(...args),
}))

vi.mock('../../../config/env', () => ({
  env: mockEnv,
}))

import { StorageService } from '../storage.service'
import { PutObjectCommand, DeleteObjectCommand, HeadObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3'

// --- Helpers ---

function createLocalService(): StorageService {
  mockEnv.STORAGE_TYPE = 'local'
  mockEnv.S3_ENDPOINT = undefined
  mockEnv.S3_BUCKET = undefined
  mockEnv.S3_ACCESS_KEY = undefined
  mockEnv.S3_SECRET_KEY = undefined
  return new StorageService()
}

function createS3Service(): StorageService {
  mockEnv.STORAGE_TYPE = 's3'
  mockEnv.S3_ENDPOINT = 'https://s3.example.com'
  mockEnv.S3_BUCKET = 'test-bucket'
  mockEnv.S3_ACCESS_KEY = 'AKIATEST'
  mockEnv.S3_SECRET_KEY = 'secret123'
  mockEnv.S3_REGION = 'eu-west-1'
  mockEnv.S3_PUBLIC_URL = 'https://cdn.example.com'
  return new StorageService()
}

// --- Tests ---

describe('StorageService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockExistsSync.mockReturnValue(false)
  })

  // ============================
  // Storage mode selection
  // ============================

  describe('storage mode selection', () => {
    it('should default to local when no S3 credentials are set', () => {
      const service = createLocalService()
      expect(service.getStorageType()).toBe('local')
      expect(service.isS3Configured()).toBe(false)
      expect(service.getS3Client()).toBeNull()
    })

    it('should use s3 when all S3 credentials are provided', () => {
      const service = createS3Service()
      expect(service.getStorageType()).toBe('s3')
      expect(service.isS3Configured()).toBe(true)
      expect(service.getS3Client()).not.toBeNull()
    })

    it('should not create S3 client when endpoint is missing', () => {
      mockEnv.STORAGE_TYPE = 's3'
      mockEnv.S3_ENDPOINT = undefined
      mockEnv.S3_BUCKET = 'bucket'
      mockEnv.S3_ACCESS_KEY = 'key'
      mockEnv.S3_SECRET_KEY = 'secret'
      const service = new StorageService()
      expect(service.isS3Configured()).toBe(false)
      expect(service.getS3Client()).toBeNull()
    })

    it('should not create S3 client when bucket is missing', () => {
      mockEnv.STORAGE_TYPE = 's3'
      mockEnv.S3_ENDPOINT = 'https://s3.example.com'
      mockEnv.S3_BUCKET = undefined
      mockEnv.S3_ACCESS_KEY = 'key'
      mockEnv.S3_SECRET_KEY = 'secret'
      const service = new StorageService()
      expect(service.isS3Configured()).toBe(false)
    })
  })

  // ============================
  // Upload
  // ============================

  describe('upload', () => {
    describe('S3 mode', () => {
      it('should send PutObjectCommand with correct params', async () => {
        const service = createS3Service()
        mockS3Send.mockResolvedValue({})

        const buffer = Buffer.from('hello')
        const result = await service.upload(buffer, 'avatars', 'photo.png')

        expect(result).toBe('avatars/photo.png')
        expect(PutObjectCommand).toHaveBeenCalledWith({
          Bucket: 'test-bucket',
          Key: 'avatars/photo.png',
          Body: buffer,
          ContentType: 'image/png',
        })
        expect(mockS3Send).toHaveBeenCalledOnce()
      })

      it('should use application/octet-stream for unknown extensions', async () => {
        const service = createS3Service()
        mockS3Send.mockResolvedValue({})

        await service.upload(Buffer.from('data'), 'files', 'file.qqqzzz')

        expect(PutObjectCommand).toHaveBeenCalledWith(
          expect.objectContaining({ ContentType: 'application/octet-stream' }),
        )
      })

      it('should not write to local filesystem in S3 mode', async () => {
        const service = createS3Service()
        mockS3Send.mockResolvedValue({})

        await service.upload(Buffer.from('data'), 'docs', 'readme.txt')

        expect(mockWriteFile).not.toHaveBeenCalled()
        expect(mockMkdir).not.toHaveBeenCalled()
      })
    })

    describe('local mode', () => {
      it('should write file to uploads directory', async () => {
        const service = createLocalService()
        const buffer = Buffer.from('local data')

        const result = await service.upload(buffer, 'images', 'pic.jpg')

        expect(result).toBe('images/pic.jpg')
        expect(mockWriteFile).toHaveBeenCalledWith(
          expect.stringContaining('uploads/images/pic.jpg'),
          buffer,
        )
      })

      it('should create directory if it does not exist', async () => {
        mockExistsSync.mockReturnValue(false)
        const service = createLocalService()

        await service.upload(Buffer.from('data'), 'new-dir', 'file.txt')

        expect(mockMkdir).toHaveBeenCalledWith(
          expect.stringContaining('uploads/new-dir'),
          { recursive: true },
        )
      })

      it('should not create directory if it already exists', async () => {
        mockExistsSync.mockReturnValue(true)
        const service = createLocalService()

        await service.upload(Buffer.from('data'), 'existing', 'file.txt')

        expect(mockMkdir).not.toHaveBeenCalled()
      })

      it('should not call S3 in local mode', async () => {
        const service = createLocalService()

        await service.upload(Buffer.from('data'), 'dir', 'file.txt')

        expect(mockS3Send).not.toHaveBeenCalled()
      })
    })
  })

  // ============================
  // Delete
  // ============================

  describe('delete', () => {
    describe('S3 mode', () => {
      it('should send DeleteObjectCommand with correct params', async () => {
        const service = createS3Service()
        mockS3Send.mockResolvedValue({})

        await service.delete('avatars/photo.png')

        expect(DeleteObjectCommand).toHaveBeenCalledWith({
          Bucket: 'test-bucket',
          Key: 'avatars/photo.png',
        })
        expect(mockS3Send).toHaveBeenCalledOnce()
      })

      it('should not throw when S3 delete fails', async () => {
        const service = createS3Service()
        mockS3Send.mockRejectedValue(new Error('S3 error'))

        await expect(service.delete('key')).resolves.toBeUndefined()
      })

      it('should not call unlink in S3 mode', async () => {
        const service = createS3Service()
        mockS3Send.mockResolvedValue({})

        await service.delete('key')

        expect(mockUnlink).not.toHaveBeenCalled()
      })
    })

    describe('local mode', () => {
      it('should call unlink with correct path', async () => {
        const service = createLocalService()

        await service.delete('images/pic.jpg')

        expect(mockUnlink).toHaveBeenCalledWith(
          expect.stringContaining('uploads/images/pic.jpg'),
        )
      })

      it('should not throw when local delete fails', async () => {
        const service = createLocalService()
        mockUnlink.mockRejectedValue(new Error('ENOENT'))

        await expect(service.delete('missing.txt')).resolves.toBeUndefined()
      })

      it('should not call S3 in local mode', async () => {
        const service = createLocalService()

        await service.delete('key')

        expect(mockS3Send).not.toHaveBeenCalled()
      })
    })
  })

  // ============================
  // getPublicUrl
  // ============================

  describe('getPublicUrl', () => {
    const fakeRequest = {} as any

    it('should return S3 public URL when in S3 mode with public URL configured', () => {
      const service = createS3Service()

      const url = service.getPublicUrl('avatars/photo.png', fakeRequest)

      expect(url).toBe('https://cdn.example.com/avatars/photo.png')
    })

    it('should strip trailing slash from S3 public URL', () => {
      mockEnv.S3_PUBLIC_URL = 'https://cdn.example.com/'
      const service = createS3Service()

      const url = service.getPublicUrl('file.txt', fakeRequest)

      expect(url).toBe('https://cdn.example.com/file.txt')
    })

    it('should fall back to APP_URL for local storage', () => {
      const service = createLocalService()

      const url = service.getPublicUrl('images/pic.jpg', fakeRequest)

      expect(url).toBe('http://localhost:8081/uploads/images/pic.jpg')
    })
  })

  // ============================
  // s3Exists
  // ============================

  describe('s3Exists', () => {
    it('should return true when HeadObject succeeds', async () => {
      const service = createS3Service()
      mockS3Send.mockResolvedValue({})

      const exists = await service.s3Exists('avatars/photo.png')

      expect(exists).toBe(true)
      expect(HeadObjectCommand).toHaveBeenCalledWith({
        Bucket: 'test-bucket',
        Key: 'avatars/photo.png',
      })
    })

    it('should return false when HeadObject throws (object not found)', async () => {
      const service = createS3Service()
      mockS3Send.mockRejectedValue(new Error('NotFound'))

      const exists = await service.s3Exists('missing.txt')

      expect(exists).toBe(false)
    })

    it('should return false when S3 client is not initialized', async () => {
      const service = createLocalService()

      const exists = await service.s3Exists('any-key')

      expect(exists).toBe(false)
      expect(mockS3Send).not.toHaveBeenCalled()
    })
  })

  // ============================
  // getS3ObjectCount (list files)
  // ============================

  describe('getS3ObjectCount', () => {
    it('should return file count and total size', async () => {
      const service = createS3Service()
      mockS3Send.mockResolvedValue({
        Contents: [
          { Key: 'a.txt', Size: 100 },
          { Key: 'b.jpg', Size: 2000 },
          { Key: 'c.pdf', Size: 500 },
        ],
        NextContinuationToken: undefined,
      })

      const result = await service.getS3ObjectCount()

      expect(result).toEqual({ fileCount: 3, totalSize: 2600 })
      expect(ListObjectsV2Command).toHaveBeenCalledWith({
        Bucket: 'test-bucket',
        ContinuationToken: undefined,
      })
    })

    it('should handle pagination with continuation tokens', async () => {
      const service = createS3Service()
      mockS3Send
        .mockResolvedValueOnce({
          Contents: [{ Key: 'a.txt', Size: 100 }],
          NextContinuationToken: 'token-1',
        })
        .mockResolvedValueOnce({
          Contents: [{ Key: 'b.txt', Size: 200 }],
          NextContinuationToken: undefined,
        })

      const result = await service.getS3ObjectCount()

      expect(result).toEqual({ fileCount: 2, totalSize: 300 })
      expect(mockS3Send).toHaveBeenCalledTimes(2)
    })

    it('should handle objects with undefined Size', async () => {
      const service = createS3Service()
      mockS3Send.mockResolvedValue({
        Contents: [{ Key: 'a.txt', Size: undefined }],
        NextContinuationToken: undefined,
      })

      const result = await service.getS3ObjectCount()

      expect(result).toEqual({ fileCount: 1, totalSize: 0 })
    })

    it('should handle empty bucket (no Contents)', async () => {
      const service = createS3Service()
      mockS3Send.mockResolvedValue({
        Contents: undefined,
        NextContinuationToken: undefined,
      })

      const result = await service.getS3ObjectCount()

      expect(result).toEqual({ fileCount: 0, totalSize: 0 })
    })

    it('should return zeros when S3 client is not initialized', async () => {
      const service = createLocalService()

      const result = await service.getS3ObjectCount()

      expect(result).toEqual({ fileCount: 0, totalSize: 0 })
      expect(mockS3Send).not.toHaveBeenCalled()
    })

    it('should return zeros when S3 throws an error', async () => {
      const service = createS3Service()
      mockS3Send.mockRejectedValue(new Error('AccessDenied'))

      const result = await service.getS3ObjectCount()

      expect(result).toEqual({ fileCount: 0, totalSize: 0 })
    })
  })

  // ============================
  // reconfigure
  // ============================

  describe('reconfigure', () => {
    it('should switch from local to S3 when all credentials provided', () => {
      const service = createLocalService()
      expect(service.isS3Configured()).toBe(false)

      service.reconfigure({
        storageType: 's3',
        s3Endpoint: 'https://s3.new.com',
        s3Bucket: 'new-bucket',
        s3AccessKey: 'NEWKEY',
        s3SecretKey: 'NEWSECRET',
      })

      expect(service.getStorageType()).toBe('s3')
      expect(service.isS3Configured()).toBe(true)
      expect(service.getS3Client()).not.toBeNull()
    })

    it('should nullify S3 client when credentials are removed', () => {
      const service = createS3Service()
      expect(service.getS3Client()).not.toBeNull()

      service.reconfigure({
        s3Endpoint: '',
        s3Bucket: '',
        s3AccessKey: '',
        s3SecretKey: '',
      })

      expect(service.isS3Configured()).toBe(false)
      expect(service.getS3Client()).toBeNull()
    })

    it('should update region without affecting other fields', () => {
      const service = createS3Service()

      service.reconfigure({ s3Region: 'ap-southeast-1' })

      // Still configured (other creds untouched)
      expect(service.isS3Configured()).toBe(true)
      expect(service.getS3Bucket()).toBe('test-bucket')
    })
  })

  // ============================
  // getConfig
  // ============================

  describe('getConfig', () => {
    it('should mask secret key completely', () => {
      const service = createS3Service()
      const config = service.getConfig()

      expect(config.s3SecretKey).toBe('••••••••')
    })

    it('should partially mask access key (show first 4 chars)', () => {
      const service = createS3Service()
      const config = service.getConfig()

      expect(config.s3AccessKey).toBe('AKIA••••••••')
    })

    it('should return empty strings for keys when not configured', () => {
      const service = createLocalService()
      const config = service.getConfig()

      expect(config.s3AccessKey).toBe('')
      expect(config.s3SecretKey).toBe('')
      expect(config.s3Configured).toBe(false)
    })

    it('should return all config fields', () => {
      const service = createS3Service()
      const config = service.getConfig()

      expect(config).toMatchObject({
        storageType: 's3',
        s3Configured: true,
        s3Endpoint: 'https://s3.example.com',
        s3Bucket: 'test-bucket',
        s3Region: 'eu-west-1',
        s3PublicUrl: 'https://cdn.example.com',
      })
    })
  })
})
