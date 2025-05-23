import { Redis } from '@upstash/redis'
import { env } from './env'

export const redis = new Redis({
  url: env.UPSTASH_REDIS_REST_URL,
  token: env.UPSTASH_REDIS_REST_TOKEN,
})

export async function checkRedisConnection() {
  try {
    await redis.ping()
    return { status: 'connected' as 'connected' | 'error', message: 'Redis connected successfully' }
  } catch (error) {
    return {
      status: 'error' as const,
      message: error instanceof Error ? error.message : 'Redis connection failed'
    }
  }
}

export class CacheService {
  static async set(key: string, value: unknown, ttl: number = 300) {
    try {
      await redis.setex(key, ttl, JSON.stringify(value))
      return true
    } catch {
      return false
    }
  }

  static async get<T>(key: string): Promise<T | null> {
    try {
      const data = await redis.get(key)
      return data ? JSON.parse(data as string) as T : null
    } catch {
      return null
    }
  }

  static async del(key: string) {
    try {
      await redis.del(key)
      return true
    } catch {
      return false
    }
  }
} 