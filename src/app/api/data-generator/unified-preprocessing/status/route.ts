/**
 * 🔍 통합 전처리 엔진 상태 API v1.0
 *
 * 목적: UnifiedDataProcessor의 상태, 성능 통계, 캐시 정보 제공
 *
 * 엔드포인트: /api/data-generator/unified-preprocessing/status
 *
 * 기능:
 * - 전처리 엔진 상태 확인
 * - 성능 통계 조회
 * - 캐시 상태 모니터링
 * - 시스템 건강도 체크
 */

import { UnifiedDataProcessor } from '@/services/data-generator/UnifiedDataProcessor';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    // 쿼리 파라미터 파싱
    const { searchParams } = new URL(request.url);
    const detailed = searchParams.get('detailed') === 'true';
    const includeCache = searchParams.get('includeCache') === 'true';
    const includeStats = searchParams.get('includeStats') === 'true';

    // 통합 전처리 엔진 인스턴스 가져오기
    const processor = UnifiedDataProcessor.getInstance();

    // 기본 상태 정보 수집
    const status = processor.getStatus();
    const processingStats = processor.getProcessingStats();

    // 응답 데이터 구성
    const responseData: any = {
      success: true,
      timestamp: new Date().toISOString(),
      status: 'healthy',
      engine: {
        isReady: status.isReady,
        version: '1.0',
        uptime: process.uptime() * 1000, // milliseconds
      },
      performance: {
        totalProcessed: processingStats.totalProcessed,
        totalCacheHits: processingStats.totalCacheHits,
        averageProcessingTime: Math.round(
          processingStats.averageProcessingTime
        ),
        cacheHitRate:
          processingStats.totalProcessed > 0
            ? (
                (processingStats.totalCacheHits /
                  processingStats.totalProcessed) *
                100
              ).toFixed(1) + '%'
            : '0%',
      },
    };

    // 상세 정보 포함 (베르셀 최적화 - 최소한의 정보만)
    if (detailed) {
      responseData.detailed = {
        nodeVersion: process.version,
        platform: process.platform,
        // 베르셀에서 과도한 시스템 정보 수집 제거
        // memoryUsage: process.memoryUsage(),
        // cpuUsage: process.cpuUsage(),
        // architecture: process.arch
      };
    }

    // 캐시 정보 포함 (베르셀 최적화)
    if (includeCache) {
      responseData.cache = {
        performance: {
          size: status.cacheStats.size,
          maxSize: status.cacheStats.maxSize || 50,
          usage: status.cacheStats.maxSize
            ? Math.round(
                (status.cacheStats.size / status.cacheStats.maxSize) * 100
              ) + '%'
            : '0%',
          hitRate: responseData.performance.cacheHitRate,
          efficiency: status.cacheStats.size > 0 ? 'good' : 'empty',
        },
        // 베르셀 응답 크기 최적화를 위해 keys 정보 제거
        // keys: status.cacheStats.keys.length,
      };
    }

    // 통계 정보 포함
    if (includeStats) {
      responseData.statistics = {
        processing: {
          ...processingStats,
          efficiency:
            processingStats.averageProcessingTime < 100
              ? 'excellent'
              : processingStats.averageProcessingTime < 200
                ? 'good'
                : 'needs_improvement',
        },
        health: {
          score: calculateHealthScore(processingStats, status),
          issues: getHealthIssues(processingStats, status),
          recommendations: getRecommendations(processingStats, status),
        },
      };
    }

    // 응답 시간 추가
    const responseTime = Date.now() - startTime;
    responseData.metadata = {
      responseTime,
      apiVersion: '1.0',
      endpoint: '/api/data-generator/unified-preprocessing/status',
    };

    console.log(`✅ 통합 전처리 상태 API 응답: ${responseTime}ms`);

    return NextResponse.json(responseData, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'X-Response-Time': responseTime.toString(),
        'X-Engine-Status': status.isReady ? 'ready' : 'not-ready',
        'X-Cache-Size': status.cacheStats.size.toString(),
      },
    });
  } catch (error) {
    console.error('❌ 통합 전처리 상태 API 오류:', error);

    const responseTime = Date.now() - startTime;

    return NextResponse.json(
      {
        success: false,
        status: 'error',
        error: {
          message: error instanceof Error ? error.message : '상태 확인 실패',
          type: 'STATUS_CHECK_ERROR',
          timestamp: new Date().toISOString(),
        },
        metadata: {
          responseTime,
          apiVersion: '1.0',
          endpoint: '/api/data-generator/unified-preprocessing/status',
        },
      },
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'X-Response-Time': responseTime.toString(),
          'X-Error': 'true',
        },
      }
    );
  }
}

