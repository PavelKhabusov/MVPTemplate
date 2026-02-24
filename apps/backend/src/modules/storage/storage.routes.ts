import { FastifyInstance } from 'fastify'
import fs from 'fs'
import { join, relative } from 'path'
import archiver from 'archiver'
import { PutObjectCommand, GetObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3'
import { Readable } from 'stream'
import { lookup } from 'mime-types'
import { authenticate } from '../../common/middleware/authenticate'
import { requireAdmin } from '../../common/middleware/require-admin'
import { sendSuccess } from '../../common/utils/response'
import { getEnvFilePath, updateEnvFile } from '../../common/utils/env-file'
import { AppError } from '../../common/errors/app-error'
import { updateStorageConfigSchema } from './storage.schema'

// In-memory migration state
let isMigrating = false
const migrationProgress = { total: 0, migrated: 0, skipped: 0, failed: 0, currentFile: '' }

function getAllFiles(dir: string, base?: string): string[] {
  if (!fs.existsSync(dir)) return []
  const results: string[] = []
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  for (const entry of entries) {
    const fullPath = join(dir, entry.name)
    if (entry.isDirectory()) {
      results.push(...getAllFiles(fullPath, base ?? dir))
    } else {
      results.push(relative(base ?? dir, fullPath))
    }
  }
  return results
}

function getLocalStats(uploadsDir: string): { fileCount: number; totalSizeMB: string; bySubdir: Record<string, { count: number; size: number }> } {
  if (!fs.existsSync(uploadsDir)) return { fileCount: 0, totalSizeMB: '0.00', bySubdir: {} }

  let fileCount = 0
  let totalSize = 0
  const bySubdir: Record<string, { count: number; size: number }> = {}

  function walk(dir: string, topLevel?: string) {
    const entries = fs.readdirSync(dir, { withFileTypes: true })
    for (const entry of entries) {
      const fullPath = join(dir, entry.name)
      if (entry.isDirectory()) {
        walk(fullPath, topLevel ?? entry.name)
      } else {
        const stat = fs.statSync(fullPath)
        fileCount++
        totalSize += stat.size
        const subdir = topLevel ?? '.'
        if (!bySubdir[subdir]) bySubdir[subdir] = { count: 0, size: 0 }
        bySubdir[subdir].count++
        bySubdir[subdir].size += stat.size
      }
    }
  }

  walk(uploadsDir)
  return { fileCount, totalSizeMB: (totalSize / 1024 / 1024).toFixed(2), bySubdir }
}

export async function storageRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authenticate)
  app.addHook('preHandler', requireAdmin)

  // GET /api/admin/storage/stats
  app.get('/stats', async (_request, reply) => {
    const storageService = app.storageService
    const uploadsDir = storageService.getUploadsDir()
    const local = getLocalStats(uploadsDir)

    const s3Data = await storageService.getS3ObjectCount()

    return sendSuccess(reply, {
      storageType: storageService.getStorageType(),
      s3Configured: storageService.isS3Configured(),
      local,
      s3: {
        fileCount: s3Data.fileCount,
        totalSizeMB: (s3Data.totalSize / 1024 / 1024).toFixed(2),
      },
    })
  })

  // GET /api/admin/storage/config
  app.get('/config', async (_request, reply) => {
    return sendSuccess(reply, app.storageService.getConfig())
  })

  // PUT /api/admin/storage/config
  app.put('/config', async (request, reply) => {
    const data = updateStorageConfigSchema.parse(request.body)

    // Build env patch (only non-undefined, non-masked values)
    const patch: Record<string, string | null> = {}
    if (data.storageType !== undefined) patch.STORAGE_TYPE = data.storageType
    if (data.s3Endpoint !== undefined) patch.S3_ENDPOINT = data.s3Endpoint || null
    if (data.s3Bucket !== undefined) patch.S3_BUCKET = data.s3Bucket || null
    if (data.s3AccessKey !== undefined && !data.s3AccessKey.includes('••••')) patch.S3_ACCESS_KEY = data.s3AccessKey || null
    if (data.s3SecretKey !== undefined && data.s3SecretKey !== '••••••••') patch.S3_SECRET_KEY = data.s3SecretKey || null
    if (data.s3Region !== undefined) patch.S3_REGION = data.s3Region || null
    if (data.s3PublicUrl !== undefined) patch.S3_PUBLIC_URL = data.s3PublicUrl || null

    if (Object.keys(patch).length > 0) {
      updateEnvFile(getEnvFilePath(), patch)
    }

    // Reconfigure service in memory (only pass non-masked values)
    const serviceConfig: Record<string, string> = {}
    if (data.storageType !== undefined) serviceConfig.storageType = data.storageType
    if (data.s3Endpoint !== undefined) serviceConfig.s3Endpoint = data.s3Endpoint
    if (data.s3Bucket !== undefined) serviceConfig.s3Bucket = data.s3Bucket
    if (data.s3AccessKey !== undefined && !data.s3AccessKey.includes('••••')) serviceConfig.s3AccessKey = data.s3AccessKey
    if (data.s3SecretKey !== undefined && data.s3SecretKey !== '••••••••') serviceConfig.s3SecretKey = data.s3SecretKey
    if (data.s3Region !== undefined) serviceConfig.s3Region = data.s3Region
    if (data.s3PublicUrl !== undefined) serviceConfig.s3PublicUrl = data.s3PublicUrl
    app.storageService.reconfigure(serviceConfig)

    return sendSuccess(reply, app.storageService.getConfig())
  })

  // POST /api/admin/storage/migrate
  app.post('/migrate', async (_request, reply) => {
    if (isMigrating) {
      throw AppError.conflict('Migration is already in progress')
    }

    const storageService = app.storageService
    if (!storageService.isS3Configured()) {
      throw AppError.badRequest('S3 is not configured')
    }

    const s3Client = storageService.getS3Client()
    const bucket = storageService.getS3Bucket()
    if (!s3Client || !bucket) {
      throw AppError.badRequest('S3 client not initialized')
    }

    const uploadsDir = storageService.getUploadsDir()
    const files = getAllFiles(uploadsDir)

    isMigrating = true
    migrationProgress.total = files.length
    migrationProgress.migrated = 0
    migrationProgress.skipped = 0
    migrationProgress.failed = 0
    migrationProgress.currentFile = ''

    // Run migration asynchronously
    ;(async () => {
      try {
        for (const filePath of files) {
          migrationProgress.currentFile = filePath
          const s3Key = filePath.replace(/\\/g, '/')

          // Check if already exists in S3
          const exists = await storageService.s3Exists(s3Key)
          if (exists) {
            migrationProgress.skipped++
            continue
          }

          try {
            const fullPath = join(uploadsDir, filePath)
            const buffer = fs.readFileSync(fullPath)
            const contentType = lookup(filePath) || 'application/octet-stream'

            await s3Client.send(new PutObjectCommand({
              Bucket: bucket,
              Key: s3Key,
              Body: buffer,
              ContentType: contentType,
            }))
            migrationProgress.migrated++
          } catch {
            migrationProgress.failed++
          }
        }
      } finally {
        isMigrating = false
        migrationProgress.currentFile = ''
      }
    })()

    return sendSuccess(reply, { message: 'Migration started', total: files.length })
  })

  // GET /api/admin/storage/migrate/status
  app.get('/migrate/status', async (_request, reply) => {
    return sendSuccess(reply, {
      isMigrating,
      ...migrationProgress,
    })
  })

  // GET /api/admin/storage/download-all
  app.get('/download-all', async (_request, reply) => {
    const uploadsDir = app.storageService.getUploadsDir()
    if (!fs.existsSync(uploadsDir)) {
      throw AppError.notFound('No uploads directory found')
    }

    const files = getAllFiles(uploadsDir)
    if (files.length === 0) {
      throw AppError.notFound('No files to download')
    }

    const dateStr = new Date().toISOString().slice(0, 10)
    reply.hijack()
    reply.raw.writeHead(200, {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename=uploads-backup-${dateStr}.zip`,
    })

    const archive = archiver('zip', { zlib: { level: 5 } })
    archive.pipe(reply.raw)
    archive.directory(uploadsDir, 'uploads')
    await archive.finalize()
  })

  // GET /api/admin/storage/download-all-s3
  app.get('/download-all-s3', async (_request, reply) => {
    const storageService = app.storageService
    if (!storageService.isS3Configured()) {
      throw AppError.badRequest('S3 is not configured')
    }

    const s3Client = storageService.getS3Client()
    const bucket = storageService.getS3Bucket()
    if (!s3Client || !bucket) {
      throw AppError.badRequest('S3 client not initialized')
    }

    // List all S3 objects
    const allKeys: string[] = []
    let continuationToken: string | undefined
    do {
      const listRes = await s3Client.send(new ListObjectsV2Command({
        Bucket: bucket,
        ContinuationToken: continuationToken,
      }))
      if (listRes.Contents) {
        for (const obj of listRes.Contents) {
          if (obj.Key) allKeys.push(obj.Key)
        }
      }
      continuationToken = listRes.NextContinuationToken
    } while (continuationToken)

    if (allKeys.length === 0) {
      throw AppError.notFound('No files in S3 bucket')
    }

    const dateStr = new Date().toISOString().slice(0, 10)
    reply.hijack()
    reply.raw.writeHead(200, {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename=s3-backup-${dateStr}.zip`,
    })

    const archive = archiver('zip', { zlib: { level: 5 } })
    archive.pipe(reply.raw)

    for (const key of allKeys) {
      try {
        const getRes = await s3Client.send(new GetObjectCommand({
          Bucket: bucket,
          Key: key,
        }))
        if (getRes.Body) {
          archive.append(getRes.Body as Readable, { name: key })
        }
      } catch {
        // Skip files that fail to download
      }
    }

    await archive.finalize()
  })
}
