import { describe, it, expect } from 'vitest'
import { hashToken } from '../crypto'

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
