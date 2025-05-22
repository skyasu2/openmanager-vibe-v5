import { redis } from '@/lib/redis'
import { supabase } from '@/lib/supabase'
import { REDIS_PREFIXES } from '@/config/redis'
import { DB_TABLES } from '@/config/database'

// Redis 모니터링을 위한 상수
const REDIS_LIMITS = {
  DAILY_REQUESTS: 10000,
  WARNING_THRESHOLD: 8000,
  CLEANUP_BATCH_SIZE: 100
}

export interface RedisUsageStats {
  totalRequests: number;
  dailyRequests: number;
  percentUsed: number;
  lastUpdated: string;
  isWarning: boolean;
  isLimitReached: boolean;
}

export class RedisMonitor {
  // 일일 요청 카운터 키
  private static getDailyCounterKey(): string {
    const today = new Date().toISOString().split('T')[0]
    return `${REDIS_PREFIXES.STATS}daily_requests:${today}`
  }

  // 요청 카운터 증가
  static async incrementRequestCounter(): Promise<number> {
    const counterKey = this.getDailyCounterKey()
    
    try {
      // 카운터 증가
      const count = await redis.incr(counterKey)
      
      // 만료 시간 설정 (당일 자정까지)
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      tomorrow.setHours(0, 0, 0, 0)
      
      const secondsUntilTomorrow = Math.floor((tomorrow.getTime() - Date.now()) / 1000)
      await redis.expire(counterKey, secondsUntilTomorrow)
      
      // 경고 임계값 도달 시 로깅 및 알림
      if (count === REDIS_LIMITS.WARNING_THRESHOLD) {
        await this.logWarning('Redis 사용량이 경고 임계값에 도달했습니다', { count })
      }
      
      // 제한에 도달하면 자동 정리 프로세스 시작
      if (count >= REDIS_LIMITS.WARNING_THRESHOLD) {
        void this.startCleanup()
      }
      
      return count
    } catch (error) {
      console.error('Redis request counter error:', error)
      return 0
    }
  }

  // 현재 사용량 통계 조회
  static async getUsageStats(): Promise<RedisUsageStats> {
    try {
      const counterKey = this.getDailyCounterKey()
      const dailyRequests = Number(await redis.get(counterKey) || 0)
      
      // 총 요청 수는 Supabase에서 가져옴
      const { data } = await supabase
        .from(DB_TABLES.HEALTH_CHECKS)
        .select('total_redis_requests')
        .single()
      
      const totalRequests = data?.total_redis_requests || 0
      
      const stats: RedisUsageStats = {
        totalRequests,
        dailyRequests,
        percentUsed: Math.round((dailyRequests / REDIS_LIMITS.DAILY_REQUESTS) * 100),
        lastUpdated: new Date().toISOString(),
        isWarning: dailyRequests >= REDIS_LIMITS.WARNING_THRESHOLD,
        isLimitReached: dailyRequests >= REDIS_LIMITS.DAILY_REQUESTS
      }
      
      // 사용량 통계 저장
      await this.saveUsageStats(stats)
      
      return stats
    } catch (error) {
      console.error('Redis usage stats error:', error)
      
      // 오류 발생 시 기본값 반환
      return {
        totalRequests: 0,
        dailyRequests: 0,
        percentUsed: 0,
        lastUpdated: new Date().toISOString(),
        isWarning: false,
        isLimitReached: false
      }
    }
  }

  // 사용량 통계 저장
  private static async saveUsageStats(stats: RedisUsageStats): Promise<void> {
    try {
      const today = new Date().toISOString().split('T')[0]
      
      // Redis에 임시 저장
      await redis.setex(
        `${REDIS_PREFIXES.STATS}redis_usage:${today}`,
        86400, // 24시간
        JSON.stringify(stats)
      )
      
      // Supabase에 영구 저장
      await supabase
        .from('monitoring_stats')
        .upsert({
          date: today,
          type: 'redis_usage',
          data: stats,
          created_at: new Date().toISOString()
        })
    } catch (error) {
      console.error('Error saving Redis stats:', error)
    }
  }

  // 경고 로깅
  private static async logWarning(message: string, data: Record<string, unknown>): Promise<void> {
    try {
      await supabase
        .from('alerts')
        .insert({
          type: 'redis_warning',
          message,
          data,
          severity: 'warning',
          created_at: new Date().toISOString()
        })
      
      console.warn(`[Redis Warning] ${message}`, data)
    } catch (error) {
      console.error('Error logging Redis warning:', error)
    }
  }

  // 자동 정리 프로세스
  static async startCleanup(): Promise<void> {
    try {
      const stats = await this.getUsageStats()
      
      // 경고 임계값 이상일 때만 정리 시작
      if (stats.dailyRequests < REDIS_LIMITS.WARNING_THRESHOLD) {
        return
      }
      
      console.log('[Redis Monitor] 자동 정리 프로세스 시작...')
      
      // 오래된 캐시 키 찾기
      const keys = await redis.keys(`${REDIS_PREFIXES.CACHE}*`)
      
      // 생성일 기준으로 정렬
      const keyDetails = await Promise.all(
        keys.slice(0, REDIS_LIMITS.CLEANUP_BATCH_SIZE).map(async (key) => {
          const ttl = await redis.ttl(key as string)
          return { key: key as string, ttl }
        })
      )
      
      // TTL이 가장 짧은 것부터 정리
      const keysToClean = keyDetails
        .sort((a, b) => a.ttl - b.ttl)
        .slice(0, REDIS_LIMITS.CLEANUP_BATCH_SIZE)
        .map(k => k.key)
      
      if (keysToClean.length > 0) {
        // 배치로 삭제
        await redis.del(...keysToClean)
        
        console.log(`[Redis Monitor] ${keysToClean.length}개의 캐시 항목을 정리했습니다`)
        
        // 정리 작업 기록
        await supabase
          .from('system_logs')
          .insert({
            type: 'redis_cleanup',
            message: `${keysToClean.length}개의 캐시 항목을 자동으로 정리했습니다`,
            data: { cleaned_keys: keysToClean },
            created_at: new Date().toISOString()
          })
      }
    } catch (error) {
      console.error('Redis cleanup error:', error)
    }
  }
} 