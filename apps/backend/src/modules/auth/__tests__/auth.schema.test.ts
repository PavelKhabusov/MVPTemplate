import { describe, it, expect } from 'vitest'
import {
  registerSchema,
  loginSchema,
  refreshSchema,
  googleAuthSchema,
  verifyEmailSchema,
  requestPasswordResetSchema,
  resetPasswordSchema,
  resendVerificationSchema,
  sendPhoneCodeSchema,
  verifyPhoneSchema,
} from '../auth.schema'

describe('registerSchema', () => {
  const validData = {
    email: 'test@example.com',
    password: 'SecurePass1!',
    name: 'Test User',
  }

  it('accepts valid registration data', () => {
    const result = registerSchema.safeParse(validData)
    expect(result.success).toBe(true)
  })

  it('rejects missing email', () => {
    const result = registerSchema.safeParse({ password: 'SecurePass1!', name: 'Test' })
    expect(result.success).toBe(false)
  })

  it('rejects invalid email', () => {
    const result = registerSchema.safeParse({ ...validData, email: 'not-an-email' })
    expect(result.success).toBe(false)
  })

  it('rejects missing password', () => {
    const result = registerSchema.safeParse({ email: 'a@b.com', name: 'Test' })
    expect(result.success).toBe(false)
  })

  it('rejects password shorter than 8 characters', () => {
    const result = registerSchema.safeParse({ ...validData, password: 'short' })
    expect(result.success).toBe(false)
  })

  it('rejects password longer than 128 characters', () => {
    const result = registerSchema.safeParse({ ...validData, password: 'a'.repeat(129) })
    expect(result.success).toBe(false)
  })

  it('rejects missing name', () => {
    const result = registerSchema.safeParse({ email: 'a@b.com', password: 'SecurePass1!' })
    expect(result.success).toBe(false)
  })

  it('rejects empty name', () => {
    const result = registerSchema.safeParse({ ...validData, name: '' })
    expect(result.success).toBe(false)
  })

  it('rejects name longer than 255 characters', () => {
    const result = registerSchema.safeParse({ ...validData, name: 'a'.repeat(256) })
    expect(result.success).toBe(false)
  })
})

describe('loginSchema', () => {
  const validData = { email: 'test@example.com', password: 'mypassword' }

  it('accepts valid login data', () => {
    const result = loginSchema.safeParse(validData)
    expect(result.success).toBe(true)
  })

  it('rejects missing email', () => {
    const result = loginSchema.safeParse({ password: 'mypassword' })
    expect(result.success).toBe(false)
  })

  it('rejects missing password', () => {
    const result = loginSchema.safeParse({ email: 'a@b.com' })
    expect(result.success).toBe(false)
  })

  it('rejects invalid email format', () => {
    const result = loginSchema.safeParse({ ...validData, email: 'bad' })
    expect(result.success).toBe(false)
  })

  it('rejects empty password', () => {
    const result = loginSchema.safeParse({ ...validData, password: '' })
    expect(result.success).toBe(false)
  })

  it('rejects password longer than 128 characters', () => {
    const result = loginSchema.safeParse({ ...validData, password: 'x'.repeat(129) })
    expect(result.success).toBe(false)
  })
})

describe('refreshSchema', () => {
  it('accepts valid refresh token', () => {
    const result = refreshSchema.safeParse({ refreshToken: 'some-token-value' })
    expect(result.success).toBe(true)
  })

  it('rejects empty refresh token', () => {
    const result = refreshSchema.safeParse({ refreshToken: '' })
    expect(result.success).toBe(false)
  })

  it('rejects missing refresh token', () => {
    const result = refreshSchema.safeParse({})
    expect(result.success).toBe(false)
  })

  it('rejects refresh token longer than 2048 characters', () => {
    const result = refreshSchema.safeParse({ refreshToken: 'a'.repeat(2049) })
    expect(result.success).toBe(false)
  })
})

describe('googleAuthSchema', () => {
  it('accepts valid idToken', () => {
    const result = googleAuthSchema.safeParse({ idToken: 'google-id-token-123' })
    expect(result.success).toBe(true)
  })

  it('rejects empty idToken', () => {
    const result = googleAuthSchema.safeParse({ idToken: '' })
    expect(result.success).toBe(false)
  })

  it('rejects missing idToken', () => {
    const result = googleAuthSchema.safeParse({})
    expect(result.success).toBe(false)
  })
})

describe('verifyEmailSchema', () => {
  it('accepts valid token', () => {
    const result = verifyEmailSchema.safeParse({ token: 'verify-token-abc' })
    expect(result.success).toBe(true)
  })

  it('rejects empty token', () => {
    const result = verifyEmailSchema.safeParse({ token: '' })
    expect(result.success).toBe(false)
  })

  it('rejects token longer than 256 characters', () => {
    const result = verifyEmailSchema.safeParse({ token: 'a'.repeat(257) })
    expect(result.success).toBe(false)
  })
})

