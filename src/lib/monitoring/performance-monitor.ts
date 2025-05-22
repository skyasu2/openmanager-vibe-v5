import { redis } from '@/lib/redis'
import { supabase } from '@/lib/supabase'
import { REDIS_PREFIXES, REDIS_TTL } from '@/config/redis'
import { NextRequest, NextResponse } from 'next/server'

// Vercel 함수 성능 모니터링을 위한 상수
const PERFORMANCE_LIMITS = {
  MAX_EXECUTION_TIME_MS: 10000, // 10초 (Vercel 타임아웃)
  WARNING_THRESHOLD_MS: 8000, // 8초 (경고 임계값)
  MAX_MEMORY_MB: 1024, // 1GB (Vercel 제한)
  WARNING_MEMORY_MB: 768 // 768MB (경고 임계값)
}

export interface PerformanceMetrics {
  route: string;
  method: string;
  statusCode: number;
  executionTimeMs: number;
  memoryUsageMB: number;
  timestamp: string;
}

export interface PerformanceStats {
  avgResponseTime: number; // 평균 응답 시간 (ms)
  p95ResponseTime: number; // 95th 백분위 응답 시간 (ms)
  maxResponseTime: number; // 최대 응답 시간 (ms)
  avgMemoryUsage: number; // 평균 메모리 사용량 (MB)
  errorRate: number; // 에러 발생률 (%)
  totalRequests: number; // 총 요청 수
  routeStats: Record<string, {
    avgResponseTime: number;
    errorRate: number;
    requestCount: number;
  }>;
  lastUpdated: string;
}

export class PerformanceMonitor {
  // 성능 지표 추적을 위한 키
  private static getPerformanceKey(dateStr?: string): string {
    const date = dateStr || new Date().toISOString().split('T')[0]
    return `${REDIS_PREFIXES.STATS}performance:${date}`
  }

  // 단일 API 요청에 대한 성능 지표 기록
  static async trackRequest(req: NextRequest, res: NextResponse, startTime: number): Promise<void> {
    try {
      const endTime = performance.now()
      const executionTimeMs = endTime - startTime
      
      // 메모리 사용량 측정
      const memoryUsage = process.memoryUsage()
      const memoryUsageMB = Math.round(memoryUsage.heapUsed / 1024 / 1024)
      
      // 성능 지표 생성
      const metrics: PerformanceMetrics = {
        route: req.nextUrl.pathname,
        method: req.method,
        statusCode: res.status,
        executionTimeMs: Math.round(executionTimeMs),
        memoryUsageMB,
        timestamp: new Date().toISOString()
      }
      
      // Redis에 성능 지표 추가 (시간순 목록)
      const today = new Date().toISOString().split('T')[0]
      const metricsKey = `${REDIS_PREFIXES.STATS}metrics:${today}`
      
      await redis.lpush(metricsKey, JSON.stringify(metrics))
      await redis.ltrim(metricsKey, 0, 999) // 최대 1000개 항목 유지
      
      // 만료 시간 설정 (3일)
      await redis.expire(metricsKey, 3 * 86400)
      
      // 느린 요청 경고
      if (executionTimeMs >= PERFORMANCE_LIMITS.WARNING_THRESHOLD_MS) {
        await this.logSlowRequest(metrics)
      }
      
      // 높은 메모리 사용량 경고
      if (memoryUsageMB >= PERFORMANCE_LIMITS.WARNING_MEMORY_MB) {
        await this.logHighMemoryUsage(metrics)
      }
      
      // 에러 응답 로깅
      if (metrics.statusCode >= 400) {
        await this.logErrorResponse(metrics)
      }
      
    } catch (error) {
      console.error('Performance tracking error:', error)
    }
  }

  // 느린 요청 로깅
  private static async logSlowRequest(metrics: PerformanceMetrics): Promise<void> {
    try {
      await supabase
        .from('alerts')
        .insert({
          type: 'slow_request',
          message: `API 응답시간이 느립니다: ${metrics.route} (${metrics.executionTimeMs}ms)`,
          data: metrics,
          severity: metrics.executionTimeMs >= PERFORMANCE_LIMITS.MAX_EXECUTION_TIME_MS 
            ? 'critical' 
            : 'warning',
          created_at: new Date().toISOString()
        })
      
      console.warn(`[Performance Warning] 느린 API 응답: ${metrics.route}`, metrics)
    } catch (error) {
      console.error('Error logging slow request:', error)
    }
  }

  // 높은 메모리 사용량 로깅
  private static async logHighMemoryUsage(metrics: PerformanceMetrics): Promise<void> {
    try {
      await supabase
        .from('alerts')
        .insert({
          type: 'high_memory',
          message: `메모리 사용량이 높습니다: ${metrics.route} (${metrics.memoryUsageMB}MB)`,
          data: metrics,
          severity: metrics.memoryUsageMB >= PERFORMANCE_LIMITS.MAX_MEMORY_MB 
            ? 'critical' 
            : 'warning',
          created_at: new Date().toISOString()
        })
      
      console.warn(`[Performance Warning] 높은 메모리 사용량: ${metrics.route}`, metrics)
    } catch (error) {
      console.error('Error logging high memory usage:', error)
    }
  }

