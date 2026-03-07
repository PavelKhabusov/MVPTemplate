import { describe, it, expect } from 'vitest'
import { updateProfileSchema, updateSettingsSchema } from '../users.schema'

describe('updateProfileSchema', () => {
  it('accepts empty object (all fields optional)', () => {
    const result = updateProfileSchema.safeParse({})
    expect(result.success).toBe(true)
  })

  it('accepts valid name', () => {
    const result = updateProfileSchema.safeParse({ name: 'John Doe' })
    expect(result.success).toBe(true)
  })

  it('rejects empty name when provided', () => {
    const result = updateProfileSchema.safeParse({ name: '' })
    expect(result.success).toBe(false)
  })

  it('rejects name longer than 255 characters', () => {
    const result = updateProfileSchema.safeParse({ name: 'a'.repeat(256) })
    expect(result.success).toBe(false)
  })

  it('accepts valid avatarUrl', () => {
    const result = updateProfileSchema.safeParse({ avatarUrl: 'https://example.com/avatar.png' })
    expect(result.success).toBe(true)
  })

  it('accepts null avatarUrl', () => {
    const result = updateProfileSchema.safeParse({ avatarUrl: null })
    expect(result.success).toBe(true)
  })

  it('rejects invalid avatarUrl', () => {
    const result = updateProfileSchema.safeParse({ avatarUrl: 'not-a-url' })
    expect(result.success).toBe(false)
  })

  it('accepts valid bio', () => {
    const result = updateProfileSchema.safeParse({ bio: 'Hello, I am a developer' })
    expect(result.success).toBe(true)
  })

  it('accepts null bio', () => {
    const result = updateProfileSchema.safeParse({ bio: null })
    expect(result.success).toBe(true)
  })

  it('rejects bio longer than 500 characters', () => {
    const result = updateProfileSchema.safeParse({ bio: 'x'.repeat(501) })
    expect(result.success).toBe(false)
  })

  it('accepts valid phone', () => {
    const result = updateProfileSchema.safeParse({ phone: '+79991234567' })
    expect(result.success).toBe(true)
  })

  it('accepts null phone', () => {
    const result = updateProfileSchema.safeParse({ phone: null })
    expect(result.success).toBe(true)
  })

  it('rejects phone longer than 50 characters', () => {
    const result = updateProfileSchema.safeParse({ phone: 'x'.repeat(51) })
    expect(result.success).toBe(false)
  })

  it('accepts valid location', () => {
    const result = updateProfileSchema.safeParse({ location: 'Moscow, Russia' })
    expect(result.success).toBe(true)
  })

  it('accepts null location', () => {
    const result = updateProfileSchema.safeParse({ location: null })
    expect(result.success).toBe(true)
  })

  it('rejects location longer than 255 characters', () => {
    const result = updateProfileSchema.safeParse({ location: 'x'.repeat(256) })
    expect(result.success).toBe(false)
  })

  it('accepts valid birthday in YYYY-MM-DD format', () => {
    const result = updateProfileSchema.safeParse({ birthday: '1990-05-15' })
    expect(result.success).toBe(true)
  })

  it('accepts null birthday', () => {
    const result = updateProfileSchema.safeParse({ birthday: null })
    expect(result.success).toBe(true)
  })

  it('rejects birthday in wrong format', () => {
    const result = updateProfileSchema.safeParse({ birthday: '15/05/1990' })
    expect(result.success).toBe(false)
  })

  it('rejects birthday with incomplete date', () => {
    const result = updateProfileSchema.safeParse({ birthday: '1990-5-1' })
    expect(result.success).toBe(false)
  })

  it('accepts all fields together', () => {
    const result = updateProfileSchema.safeParse({
      name: 'Jane',
      avatarUrl: 'https://cdn.example.com/img.jpg',
      bio: 'Bio text',
      phone: '+1234567890',
      location: 'NYC',
      birthday: '2000-01-01',
    })
    expect(result.success).toBe(true)
  })
})

describe('updateSettingsSchema', () => {
  it('accepts empty object (all fields optional)', () => {
    const result = updateSettingsSchema.safeParse({})
    expect(result.success).toBe(true)
  })

  it('accepts valid theme', () => {
    for (const theme of ['system', 'light', 'dark'] as const) {
      const result = updateSettingsSchema.safeParse({ theme })
      expect(result.success).toBe(true)
    }
  })

  it('rejects invalid theme', () => {
    const result = updateSettingsSchema.safeParse({ theme: 'blue' })
    expect(result.success).toBe(false)
  })

  it('accepts valid language', () => {
    const result = updateSettingsSchema.safeParse({ language: 'ru' })
    expect(result.success).toBe(true)
  })

  it('rejects language longer than 10 characters', () => {
    const result = updateSettingsSchema.safeParse({ language: 'a'.repeat(11) })
    expect(result.success).toBe(false)
  })

  it('accepts pushEnabled boolean', () => {
    const result = updateSettingsSchema.safeParse({ pushEnabled: true })
    expect(result.success).toBe(true)
  })

  it('rejects non-boolean pushEnabled', () => {
    const result = updateSettingsSchema.safeParse({ pushEnabled: 'yes' })
    expect(result.success).toBe(false)
  })

  it('accepts emailNotifications boolean', () => {
    const result = updateSettingsSchema.safeParse({ emailNotifications: false })
    expect(result.success).toBe(true)
  })

  it('rejects non-boolean emailNotifications', () => {
    const result = updateSettingsSchema.safeParse({ emailNotifications: 1 })
    expect(result.success).toBe(false)
  })

  it('accepts all settings together', () => {
    const result = updateSettingsSchema.safeParse({
      theme: 'dark',
      language: 'ja',
      pushEnabled: true,
      emailNotifications: false,
    })
    expect(result.success).toBe(true)
  })
})
