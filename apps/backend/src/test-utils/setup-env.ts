// Minimal env vars required by config/env.ts Zod schema
// This runs before any test file to prevent process.exit(1)
process.env.JWT_ACCESS_SECRET ??= 'test-secret-key-for-unit-tests-32chars!'
process.env.JWT_REFRESH_SECRET ??= 'test-refresh-key-for-unit-tests-32chars!'
process.env.DATABASE_URL ??= 'postgresql://test:test@localhost:5432/test'
process.env.REDIS_URL ??= 'redis://localhost:6379'