  // 에러 응답 로깅
  private static async logErrorResponse(metrics: PerformanceMetrics): Promise<void> {
    try {
      await supabase
        .from('alerts')
        .insert({
          type: 'api_error',
          message: `API 에러 발생: ${metrics.route} (${metrics.statusCode})`,
          data: metrics,
          severity: metrics.statusCode >= 500 ? 'critical' : 'warning',
          created_at: new Date().toISOString()
        })
      
      console.error(`[API Error] ${metrics.statusCode} 에러: ${metrics.route}`)
    } catch (error) {
      console.error('Error logging API error:', error)
    }
  }

  // 일일 성능 통계 계산
  static async calculatePerformanceStats(dateStr?: string): Promise<PerformanceStats> {
    try {
      const date = dateStr || new Date().toISOString().split('T')[0]
      const statsKey = this.getPerformanceKey(date)
      
      // 캐시된 통계 확인
      const cachedStats = await redis.get(statsKey)
      if (cachedStats) {
        return JSON.parse(cachedStats as string) as PerformanceStats
      }
      
      // 당일 측정된 모든 메트릭 조회
      const metricsKey = `${REDIS_PREFIXES.STATS}metrics:${date}`
      const metrics: PerformanceMetrics[] = []
      
      const metricsData = await redis.lrange(metricsKey, 0, -1)
      if (metricsData && metricsData.length > 0) {
        for (const item of metricsData) {
          metrics.push(JSON.parse(item as string))
        }
      }
      
      // 메트릭이 없으면 기본값 반환
      if (metrics.length === 0) {
        const emptyStats: PerformanceStats = {
          avgResponseTime: 0,
          p95ResponseTime: 0,
          maxResponseTime: 0,
          avgMemoryUsage: 0,
          errorRate: 0,
          totalRequests: 0,
          routeStats: {},
          lastUpdated: new Date().toISOString()
        }
        return emptyStats
      }
      
      // 응답 시간 통계 계산
      const responseTimes = metrics.map(m => m.executionTimeMs).sort((a, b) => a - b)
      const totalResponseTime = responseTimes.reduce((sum, time) => sum + time, 0)
      
      // 라우트별 통계 계산
      const routeMap: Record<string, {
        times: number[];
        errors: number;
        count: number;
        memoryUsage: number[];
      }> = {}
      
      for (const metric of metrics) {
        if (!routeMap[metric.route]) {
          routeMap[metric.route] = {
            times: [],
            errors: 0,
            count: 0,
            memoryUsage: []
          }
        }
        
        routeMap[metric.route].times.push(metric.executionTimeMs)
        routeMap[metric.route].memoryUsage.push(metric.memoryUsageMB)
        routeMap[metric.route].count++
        
        if (metric.statusCode >= 400) {
          routeMap[metric.route].errors++
        }
      }
      
      // 라우트별 통계 계산
      const routeStats: Record<string, {
        avgResponseTime: number;
        errorRate: number;
        requestCount: number;
      }> = {}
      
      for (const [route, data] of Object.entries(routeMap)) {
        const totalTime = data.times.reduce((sum, time) => sum + time, 0)
        routeStats[route] = {
          avgResponseTime: Math.round(totalTime / data.count),
          errorRate: Math.round((data.errors / data.count) * 100),
          requestCount: data.count
        }
      }
      
      // 전체 통계 계산
      const totalErrors = metrics.filter(m => m.statusCode >= 400).length
      const totalMemory = metrics.reduce((sum, m) => sum + m.memoryUsageMB, 0)
      
      // 95th 백분위 계산
      const p95Index = Math.floor(responseTimes.length * 0.95)
      
      const stats: PerformanceStats = {
        avgResponseTime: Math.round(totalResponseTime / metrics.length),
        p95ResponseTime: responseTimes[p95Index] || 0,
        maxResponseTime: responseTimes[responseTimes.length - 1] || 0,
        avgMemoryUsage: Math.round(totalMemory / metrics.length),
        errorRate: Math.round((totalErrors / metrics.length) * 100),
        totalRequests: metrics.length,
        routeStats,
        lastUpdated: new Date().toISOString()
      }
      
      // 통계 캐싱 (1시간)
      await redis.setex(statsKey, REDIS_TTL.CACHE_MEDIUM, JSON.stringify(stats))
      
      return stats
    } catch (error) {
      console.error('Performance stats calculation error:', error)
      
      // 오류 발생 시 기본값 반환
      return {
        avgResponseTime: 0,
        p95ResponseTime: 0,
        maxResponseTime: 0,
        avgMemoryUsage: 0,
        errorRate: 0,
        totalRequests: 0,
        routeStats: {},
        lastUpdated: new Date().toISOString()
      }
    }
  }
} 