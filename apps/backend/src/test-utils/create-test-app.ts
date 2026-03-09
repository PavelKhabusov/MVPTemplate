/**
 * Test utility: creates a Fastify instance with all external dependencies mocked.
 *
 * Usage (in a test file):
 *
 *   // 1. Place vi.mock() calls BEFORE any imports from app code
 *   // 2. Import createTestApp and call it in beforeAll
 *
 * This module is NOT meant to be imported directly — each test file configures
 * its own mocks first, then calls buildApp() from '../../app'.
 *
 * Instead, this file provides shared mock factories that test files can reuse.
 */
import { vi } from 'vitest'

// ─── Shared mock objects ──────────────────────────────────────────────────────

export const TEST_ENV = {
  DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
  REDIS_URL: 'redis://localhost:6379',
  JWT_ACCESS_SECRET: 'test-access-secret-key-minimum-32-chars!!',
  JWT_REFRESH_SECRET: 'test-refresh-secret-key-minimum-32-chars!',
  JWT_ACCESS_EXPIRY: '15m',
  JWT_REFRESH_EXPIRY: '30d',
  PORT: 3000,
  HOST: '0.0.0.0',
  NODE_ENV: 'test' as const,
  CORS_ORIGIN: 'http://localhost:8081',
  EMAIL_ENABLED: false,
  EMAIL_VERIFICATION_REQUIRED: false,
  SMS_ENABLED: false,
  SMS_VERIFICATION_REQUIRED: false,
  ANALYTICS_ENABLED: false,
  REQUEST_LOGGING: false,
  PAYMENTS_ENABLED: false,
  STRIPE_ENABLED: false,
  YOOKASSA_ENABLED: false,
  ROBOKASSA_ENABLED: false,
  ROBOKASSA_TEST_MODE: true,
  PAYPAL_ENABLED: false,
  PAYPAL_MODE: 'sandbox' as const,
  POLAR_ENABLED: false,
  DODO_ENABLED: false,
  PADDLE_ENABLED: false,
  PADDLE_SANDBOX: true,
  PROXY_ENABLED: false,
  AI_PROXY_ENABLED: false,
  STORAGE_TYPE: 'local' as const,
  S3_REGION: 'us-east-1',
  SMTP_PORT: 587,
  SMTP_FROM: 'noreply@example.com',
  APP_URL: 'http://localhost:8081',
  SMS_PROVIDER: 'twilio' as const,
  GEMINI_MODEL: 'gemini-2.5-flash',
  GEMINI_CONCURRENT_LIMIT: 3,
  OPENAI_MODEL: 'gpt-4o-mini',
  OPENAI_MAX_TOKENS: 4096,
}

/** Minimal mock for ioredis used by @fastify/rate-limit */
export function createRedisMock() {
  const store = new Map<string, string>()
  return {
    get: vi.fn(async (key: string) => store.get(key) ?? null),
    set: vi.fn(async (key: string, val: string) => { store.set(key, val); return 'OK' }),
    del: vi.fn(async (key: string) => { store.delete(key); return 1 }),
    incr: vi.fn(async (key: string) => {
      const cur = parseInt(store.get(key) ?? '0', 10) + 1
      store.set(key, String(cur))
      return cur
    }),
    pttl: vi.fn(async () => -1),
    eval: vi.fn(async () => [0, -1]),
    on: vi.fn().mockReturnThis(),
    status: 'ready',
    disconnect: vi.fn(),
    quit: vi.fn(),
    defineCommand: vi.fn(),
    rateLimit: vi.fn((_key: string, _tw: number, _max: number, _ce: boolean, _eb: boolean, cb: Function) => cb(null, [1, -1])),
  }
}

export const MOCK_USER = {
  id: 'user-test-001',
  email: 'test@example.com',
  passwordHash: '$2b$12$mocked_hash_value',
  name: 'Test User',
  avatarUrl: null as string | null,
  bio: null as string | null,
  phone: null as string | null,
  location: null as string | null,
  birthday: null as string | null,
  emailVerified: true,
  phoneVerified: false,
  voximplantLogin: null as string | null,
  voximplantPassword: null as string | null,
  voximplantAppId: null as string | null,
  role: 'user' as const,
  features: [] as string[],
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
}

export const MOCK_TOKENS = {
  accessToken: 'mock.jwt.access-token',
  refreshToken: 'abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef12345678',
}

/**
 * Generate a real JWT signed with TEST_ENV.JWT_ACCESS_SECRET.
 * Useful for testing authenticated routes via app.inject().
 */
export function signTestAccessToken(userId: string, email: string): string {
  // We import jwt lazily so that the mock for jsonwebtoken (if any) is
  // already registered by the time this runs.  For integration tests that
  // do NOT mock jsonwebtoken, this uses the real implementation.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const jwt = require('jsonwebtoken') as typeof import('jsonwebtoken')
  const sign = typeof jwt.sign === 'function' ? jwt.sign : (jwt as any).default.sign
  return sign(
    { sub: userId, email },
    TEST_ENV.JWT_ACCESS_SECRET,
    { expiresIn: '15m' },
  )
}
