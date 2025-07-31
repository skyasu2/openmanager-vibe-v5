/**
 * 🚀 캐시 통계 API
 *
 * Upstash Redis 캐시 성능 모니터링
 * GET /api/cache/stats
 */

import { NextResponse } from 'next/server';
import { getCacheStats, getCacheService } from '@/lib/cache-helper';
import { estimateMemoryUsage, getUpstashRedisInfo } from '@/lib/upstash-redis';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // 캐시 통계
    const stats = getCacheStats();

    // Redis 연결 정보
    const redisInfo = await getUpstashRedisInfo();

    // 메모리 사용량 추정
    const memoryUsage = await estimateMemoryUsage();

    // 성능 분석
    const performance = analyzePerformance(stats);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      stats: {
        ...stats,
        performance,
      },
      redis: redisInfo,
      memory: memoryUsage,
    });
  } catch (error) {
    console.error('❌ 캐시 통계 조회 실패:', error);
    return NextResponse.json(
      {
        success: false,
        error: '캐시 통계 조회 실패',
      },
      { status: 500 }
    );
  }
}

/**
 * 캐시 성능 분석
 */
function analyzePerformance(stats: any) {
  const totalOps = stats.hits + stats.misses;
  const errorRate = totalOps > 0 ? (stats.errors / totalOps) * 100 : 0;

  // 성능 등급 계산
  let grade = 'A';
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
function getRecommendations(stats: any, issues: string[]): string[] {
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
