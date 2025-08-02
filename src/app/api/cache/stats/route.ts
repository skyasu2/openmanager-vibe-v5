/**
 * 🚀 캐시 통계 API
 *
 * Upstash Redis 캐시 성능 모니터링
 * Zod 스키마와 타입 안전성이 적용된 버전
 * 
 * GET /api/cache/stats
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getCacheStats, getCacheService } from '@/lib/cache-helper';
import { estimateMemoryUsage, getUpstashRedisInfo } from '@/lib/upstash-redis';
import { createApiRoute } from '@/lib/api/zod-middleware';
import {
  CacheStatsResponseSchema,
  type CacheStatsResponse,
  type CacheStats,
  type CachePerformance,
} from '@/schemas/api.schema';
import { getErrorMessage } from '@/types/type-utils';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

// 캐시 통계 핸들러
const cacheStatsHandler = createApiRoute()
  .response(CacheStatsResponseSchema)
  .configure({
    showDetailedErrors: process.env.NODE_ENV === 'development',
    enableLogging: true,
  })
  .build(async (_request, _context): Promise<CacheStatsResponse> => {
    // 캐시 통계
    const rawStats = getCacheStats();
    const { recommendations, ...baseStats } = rawStats;
    const stats: CacheStats = {
      hits: baseStats.hits || 0,
      misses: baseStats.misses || 0,
      errors: baseStats.errors || 0,
      commands: baseStats.sets + baseStats.deletes || 0, // sets + deletes로 총 명령 수 계산
      memoryUsage: baseStats.memoryUsageMB || 0, // memoryUsage는 memoryUsageMB와 동일하게 설정
      storeSize: baseStats.hits + baseStats.misses || 0, // 스토어 크기는 총 요청 수로 추정
      hitRate: baseStats.hitRate || 0,
      commandsPerSecond: (baseStats.sets + baseStats.deletes) / Math.max(1, (Date.now() - baseStats.lastReset) / 1000) || 0, // 초당 명령 수 계산
      memoryUsageMB: baseStats.memoryUsageMB || 0,
    };

    // Redis 연결 정보
    const redisInfo = await getUpstashRedisInfo();

    // 메모리 사용량 추정
    const memoryUsage = await estimateMemoryUsage();

    // 성능 분석
    const performance = analyzePerformance(stats);

    // 응답 생성
    const response: CacheStatsResponse = {
      success: true,
      timestamp: new Date().toISOString(),
      stats: {
        ...stats,
        performance,
      },
      redis: redisInfo,
      memory: memoryUsage,
    };

    // 검증 (개발 환경에서 유용)
    if (process.env.NODE_ENV === 'development') {
      const validation = CacheStatsResponseSchema.safeParse(response);
      if (!validation.success) {
        console.error('Cache stats response validation failed:', validation.error);
      }
    }

    return response;
  });

export async function GET(request: NextRequest) {
  try {
    return await cacheStatsHandler(request);
  } catch (error) {
    console.error('❌ Cache stats failed:', error);

    // 에러 응답도 타입 안전하게
    const errorResponse = {
      success: false,
      timestamp: new Date().toISOString(),
      error: '캐시 통계 조회 실패',
      message: getErrorMessage(error),
    };

    return NextResponse.json(errorResponse, {
      status: 500,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Content-Type': 'application/json',
      },
    });
  }
}

/**
 * 캐시 성능 분석
 */
function analyzePerformance(stats: CacheStats): CachePerformance {
  const totalOps = stats.hits + stats.misses;
  const errorRate = totalOps > 0 ? (stats.errors / totalOps) * 100 : 0;

  // 성능 등급 계산
  let grade: 'A' | 'B' | 'C' | 'D' | 'F' = 'A';
  const issues: string[] = [];

  if (stats.hitRate < 50) {
    grade = 'F';
    issues.push('매우 낮은 캐시 히트율');
  } else if (stats.hitRate < 60) {
    grade = 'D';
    issues.push('낮은 캐시 히트율');
  } else if (stats.hitRate < 70) {
    grade = 'C';
    issues.push('개선 필요한 캐시 히트율');
  } else if (stats.hitRate < 80) {
    grade = 'B';
  }

  if (errorRate > 10) {
    grade = grade < 'D' ? grade : 'D';
    issues.push('높은 에러율');
  } else if (errorRate > 5) {
    grade = grade < 'C' ? grade : 'C';
    issues.push('주의 필요한 에러율');
  }

  if (stats.memoryUsageMB > 200) {
    grade = grade < 'C' ? grade : 'C';
    issues.push('높은 메모리 사용량');
  }

  return {
    grade,
    hitRate: stats.hitRate,
    errorRate: errorRate.toFixed(2),
    issues,
    totalOperations: totalOps,
    recommendations: getRecommendations(stats, issues),
  };
}

/**
 * 개선 권장사항 생성
 */
function getRecommendations(stats: CacheStats, issues: string[]): string[] {
  const recommendations: string[] = [];

  if (stats.hitRate < 70) {
    recommendations.push(
      'TTL 값을 늘려 캐시 유지 시간을 연장하세요',
      '자주 요청되는 데이터를 사전 캐싱(warm-up)하세요',
      '캐시 키 전략을 검토하여 중복 요청을 줄이세요'
    );
  }

  if (stats.hitRate < 80 && stats.hitRate >= 70) {
    recommendations.push(
      '캐시 무효화 전략을 최적화하세요',
      '배치 작업으로 네트워크 왕복을 줄이세요'
    );
  }

  if (stats.errors > 10) {
    recommendations.push(
      'Redis 연결 상태를 확인하세요',
      '타임아웃 설정을 조정하세요',
      '재시도 로직을 강화하세요'
    );
  }

  if (stats.memoryUsageMB > 200) {
    recommendations.push(
      '사용하지 않는 캐시 데이터를 정리하세요',
      'TTL을 줄여 자동 만료를 활용하세요',
      '큰 데이터는 압축을 고려하세요'
    );
  }

  if (recommendations.length === 0 && stats.hitRate >= 80) {
    recommendations.push('현재 캐시 성능이 우수합니다!');
  }

  return recommendations;
}
