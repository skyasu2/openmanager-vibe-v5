import { Redis } from '@upstash/redis'

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

// 연결 상태 체크
export async function checkRedisConnection() {
  try {
    await redis.ping()
    return { status: 'connected', timestamp: new Date().toISOString() }
  } catch (error) {
    console.error('Redis connection error:', error)
    return { status: 'error', error: (error as Error).message }
  }
} 