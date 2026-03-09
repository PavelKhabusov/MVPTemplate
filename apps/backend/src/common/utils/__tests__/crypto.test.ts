import { describe, it, expect, vi } from 'vitest'

// A fixed 32-byte hex key for testing (64 hex chars)
const TEST_KEY = 'a'.repeat(64)

// Mock env module — factory must be self-contained (hoisted above imports)
vi.mock('../../../config/env', () => ({
  env: {
    ENCRYPTION_KEY: 'a'.repeat(64),
  },
}))

import { hashToken, encrypt, decrypt } from '../crypto'

describe('hashToken', () => {
  it('should return consistent hash for the same input', () => {
    const token = 'my-secret-token'
    const hash1 = hashToken(token)
    const hash2 = hashToken(token)
    expect(hash1).toBe(hash2)
  })

  it('should return different hashes for different inputs', () => {
    const hash1 = hashToken('token-aaa')
    const hash2 = hashToken('token-bbb')
    expect(hash1).not.toBe(hash2)
  })

  it('should return a 64-char hex string (SHA-256)', () => {
    const hash = hashToken('anything')
    expect(hash).toMatch(/^[0-9a-f]{64}$/)
  })
})

describe('encrypt / decrypt', () => {
  it('should roundtrip: decrypt(encrypt(text)) === text', () => {
    const plaintext = 'super-secret-password-123'
    const encrypted = encrypt(plaintext)
    const decrypted = decrypt(encrypted)
    expect(decrypted).toBe(plaintext)
  })

  it('should produce different ciphertext each time (random IV)', () => {
    const plaintext = 'same-input'
    const enc1 = encrypt(plaintext)
    const enc2 = encrypt(plaintext)
    expect(enc1).not.toBe(enc2)
  })

  it('should produce format iv:authTag:ciphertext (3 hex parts)', () => {
    const encrypted = encrypt('hello')
    const parts = encrypted.split(':')
    expect(parts).toHaveLength(3)
    parts.forEach((part) => {
      expect(part).toMatch(/^[0-9a-f]+$/)
    })
  })

  it('should throw on empty string (ciphertext part is empty)', () => {
    // AES-256-GCM with empty plaintext produces empty ciphertext hex,
    // which is falsy in JS, so decrypt rejects it as invalid format
    const encrypted = encrypt('')
    expect(() => decrypt(encrypted)).toThrow('Invalid encrypted format')
  })

  it('should handle unicode text', () => {
    const text = 'Privet mir 12345'
    expect(decrypt(encrypt(text))).toBe(text)
  })

  it('should throw on invalid encrypted format', () => {
    expect(() => decrypt('not-valid')).toThrow('Invalid encrypted format')
  })

  it('should throw on tampered ciphertext', () => {
    const encrypted = encrypt('secret')
    const parts = encrypted.split(':')
    // Tamper with ciphertext
    parts[2] = 'ff'.repeat(parts[2].length / 2)
    expect(() => decrypt(parts.join(':'))).toThrow()
  })
})

describe('encrypt without ENCRYPTION_KEY', () => {
  it('should throw when ENCRYPTION_KEY is missing', async () => {
    vi.resetModules()
    vi.doMock('../../../config/env', () => ({
      env: { ENCRYPTION_KEY: undefined },
    }))
    const { encrypt: encryptNoKey } = await import('../crypto')
    expect(() => encryptNoKey('test')).toThrow('ENCRYPTION_KEY is not set')
  })
})
