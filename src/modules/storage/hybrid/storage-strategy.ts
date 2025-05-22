import { redis } from '@/lib/redis'
import { supabase } from '@/lib/supabase'
import { DB_TABLES } from '@/config/database'
import { REDIS_TTL } from '@/config/redis'

export class StorageStrategy {
  /**
   * 데이터를 검색하는 하이브리드 전략
   * 1. Redis 캐시 확인
   * 2. 없으면 Supabase 데이터베이스 확인
   * 3. 데이터베이스에서 찾으면 Redis에 캐싱
   */
  static async get<T = unknown>(key: string): Promise<T | null> {
    try {
      // 1. Redis 캐시 확인 (빠른 접근)
      const cached = await redis.get(key)
      if (cached) {
        console.log(`[StorageStrategy] Cache hit: ${key}`)
        return JSON.parse(cached as string) as T
      }
      
      // 2. Supabase 데이터베이스 확인
      const { data, error } = await supabase
        .from(DB_TABLES.CACHE)
        .select('value')
        .eq('key', key)
        .single()
      
      if (error) {
        console.log(`[StorageStrategy] Database error: ${error.message}`)
        return null
      }
      
      if (data) {
        // 3. Redis에 캐싱
        const value = data.value as T
        await redis.setex(key, REDIS_TTL.CACHE_MEDIUM, JSON.stringify(value))
        console.log(`[StorageStrategy] Cache miss, DB hit, cached: ${key}`)
        return value
      }
      
      console.log(`[StorageStrategy] Key not found: ${key}`)
      return null
    } catch (error) {
      console.error(`[StorageStrategy] Error getting key ${key}:`, error)
      return null
    }
  }
  
  /**
   * 데이터 저장 하이브리드 전략
   * 1. Redis에 캐싱 (빠른 접근용)
   * 2. Supabase에 영구 저장
   */
  static async set<T>(key: string, value: T, ttl = REDIS_TTL.CACHE_MEDIUM): Promise<boolean> {
    try {
      // 1. Redis에 캐싱
      await redis.setex(key, ttl, JSON.stringify(value))
      
      // 2. Supabase에 영구 저장
      const { error } = await supabase
        .from(DB_TABLES.CACHE)
        .upsert({
          key,
          value,
          expires_at: new Date(Date.now() + ttl * 1000).toISOString(),
          created_at: new Date().toISOString()
        })
      
      if (error) {
        console.error(`[StorageStrategy] DB upsert error: ${error.message}`)
        return false
      }
      
      console.log(`[StorageStrategy] Successfully stored: ${key}`)
      return true
    } catch (error) {
      console.error(`[StorageStrategy] Error setting key ${key}:`, error)
      return false
    }
  }
  
  /**
   * 데이터 삭제 하이브리드 전략
   * 1. Redis에서 삭제
   * 2. Supabase에서 삭제
   */
  static async delete(key: string): Promise<boolean> {
    try {
      // 병렬 처리로 양쪽 모두 삭제
      const [, dbResult] = await Promise.all([
        redis.del(key),
        supabase.from(DB_TABLES.CACHE).delete().eq('key', key)
      ])
      
      if (dbResult.error) {
        console.error(`[StorageStrategy] DB delete error: ${dbResult.error.message}`)
        return false
      }
      
      console.log(`[StorageStrategy] Successfully deleted: ${key}`)
      return true
    } catch (error) {
      console.error(`[StorageStrategy] Error deleting key ${key}:`, error)
      return false
    }
  }
} 