/**
 * 🎯 시스템 건강도 점수 계산 (베르셀 최적화)
 */
function calculateHealthScore(stats: any, status: any): number {
  let score = 100;

  // 베르셀 환경에 맞는 간소화된 건강도 체크
  // 평균 처리 시간 기준 (베르셀 서버리스 환경 고려)
  if (stats.averageProcessingTime > 500)
    score -= 20; // 베르셀에서는 더 관대하게
  else if (stats.averageProcessingTime > 200) score -= 10;

  // 엔진 준비 상태 확인
  if (!status.isReady) score -= 30;

  // 과도한 캐시 체크 제거 (베르셀 메모리 제약 고려)
  // 기본적인 동작만 확인
  if (stats.totalProcessed > 10 && stats.totalCacheHits === 0) score -= 5;

  return Math.max(0, Math.min(100, score));
}

/**
 * ⚠️ 건강도 이슈 식별 (베르셀 최적화)
 */
function getHealthIssues(stats: any, status: any): string[] {
  const issues: string[] = [];

  if (!status.isReady) {
    issues.push('데이터 생성기가 준비되지 않았습니다');
  }

  // 베르셀 서버리스 환경에 맞는 성능 기준
  if (stats.averageProcessingTime > 500) {
    issues.push('평균 처리 시간이 너무 깁니다 (>500ms)');
  }

  // 베르셀 메모리 제한 고려한 캐시 관리
  const maxCacheSize = status.cacheStats.maxSize || 50;
  if (status.cacheStats.size >= maxCacheSize) {
    issues.push('캐시가 최대 크기에 도달했습니다');
  }

  // 과도한 체크 제거하여 베르셀 환경 최적화
  return issues;
}

/**
 * 💡 개선 권장사항 생성 (베르셀 최적화)
 */
function getRecommendations(stats: any, status: any): string[] {
  const recommendations: string[] = [];

  if (!status.isReady) {
    recommendations.push('시스템 재시작을 권장합니다');
  }

  // 베르셀 환경에 맞는 간소화된 권장사항
  if (stats.averageProcessingTime > 500) {
    recommendations.push('데이터 처리 로직 최적화를 권장합니다');
  }

  const maxCacheSize = status.cacheStats.maxSize || 50;
  if (status.cacheStats.size >= maxCacheSize * 0.8) {
    recommendations.push('캐시 사용량이 높습니다. TTL 조정을 고려하세요');
  }

  if (recommendations.length === 0) {
    recommendations.push('시스템이 베르셀 환경에서 정상 작동 중입니다');
  }

  return recommendations;
}

// POST 메서드 - 엔진 재시작/리셋
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const body = await request.json();
    const { action } = body;

    const processor = UnifiedDataProcessor.getInstance();

    switch (action) {
      case 'clearCache':
        processor.clearCache();
        console.log('🧹 캐시 클리어 완료');
        break;

      case 'reset':
        processor.clearCache();
        // 베르셀 환경에서 인스턴스 완전 리셋
        UnifiedDataProcessor.resetInstance();
        console.log('🔄 엔진 완전 리셋 완료');
        break;

      default:
        return NextResponse.json(
          {
            success: false,
            error: {
              message: 'Invalid action. Supported actions: clearCache, reset',
              type: 'VALIDATION_ERROR',
            },
          },
          { status: 400 }
        );
    }

    const responseTime = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      action,
      message: `${action} 작업이 완료되었습니다`,
      timestamp: new Date().toISOString(),
      metadata: {
        responseTime,
        apiVersion: '1.0',
        endpoint: '/api/data-generator/unified-preprocessing/status',
      },
    });
  } catch (error) {
    console.error('❌ 상태 API POST 오류:', error);

    const responseTime = Date.now() - startTime;

    return NextResponse.json(
      {
        success: false,
        error: {
          message: error instanceof Error ? error.message : '작업 실행 실패',
          type: 'ACTION_ERROR',
          timestamp: new Date().toISOString(),
        },
        metadata: {
          responseTime,
          apiVersion: '1.0',
        },
      },
      { status: 500 }
    );
  }
}
