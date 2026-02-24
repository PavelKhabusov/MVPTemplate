import { S3Client, PutObjectCommand, DeleteObjectCommand, HeadObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3'
import { join, extname } from 'path'
import { writeFile, unlink, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import { lookup } from 'mime-types'
import type { FastifyRequest } from 'fastify'
import { env } from '../../config/env'

declare module 'fastify' {
  interface FastifyInstance {
    storageService: StorageService
  }
}

export interface StorageConfig {
  storageType: 'local' | 's3'
  s3Endpoint: string
  s3Bucket: string
  s3AccessKey: string
  s3SecretKey: string
  s3Region: string
  s3PublicUrl: string
}

export class StorageService {
  private storageType: 'local' | 's3'
  private s3Endpoint: string
  private s3Bucket: string
  private s3AccessKey: string
  private s3SecretKey: string
  private s3Region: string
  private s3PublicUrl: string
  private s3Client: S3Client | null = null
  private uploadsDir: string

  constructor() {
    this.storageType = env.STORAGE_TYPE
    this.s3Endpoint = env.S3_ENDPOINT ?? ''
    this.s3Bucket = env.S3_BUCKET ?? ''
    this.s3AccessKey = env.S3_ACCESS_KEY ?? ''
    this.s3SecretKey = env.S3_SECRET_KEY ?? ''
    this.s3Region = env.S3_REGION ?? 'us-east-1'
    this.s3PublicUrl = env.S3_PUBLIC_URL ?? ''
    this.uploadsDir = join(process.cwd(), 'uploads')

    if (this.isS3Configured()) {
      this.initS3Client()
    }
  }

  private initS3Client(): void {
    this.s3Client = new S3Client({
      endpoint: this.s3Endpoint,
      region: this.s3Region,
      credentials: {
        accessKeyId: this.s3AccessKey,
        secretAccessKey: this.s3SecretKey,
      },
      forcePathStyle: true,
    })
  }

  isS3Configured(): boolean {
    return !!(this.s3Endpoint && this.s3Bucket && this.s3AccessKey && this.s3SecretKey)
  }

  getStorageType(): 'local' | 's3' {
    return this.storageType
  }

  getUploadsDir(): string {
    return this.uploadsDir
  }

  getS3Client(): S3Client | null {
    return this.s3Client
  }

  getS3Bucket(): string {
    return this.s3Bucket
  }

  async upload(buffer: Buffer, subdir: string, filename: string): Promise<string> {
    const key = `${subdir}/${filename}`

    if (this.storageType === 's3' && this.s3Client) {
      const contentType = lookup(extname(filename)) || 'application/octet-stream'
      await this.s3Client.send(new PutObjectCommand({
        Bucket: this.s3Bucket,
        Key: key,
        Body: buffer,
        ContentType: contentType,
      }))
      return key
    }

    // Local storage
    const dir = join(this.uploadsDir, subdir)
    if (!existsSync(dir)) {
      await mkdir(dir, { recursive: true })
    }
    await writeFile(join(dir, filename), buffer)
    return key
  }

  async delete(key: string): Promise<void> {
    if (this.storageType === 's3' && this.s3Client) {
      try {
        await this.s3Client.send(new DeleteObjectCommand({
          Bucket: this.s3Bucket,
          Key: key,
        }))
      } catch {
        // Ignore S3 delete errors
      }
      return
    }

    // Local storage
    try {
      await unlink(join(this.uploadsDir, key))
    } catch {
      // Ignore local delete errors
    }
  }

  getPublicUrl(key: string, request: FastifyRequest): string {
    if (this.storageType === 's3' && this.s3PublicUrl) {
      return `${this.s3PublicUrl.replace(/\/$/, '')}/${key}`
    }

    const host = request.headers.host ?? `${env.HOST}:${env.PORT}`
    return `${request.protocol}://${host}/uploads/${key}`
  }

  async s3Exists(key: string): Promise<boolean> {
    if (!this.s3Client) return false
    try {
      await this.s3Client.send(new HeadObjectCommand({
        Bucket: this.s3Bucket,
        Key: key,
      }))
      return true
    } catch {
      return false
    }
  }

  async getS3ObjectCount(): Promise<{ fileCount: number; totalSize: number }> {
    if (!this.s3Client) return { fileCount: 0, totalSize: 0 }

    let fileCount = 0
    let totalSize = 0
    let continuationToken: string | undefined

    try {
      do {
        const response = await this.s3Client.send(new ListObjectsV2Command({
          Bucket: this.s3Bucket,
          ContinuationToken: continuationToken,
        }))

        if (response.Contents) {
          for (const obj of response.Contents) {
            fileCount++
            totalSize += obj.Size ?? 0
          }
        }

        continuationToken = response.NextContinuationToken
      } while (continuationToken)
    } catch {
      // S3 not accessible
    }

    return { fileCount, totalSize }
  }

  reconfigure(config: Partial<StorageConfig>): void {
    if (config.storageType !== undefined) this.storageType = config.storageType
    if (config.s3Endpoint !== undefined) this.s3Endpoint = config.s3Endpoint
    if (config.s3Bucket !== undefined) this.s3Bucket = config.s3Bucket
    if (config.s3AccessKey !== undefined) this.s3AccessKey = config.s3AccessKey
    if (config.s3SecretKey !== undefined) this.s3SecretKey = config.s3SecretKey
    if (config.s3Region !== undefined) this.s3Region = config.s3Region
    if (config.s3PublicUrl !== undefined) this.s3PublicUrl = config.s3PublicUrl

    if (this.isS3Configured()) {
      this.initS3Client()
    } else {
      this.s3Client = null
    }
  }

  getConfig(): StorageConfig & { s3Configured: boolean } {
    return {
      storageType: this.storageType,
      s3Configured: this.isS3Configured(),
      s3Endpoint: this.s3Endpoint,
      s3Bucket: this.s3Bucket,
      s3AccessKey: this.s3AccessKey ? this.s3AccessKey.slice(0, 4) + '••••••••' : '',
      s3SecretKey: this.s3SecretKey ? '••••••••' : '',
      s3Region: this.s3Region,
      s3PublicUrl: this.s3PublicUrl,
    }
  }
}
