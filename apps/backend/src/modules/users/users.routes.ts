import { FastifyInstance } from 'fastify'
import { randomUUID } from 'crypto'
import { mkdir } from 'fs/promises'
import { join, extname } from 'path'
import { fileTypeFromBuffer } from 'file-type'
import { authenticate } from '../../common/middleware/authenticate'
import { usersRepository } from './users.repository'
import { updateProfileSchema, updateSettingsSchema } from './users.schema'
import { sendSuccess } from '../../common/utils/response'
import { AppError } from '../../common/errors/app-error'

const UPLOADS_DIR = join(process.cwd(), 'uploads', 'avatars')
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export async function usersRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authenticate)

  // Ensure local uploads dir exists
  await mkdir(UPLOADS_DIR, { recursive: true })

  // GET /api/users/profile
  app.get('/profile', async (request, reply) => {
    const user = await usersRepository.findById(request.userId)
    if (!user) throw AppError.notFound('User not found')

    const { passwordHash, ...profile } = user
    return sendSuccess(reply, profile)
  })

  // PATCH /api/users/profile
  app.patch('/profile', async (request, reply) => {
    const body = updateProfileSchema.parse(request.body)
    const user = await usersRepository.updateProfile(request.userId, body)
    if (!user) throw AppError.notFound('User not found')

    const { passwordHash, ...profile } = user
    return sendSuccess(reply, profile)
  })

  // POST /api/users/avatar — upload avatar image
  app.post('/avatar', async (request, reply) => {
    request.log.info({ contentType: request.headers['content-type'] }, 'avatar upload start')
    const file = await request.file()
    request.log.info({ hasFile: !!file, filename: file?.filename, mimetype: file?.mimetype }, 'avatar file parsed')
    if (!file) throw AppError.badRequest('No file uploaded')
    if (!ALLOWED_TYPES.includes(file.mimetype)) {
      throw AppError.badRequest('Only JPEG, PNG, and WebP images are allowed')
    }

    const chunks: Buffer[] = []
    let size = 0
    for await (const chunk of file.file) {
      size += chunk.length
      if (size > MAX_FILE_SIZE) {
        throw AppError.badRequest('File too large (max 5 MB)')
      }
      chunks.push(chunk)
    }
    const buffer = Buffer.concat(chunks)

    // Validate actual file content via magic bytes (prevents MIME spoofing)
    const detected = await fileTypeFromBuffer(buffer)
    if (!detected || !ALLOWED_TYPES.includes(detected.mime)) {
      throw AppError.badRequest('Only JPEG, PNG, and WebP images are allowed')
    }

    const storage = app.storageService

    // Delete old avatar
    const currentUser = await usersRepository.findById(request.userId)
    if (currentUser?.avatarUrl) {
      // Extract storage key from URL (handles both local and S3 URLs)
      const match = currentUser.avatarUrl.match(/avatars\/[^?]+/)
      if (match) {
        await storage.delete(match[0])
      }
    }

    const ext = extname(file.filename) || '.jpg'
    const filename = `${request.userId}-${randomUUID()}${ext}`
    const key = await storage.upload(buffer, 'avatars', filename)
    const avatarUrl = storage.getPublicUrl(key, request)

    const user = await usersRepository.updateProfile(request.userId, { avatarUrl })
    if (!user) throw AppError.notFound('User not found')

    const { passwordHash, ...profile } = user
    return sendSuccess(reply, profile)
  })

  // DELETE /api/users/avatar — remove avatar
  app.delete('/avatar', async (request, reply) => {
    const storage = app.storageService
    const currentUser = await usersRepository.findById(request.userId)
    if (currentUser?.avatarUrl) {
      const match = currentUser.avatarUrl.match(/avatars\/[^?]+/)
      if (match) {
        await storage.delete(match[0])
      }
    }

    const user = await usersRepository.updateProfile(request.userId, { avatarUrl: null })
    if (!user) throw AppError.notFound('User not found')

    const { passwordHash, ...profile } = user
    return sendSuccess(reply, profile)
  })

  // GET /api/users/settings
  app.get('/settings', async (request, reply) => {
    const settings = await usersRepository.getSettings(request.userId)
    return sendSuccess(reply, settings?.settings ?? {})
  })

  // PATCH /api/users/settings
  app.patch('/settings', async (request, reply) => {
    const body = updateSettingsSchema.parse(request.body)
    const result = await usersRepository.upsertSettings(request.userId, body)
    return sendSuccess(reply, result.settings)
  })
}
