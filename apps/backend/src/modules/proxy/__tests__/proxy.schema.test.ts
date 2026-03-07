import { describe, it, expect } from 'vitest'
import { createProxySchema, updateProxySchema, toggleProxySchema } from '../proxy.schema'

describe('createProxySchema', () => {
  const validData = {
    name: 'US Proxy 1',
    host: '192.168.1.1',
  }

  it('accepts valid proxy data with required fields only', () => {
    const result = createProxySchema.safeParse(validData)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.protocol).toBe('http')
      expect(result.data.isActive).toBe(true)
      expect(result.data.priority).toBe(0)
    }
  })

  it('accepts valid proxy data with all fields', () => {
    const result = createProxySchema.safeParse({
      ...validData,
      protocol: 'socks5',
      httpPort: 8080,
      socks5Port: 1080,
      username: 'user',
      password: 'pass',
      isActive: false,
      priority: 50,
    })
    expect(result.success).toBe(true)
  })

  it('rejects missing name', () => {
    const result = createProxySchema.safeParse({ host: '192.168.1.1' })
    expect(result.success).toBe(false)
  })

  it('rejects empty name', () => {
    const result = createProxySchema.safeParse({ ...validData, name: '' })
    expect(result.success).toBe(false)
  })

  it('rejects missing host', () => {
    const result = createProxySchema.safeParse({ name: 'Proxy' })
    expect(result.success).toBe(false)
  })

  it('rejects empty host', () => {
    const result = createProxySchema.safeParse({ ...validData, host: '' })
    expect(result.success).toBe(false)
  })

  it('accepts valid protocol values', () => {
    for (const protocol of ['http', 'socks5'] as const) {
      const result = createProxySchema.safeParse({ ...validData, protocol })
      expect(result.success).toBe(true)
    }
  })

  it('rejects invalid protocol', () => {
    const result = createProxySchema.safeParse({ ...validData, protocol: 'ftp' })
    expect(result.success).toBe(false)
  })

  it('accepts valid httpPort', () => {
    const result = createProxySchema.safeParse({ ...validData, httpPort: 8080 })
    expect(result.success).toBe(true)
  })

  it('rejects httpPort of 0', () => {
    const result = createProxySchema.safeParse({ ...validData, httpPort: 0 })
    expect(result.success).toBe(false)
  })

  it('rejects httpPort above 65535', () => {
    const result = createProxySchema.safeParse({ ...validData, httpPort: 65536 })
    expect(result.success).toBe(false)
  })

  it('rejects negative httpPort', () => {
    const result = createProxySchema.safeParse({ ...validData, httpPort: -1 })
    expect(result.success).toBe(false)
  })

  it('accepts valid socks5Port', () => {
    const result = createProxySchema.safeParse({ ...validData, socks5Port: 1080 })
    expect(result.success).toBe(true)
  })

  it('rejects socks5Port above 65535', () => {
    const result = createProxySchema.safeParse({ ...validData, socks5Port: 70000 })
    expect(result.success).toBe(false)
  })

  it('rejects non-integer port', () => {
    const result = createProxySchema.safeParse({ ...validData, httpPort: 80.5 })
    expect(result.success).toBe(false)
  })

  it('rejects priority below 0', () => {
    const result = createProxySchema.safeParse({ ...validData, priority: -1 })
    expect(result.success).toBe(false)
  })

  it('rejects priority above 100', () => {
    const result = createProxySchema.safeParse({ ...validData, priority: 101 })
    expect(result.success).toBe(false)
  })

  it('accepts boundary priority values 0 and 100', () => {
    expect(createProxySchema.safeParse({ ...validData, priority: 0 }).success).toBe(true)
    expect(createProxySchema.safeParse({ ...validData, priority: 100 }).success).toBe(true)
  })

  it('accepts boundary port values 1 and 65535', () => {
    expect(createProxySchema.safeParse({ ...validData, httpPort: 1 }).success).toBe(true)
    expect(createProxySchema.safeParse({ ...validData, httpPort: 65535 }).success).toBe(true)
  })
})

describe('updateProxySchema', () => {
  it('accepts empty object (all fields optional via partial)', () => {
    const result = updateProxySchema.safeParse({})
    expect(result.success).toBe(true)
  })

  it('accepts partial update with name only', () => {
    const result = updateProxySchema.safeParse({ name: 'Updated Proxy' })
    expect(result.success).toBe(true)
  })

  it('accepts partial update with host and port', () => {
    const result = updateProxySchema.safeParse({ host: '10.0.0.1', httpPort: 3128 })
    expect(result.success).toBe(true)
  })

  it('rejects invalid port when provided', () => {
    const result = updateProxySchema.safeParse({ httpPort: 99999 })
    expect(result.success).toBe(false)
  })

  it('rejects empty name when provided', () => {
    const result = updateProxySchema.safeParse({ name: '' })
    expect(result.success).toBe(false)
  })

  it('rejects invalid protocol when provided', () => {
    const result = updateProxySchema.safeParse({ protocol: 'https' })
    expect(result.success).toBe(false)
  })
})

describe('toggleProxySchema', () => {
  it('accepts isActive: true', () => {
    const result = toggleProxySchema.safeParse({ isActive: true })
    expect(result.success).toBe(true)
  })

  it('accepts isActive: false', () => {
    const result = toggleProxySchema.safeParse({ isActive: false })
    expect(result.success).toBe(true)
  })

  it('rejects missing isActive', () => {
    const result = toggleProxySchema.safeParse({})
    expect(result.success).toBe(false)
  })

  it('rejects non-boolean isActive', () => {
    const result = toggleProxySchema.safeParse({ isActive: 'true' })
    expect(result.success).toBe(false)
  })
})
