import 'dotenv/config'
import { z } from 'zod'

// z.coerce.boolean() treats "false" as true (any non-empty string is truthy)
const envBoolean = z
  .union([z.boolean(), z.string()])
  .default(false)
  .transform((v) => v === true || v === 'true' || v === '1')

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_ACCESS_EXPIRY: z.string().default('15m'),
  JWT_REFRESH_EXPIRY: z.string().default('30d'),
  PORT: z.coerce.number().default(3000),
  HOST: z.string().default('0.0.0.0'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  CORS_ORIGIN: z.string().default('http://localhost:8081'),
  EXPO_ACCESS_TOKEN: z.string().optional(),
  GOOGLE_CLIENT_ID: z.string().optional(),

  // Analytics
  ANALYTICS_ENABLED: envBoolean.default(true),

  // Logging
  REQUEST_LOGGING: envBoolean,

  // Email
  EMAIL_ENABLED: envBoolean,
  EMAIL_VERIFICATION_REQUIRED: envBoolean,
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().default('noreply@example.com'),
  APP_URL: z.string().default('http://localhost:8081'),

  // Payments
  PAYMENTS_ENABLED: envBoolean,
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  YOOKASSA_SHOP_ID: z.string().optional(),
  YOOKASSA_SECRET_KEY: z.string().optional(),
  YOOKASSA_WEBHOOK_SECRET: z.string().optional(),

  // Robokassa
  ROBOKASSA_MERCHANT_LOGIN: z.string().optional(),
  ROBOKASSA_PASSWORD1: z.string().optional(),
  ROBOKASSA_PASSWORD2: z.string().optional(),
  ROBOKASSA_TEST_MODE: envBoolean.default(true),

  // Storage
  STORAGE_TYPE: z.enum(['local', 's3']).default('local'),
  S3_ENDPOINT: z.string().optional(),
  S3_BUCKET: z.string().optional(),
  S3_ACCESS_KEY: z.string().optional(),
  S3_SECRET_KEY: z.string().optional(),
  S3_REGION: z.string().default('us-east-1'),
  S3_PUBLIC_URL: z.string().optional(),
})

function loadEnv() {
  const result = envSchema.safeParse(process.env)
  if (!result.success) {
    console.error('Invalid environment variables:')
    console.error(result.error.flatten().fieldErrors)
    process.exit(1)
  }
  return result.data
}

export const env = loadEnv()
export type Env = z.infer<typeof envSchema>
