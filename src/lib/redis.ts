import { Redis } from '@upstash/redis'
import { env } from './env'

// 개발 환경에서는 더미 Redis 사용
const isDevelopment = env.NODE_ENV === 'development'
const isDummyRedis = env.UPSTASH_REDIS_REST_URL.includes('dummy')

export const redis = isDummyRedis ? null : new Redis({
  url: env.UPSTASH_REDIS_REST_URL,
  token: env.UPSTASH_REDIS_REST_TOKEN,
})

export async function checkRedisConnection() {
  try {
    if (isDummyRedis || isDevelopment) {
      // 개발 환경에서는 항상 연결된 것으로 시뮬레이션
      return { 
        status: 'connected' as 'connected' | 'error', 
        message: 'Redis connected successfully (development mode)' 
      }
    }

    if (!redis) {
      return {
        status: 'error' as const,
        message: 'Redis client not initialized'
      }
    }

    await redis.ping()
    return { status: 'connected' as 'connected' | 'error', message: 'Redis connected successfully' }
  } catch (error) {
    return {
      status: 'error' as const,
      message: error instanceof Error ? error.message : 'Redis connection failed'
    }
  }
}

// 개발 환경에서는 메모리 캐시 사용
const devCache = new Map<string, { value: string; expiry: number }>()

export class CacheService {
  static async set(key: string, value: unknown, ttl: number = 300) {
    try {
      if (isDummyRedis || isDevelopment) {
        // 개발 환경에서는 메모리 캐시 사용
        const expiry = Date.now() + (ttl * 1000)
        devCache.set(key, { value: JSON.stringify(value), expiry })
        return true
      }

      if (!redis) return false
      await redis.setex(key, ttl, JSON.stringify(value))
      return true
    } catch {
      return false
    }
  }

  static async get<T>(key: string): Promise<T | null> {
    try {
      if (isDummyRedis || isDevelopment) {
        // 개발 환경에서는 메모리 캐시 사용
        const cached = devCache.get(key)
        if (!cached) return null
        
        if (Date.now() > cached.expiry) {
          devCache.delete(key)
          return null
        }
        
        return JSON.parse(cached.value) as T
      }

      if (!redis) return null
      const data = await redis.get(key)
      return data ? JSON.parse(data as string) as T : null
    } catch {
      return null
    }
  }

  static async del(key: string) {
    try {
      if (isDummyRedis || isDevelopment) {
        // 개발 환경에서는 메모리 캐시 사용
        devCache.delete(key)
        return true
      }

      if (!redis) return false
      await redis.del(key)
      return true
    } catch {
      return false
    }
  }
} 