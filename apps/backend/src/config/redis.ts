import Redis from 'ioredis'
import { env } from './env'

if (env.NODE_ENV === 'production' && !env.REDIS_URL.startsWith('rediss://')) {
  console.error('SECURITY: REDIS_URL must use rediss:// (TLS) in production')
  process.exit(1)
}

export const redis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: 3,
  retryStrategy(times) {
    if (times > 3) return null
    return Math.min(times * 200, 2000)
  },
})

redis.on('error', (err) => {
  console.error('Redis connection error:', err.message)
})
