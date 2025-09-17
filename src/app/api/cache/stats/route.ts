/**
 * 🚀 캐시 통계 API
 *
 * 메모리 기반 캐시 성능 모니터링
 * Zod 스키마와 타입 안전성이 적용된 버전
 *
 * GET /api/cache/stats
 */

import { createApiRoute } from '@/lib/api/zod-middleware';
import { getCacheStats } from '@/lib/cache-helper';
import {
  CacheStatsResponseSchema,
  type CachePerformance,
  type CacheStats,
  type CacheStatsResponse,
} from '@/schemas/api.schema';
import { getErrorMessage } from '@/types/type-utils';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import debug from '@/utils/debug';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// 메모리 기반 캐시 정보 조회
function getMemoryCacheInfo() {
  return {
    type: 'Memory Cache',
    implementation: 'JavaScript Map',
    features: ['LRU Eviction', 'TTL Support', 'Statistics'],
    performance: 'Optimized for serverless',
    maxSize: '1000 items',
    cleanup: 'Auto-cleanup every 5 minutes',
  };
}

// 메모리 사용량 추정
function estimateMemoryCacheUsage() {
  const stats = getCacheStats();
  const itemSizeEstimate = 0.5; // KB per item (rough estimate)
  const estimatedKB = Math.round(stats.size * itemSizeEstimate);
  const estimatedMB = estimatedKB / 1024;
  const maxMB = 50; // 최대 50MB 권장
  const usagePercent = (estimatedMB / maxMB) * 100;

  return {
    estimatedMB: Math.round(estimatedMB * 100) / 100,
    maxMB,
    usagePercent: Math.round(usagePercent * 100) / 100,
  };
}

// 캐시 통계 핸들러
const cacheStatsHandler = createApiRoute()
  .response(CacheStatsResponseSchema)
  .configure({
    showDetailedErrors: process.env.NODE_ENV === 'development',
    enableLogging: true,
  })
  .build(async (_request, _context): Promise<CacheStatsResponse> => {
    // 메모리 기반 캐시 통계
    const rawStats = getCacheStats();

    const stats: CacheStats = {
      hits: rawStats.hits || 0,
      misses: rawStats.misses || 0,
      errors: 0, // 메모리 캐시는 일반적으로 에러가 적음
      commands: rawStats.sets + rawStats.deletes || 0,
      memoryUsage: Math.round(rawStats.size * 0.5) || 0, // KB 단위 추정
      storeSize: rawStats.size || 0,
      hitRate: rawStats.hitRate || 0,
      commandsPerSecond: 0, // MemoryCacheService doesn't track start time
      memoryUsageMB:
        Math.round(((rawStats.size * 0.5) / 1024) * 100) / 100 || 0, // MB 단위
    };

    // 메모리 캐시 정보
    const memoryCacheInfo = getMemoryCacheInfo();

    // 메모리 사용량 추정
    const memoryUsage = estimateMemoryCacheUsage();

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
      memory: memoryUsage,
    };

    // 검증 (개발 환경에서 유용)
    if (process.env.NODE_ENV === 'development') {
      const validation = CacheStatsResponseSchema.safeParse(response);
      if (!validation.success) {
        debug.error(
          'Cache stats response validation failed:',
          validation.error
        );
      }
    }

    return response;
  });

export async function GET(request: NextRequest) {
  try {
    return await cacheStatsHandler(request);
  } catch (error) {
    debug.error('❌ Memory cache stats failed:', error);

    // 에러 응답도 타입 안전하게
    const errorResponse = {
      success: false,
      timestamp: new Date().toISOString(),
      error: '메모리 캐시 통계 조회 실패',
      message: getErrorMessage(error),
    };

    return NextResponse.json(errorResponse, {
      status: 500,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Content-Type': 'application/json',
        'X-Cache-Type': 'Memory-based',
      },
    });
  }
}

/**
 * 메모리 캐시 성능 분석
 */
function analyzePerformance(stats: CacheStats): CachePerformance {
  const totalOps = stats.hits + stats.misses;
  const errorRate = 0; // 메모리 캐시는 네트워크 에러가 없음

  // 성능 등급 계산 (메모리 캐시에 최적화된 기준)
  let grade: 'A' | 'B' | 'C' | 'D' | 'F' = 'A';
  const issues: string[] = [];

  if (stats.hitRate < 40) {
    grade = 'F';
    issues.push('매우 낮은 캐시 히트율 - TTL 설정 검토 필요');
  } else if (stats.hitRate < 50) {
    grade = 'D';
    issues.push('낮은 캐시 히트율 - 캐시 전략 개선 필요');
  } else if (stats.hitRate < 65) {
    grade = 'C';
    issues.push('보통 수준의 캐시 효율성');
  } else if (stats.hitRate < 80) {
    grade = 'B';
    issues.push('양호한 캐시 효율성');
  } else {
    issues.push('우수한 캐시 효율성');
  }

  // 메모리 사용량 체크 (메모리 캐시는 제한적)
  if (stats.storeSize > 800) {
    grade = grade < 'C' ? grade : 'C';
    issues.push('캐시 크기가 제한에 근접 (LRU 정리 빈발)');
  } else if (stats.storeSize > 600) {
    grade = grade < 'B' ? grade : 'B';
    issues.push('캐시 크기 주의 필요');
  }

  return {
    grade,
    hitRate: stats.hitRate,
    errorRate: '0.00', // 메모리 캐시는 에러율이 거의 0
    issues,
    totalOperations: totalOps,
    recommendations: getMemoryCacheRecommendations(stats, issues),
  };
}

/**
 * 메모리 캐시 개선 권장사항 생성
 */
function getMemoryCacheRecommendations(
  stats: CacheStats,
  issues: string[]
): string[] {
  const recommendations: string[] = [];

  if (stats.hitRate < 50) {
    recommendations.push(
      'TTL 값을 늘려 캐시 보존 시간을 연장하세요',
      '자주 사용되는 데이터를 미리 캐싱하세요',
      '캐시 키 생성 로직을 최적화하세요'
    );
  } else if (stats.hitRate < 70) {
    recommendations.push(
      '캐시 무효화 로직을 재검토하세요',
      '유사한 요청을 그룹화하여 효율성을 높이세요'
    );
  }

  if (stats.storeSize > 700) {
    recommendations.push(
      '캐시 크기 제한이 가까워졌습니다 - 불필요한 데이터 정리를 고려하세요',
      'TTL을 짧게 설정하여 자동 정리를 활용하세요',
      '큰 객체는 압축하거나 분할하여 저장하세요'
    );
  }

  // 메모리 캐시 특화 권장사항
  if (stats.commandsPerSecond > 100) {
    recommendations.push(
      '높은 요청 빈도 - 배치 처리를 고려하세요',
      '데이터 접근 패턴을 분석하여 최적화하세요'
    );
  }

  if (recommendations.length === 0 && stats.hitRate >= 70) {
    recommendations.push(
      '메모리 캐시 성능이 우수합니다!',
      '네트워크 지연 시간이 0에 가까운 초고속 성능',
      '서버리스 환경에 최적화된 상태입니다'
    );
  }

  // 항상 메모리 캐시의 장점 강조
  recommendations.push(
    '✅ 무료 티어에 최적화된 메모리 기반 캐싱',
    '✅ 네트워크 지연 없는 초고속 캐시 액세스',
    '✅ 서버리스 환경에 완벽 최적화'
  );

  return recommendations;
}