describe('requestPasswordResetSchema', () => {
  it('accepts valid email', () => {
    const result = requestPasswordResetSchema.safeParse({ email: 'user@example.com' })
    expect(result.success).toBe(true)
  })

  it('rejects invalid email', () => {
    const result = requestPasswordResetSchema.safeParse({ email: 'bad-email' })
    expect(result.success).toBe(false)
  })

  it('rejects missing email', () => {
    const result = requestPasswordResetSchema.safeParse({})
    expect(result.success).toBe(false)
  })
})

describe('resetPasswordSchema', () => {
  const validData = { token: 'reset-token', password: 'NewSecure1!' }

  it('accepts valid reset data', () => {
    const result = resetPasswordSchema.safeParse(validData)
    expect(result.success).toBe(true)
  })

  it('rejects missing token', () => {
    const result = resetPasswordSchema.safeParse({ password: 'NewSecure1!' })
    expect(result.success).toBe(false)
  })

  it('rejects empty token', () => {
    const result = resetPasswordSchema.safeParse({ ...validData, token: '' })
    expect(result.success).toBe(false)
  })

  it('rejects token longer than 256 characters', () => {
    const result = resetPasswordSchema.safeParse({ ...validData, token: 'a'.repeat(257) })
    expect(result.success).toBe(false)
  })

  it('rejects password shorter than 8 characters', () => {
    const result = resetPasswordSchema.safeParse({ ...validData, password: 'short' })
    expect(result.success).toBe(false)
  })

  it('rejects password longer than 128 characters', () => {
    const result = resetPasswordSchema.safeParse({ ...validData, password: 'a'.repeat(129) })
    expect(result.success).toBe(false)
  })
})

describe('resendVerificationSchema', () => {
  it('accepts valid locale', () => {
    const result = resendVerificationSchema.safeParse({ locale: 'ru' })
    expect(result.success).toBe(true)
  })

  it('defaults locale to en when omitted', () => {
    const result = resendVerificationSchema.safeParse({})
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.locale).toBe('en')
    }
  })

  it('accepts all valid locales', () => {
    for (const locale of ['en', 'ru', 'es', 'ja'] as const) {
      const result = resendVerificationSchema.safeParse({ locale })
      expect(result.success).toBe(true)
    }
  })

  it('rejects invalid locale', () => {
    const result = resendVerificationSchema.safeParse({ locale: 'fr' })
    expect(result.success).toBe(false)
  })
})

describe('sendPhoneCodeSchema', () => {
  it('accepts valid phone number with country code', () => {
    const result = sendPhoneCodeSchema.safeParse({ phone: '+79991234567' })
    expect(result.success).toBe(true)
  })

  it('accepts phone number without plus', () => {
    const result = sendPhoneCodeSchema.safeParse({ phone: '79991234567' })
    expect(result.success).toBe(true)
  })

  it('accepts phone with spaces and dashes', () => {
    const result = sendPhoneCodeSchema.safeParse({ phone: '+7 (999) 123-45-67' })
    expect(result.success).toBe(true)
  })

  it('rejects phone shorter than 7 characters', () => {
    const result = sendPhoneCodeSchema.safeParse({ phone: '12345' })
    expect(result.success).toBe(false)
  })

  it('rejects phone longer than 20 characters', () => {
    const result = sendPhoneCodeSchema.safeParse({ phone: '+1234567890123456789012' })
    expect(result.success).toBe(false)
  })

  it('rejects phone with letters', () => {
    const result = sendPhoneCodeSchema.safeParse({ phone: '+7abc1234567' })
    expect(result.success).toBe(false)
  })

  it('rejects missing phone', () => {
    const result = sendPhoneCodeSchema.safeParse({})
    expect(result.success).toBe(false)
  })
})

describe('verifyPhoneSchema', () => {
  const validData = { phone: '+79991234567', code: '123456' }

  it('accepts valid phone and 6-digit code', () => {
    const result = verifyPhoneSchema.safeParse(validData)
    expect(result.success).toBe(true)
  })

  it('rejects code with non-digit characters', () => {
    const result = verifyPhoneSchema.safeParse({ ...validData, code: '12345a' })
    expect(result.success).toBe(false)
  })

  it('rejects code shorter than 6 digits', () => {
    const result = verifyPhoneSchema.safeParse({ ...validData, code: '12345' })
    expect(result.success).toBe(false)
  })

  it('rejects code longer than 6 digits', () => {
    const result = verifyPhoneSchema.safeParse({ ...validData, code: '1234567' })
    expect(result.success).toBe(false)
  })

  it('rejects missing phone', () => {
    const result = verifyPhoneSchema.safeParse({ code: '123456' })
    expect(result.success).toBe(false)
  })

  it('rejects missing code', () => {
    const result = verifyPhoneSchema.safeParse({ phone: '+79991234567' })
    expect(result.success).toBe(false)
  })
})
