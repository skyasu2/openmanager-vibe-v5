/**
 * 📈 AI 캐시 통계 API
 *
 * 의미론적 캐시 성능 및 히트율 실시간 조회
 * GET /api/ai/cache-stats
 */

import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/api-auth';
import debug from '@/utils/debug';

// 동적 import로 빌드 시점 초기화 방지
async function getQueryEngine() {
  const { getSimplifiedQueryEngine } = await import(
    '@/services/ai/SimplifiedQueryEngine'
  );
  return getSimplifiedQueryEngine();
}

export const runtime = 'nodejs';

async function getHandler() {
  try {
    const startTime = Date.now();

    // AI 엔진 인스턴스 가져오기
    const engine = await getQueryEngine();

    // 🔍 상세 캐시 통계 수집
    const cacheStats = engine.utils?.getCacheStats();

    if (!cacheStats) {
      return NextResponse.json(
        {
          success: false,
          error: 'Cache statistics not available',
          message:
            'AI 엔진이 초기화되지 않았거나 캐시 통계를 사용할 수 없습니다.',
        },
        { status: 503 }
      );
    }

    // 📊 성능 분석
    const performanceAnalysis = {
      status:
        cacheStats.hitRate >= 60
          ? 'excellent'
          : cacheStats.hitRate >= 40
            ? 'good'
            : cacheStats.hitRate >= 20
              ? 'fair'
              : 'poor',
      recommendation:
        cacheStats.hitRate >= 60
          ? '🎯 캐시 성능이 목표를 달성했습니다!'
          : `📈 목표 히트율 60%까지 ${Math.round(60 - cacheStats.hitRate)}% 개선이 필요합니다.`,
      efficiency: {
        semantic: cacheStats.hitRate > 30 ? 'working' : 'needs_improvement',
        memory:
          cacheStats.memoryUsage.utilizationRate < 80 ? 'optimal' : 'high',
        ttl: 'auto-managed',
      },
    };

    // 🔄 최적화 제안
    const optimizationTips = [];

    if (cacheStats.hitRate < 40) {
      optimizationTips.push('의미론적 정규화 로직을 더 강화하세요');
    }
    if (cacheStats.memoryUsage.utilizationRate > 80) {
      optimizationTips.push(
        '캐시 크기를 늘리거나 TTL을 줄이는 것을 고려하세요'
      );
    }
    if (cacheStats.totalRequests < 10) {
      optimizationTips.push(
        '더 많은 쿼리 데이터가 축적되면 정확한 분석이 가능합니다'
      );
    }
    if (optimizationTips.length === 0) {
      optimizationTips.push('현재 캐시 성능이 양호합니다');
    }

    const responseTime = Date.now() - startTime;

    return NextResponse.json(
      {
        success: true,
        data: {
          ...cacheStats,
          performanceAnalysis,
          optimizationTips,
          lastChecked: new Date().toISOString(),
        },
        meta: {
          responseTime,
          version: '1.0',
          features: [
            'semantic-caching',
            'hit-rate-tracking',
            'memory-monitoring',
          ],
        },
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store',
          'X-Response-Time': responseTime.toString(),
          'X-Cache-Version': 'semantic-v2',
          'X-Hit-Rate': cacheStats.hitRate.toString(),
        },
      }
    );
  } catch (error) {
    debug.error('❌ 캐시 통계 조회 실패:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to retrieve cache statistics',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'X-Error-Type': 'cache-stats-failure',
        },
      }
    );
  }
}

// 🔐 인증된 사용자만 접근 가능
export const GET = withAuth(getHandler);

// 🧹 캐시 클리어 (POST)
async function postHandler() {
  try {
    const engine = await getQueryEngine();

    if (engine.utils?.clearCache) {
      engine.utils.clearCache();

      return NextResponse.json({
        success: true,
        message: 'Cache cleared successfully',
        timestamp: new Date().toISOString(),
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Cache clear function not available',
      },
      { status: 503 }
    );
  } catch (error) {
    debug.error('❌ 캐시 클리어 실패:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to clear cache',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export const POST = withAuth(postHandler);
