import { createHash, createCipheriv, createDecipheriv, randomBytes } from 'crypto'
import { env } from '../../config/env'

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

// AES-256-GCM encryption for sensitive fields (e.g. Voximplant password)
const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 16

function getEncryptionKey(): Buffer {
  if (!env.ENCRYPTION_KEY) throw new Error('ENCRYPTION_KEY is not set')
  return Buffer.from(env.ENCRYPTION_KEY, 'hex')
}

export function encrypt(plaintext: string): string {
  const iv = randomBytes(IV_LENGTH)
  const cipher = createCipheriv(ALGORITHM, getEncryptionKey(), iv)
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const authTag = cipher.getAuthTag()
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`
}

export function decrypt(encoded: string): string {
  const [ivHex, authTagHex, ciphertextHex] = encoded.split(':')
  if (!ivHex || !authTagHex || !ciphertextHex) throw new Error('Invalid encrypted format')
  const iv = Buffer.from(ivHex, 'hex')
  const authTag = Buffer.from(authTagHex, 'hex')
  const ciphertext = Buffer.from(ciphertextHex, 'hex')
  const decipher = createDecipheriv(ALGORITHM, getEncryptionKey(), iv)
  decipher.setAuthTag(authTag)
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8')
}
