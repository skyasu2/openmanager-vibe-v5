/**
 * 🚀 시스템 성능 테스트 API
 *
 * OpenManager AI v5.12.0 - 성능 테스트 및 최적화
 * - 부하 테스트 실행
 * - 성능 메트릭 수집
 * - 자동 최적화
 * - 성능 리포트 생성
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  createSuccessResponse,
  createErrorResponse,
  withErrorHandler,
} from '../../../../lib/api/errorHandler';
import { performanceTester } from '../../../../services/PerformanceTester';

/**
 * 📊 현재 성능 메트릭 조회 (GET)
 */
async function getPerformanceMetricsHandler(request: NextRequest) {
  try {
    console.log('📊 성능 메트릭 조회 API 호출');

    // 현재 성능 메트릭 수집
    const currentMetrics = await performanceTester.collectCurrentMetrics();

    // 테스트 실행 상태 확인
    const isTestRunning = performanceTester.isTestRunning();

    // 실시간 메트릭 (테스트 중인 경우)
    const realtimeMetrics = performanceTester.getCurrentMetrics();

    return createSuccessResponse(
      {
        current: currentMetrics,
        testing: {
          isRunning: isTestRunning,
          realtime: realtimeMetrics,
        },
        analysis: {
          memoryStatus:
            currentMetrics.memoryUsage.usagePercent > 80
              ? 'high'
              : currentMetrics.memoryUsage.usagePercent > 60
                ? 'medium'
                : 'low',
          redisStatus: currentMetrics.redisMetrics?.connected
            ? 'connected'
            : 'disconnected',
          performanceGrade: calculateQuickGrade(currentMetrics),
        },
        timestamp: new Date().toISOString(),
      },
      '성능 메트릭 조회 완료'
    );
  } catch (error) {
    console.error('❌ 성능 메트릭 조회 실패:', error);
    return createErrorResponse(
      `성능 메트릭 조회 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
      'INTERNAL_SERVER_ERROR'
    );
  }
}

/**
 * 🚀 부하 테스트 실행 (POST)
 */
async function runLoadTestHandler(request: NextRequest) {
  try {
    console.log('🚀 부하 테스트 실행 API 호출');

    // 요청 본문 파싱
    const body = await request.json();
    const {
      duration = 30,
      concurrency = 5,
      requestsPerSecond = 10,
      endpoints = ['/api/health', '/api/dashboard', '/api/servers/next'],
    } = body;

    // 테스트 설정 검증
    if (duration > 300) {
      return createErrorResponse(
        '테스트 지속 시간은 최대 300초입니다',
        'VALIDATION_ERROR'
      );
    }

    if (concurrency > 50) {
      return createErrorResponse(
        '동시 접속 수는 최대 50개입니다',
        'VALIDATION_ERROR'
      );
    }

    if (requestsPerSecond > 100) {
      return createErrorResponse(
        '초당 요청 수는 최대 100개입니다',
        'VALIDATION_ERROR'
      );
    }

    // 이미 테스트가 실행 중인지 확인
    if (performanceTester.isTestRunning()) {
      return createErrorResponse(
        '이미 부하 테스트가 실행 중입니다',
        'VALIDATION_ERROR'
      );
    }

    // 부하 테스트 설정
    const testConfig = {
      duration,
      concurrency,
      requestsPerSecond,
      endpoints: endpoints.map((endpoint: string) => {
        // 상대 경로를 절대 URL로 변환
        if (endpoint.startsWith('/')) {
          const baseUrl = request.nextUrl.origin;
          return `${baseUrl}${endpoint}`;
        }
        return endpoint;
      }),
    };

    console.log('🚀 부하 테스트 설정:', testConfig);

    // 부하 테스트 실행 (비동기)
    const testPromise = performanceTester.runLoadTest(testConfig);

    // 즉시 응답 (테스트는 백그라운드에서 실행)
    return createSuccessResponse(
      {
        message: '부하 테스트가 시작되었습니다',
        config: testConfig,
        estimatedDuration: `${duration}초`,
        status: 'running',
        checkUrl: '/api/system/performance',
        stopUrl: '/api/system/performance/stop',
      },
      '부하 테스트 시작됨'
    );
  } catch (error) {
    console.error('❌ 부하 테스트 실행 실패:', error);
    return createErrorResponse(
      `부하 테스트 실행 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
      'INTERNAL_SERVER_ERROR'
    );
  }
}

/**
 * 🔧 자동 성능 최적화 실행 (PUT)
 */
async function performOptimizationHandler(request: NextRequest) {
  try {
    console.log('🔧 자동 성능 최적화 API 호출');

    // 현재 성능 상태 확인
    const currentMetrics = await performanceTester.collectCurrentMetrics();

    // 최적화 실행
    const optimizationResult =
      await performanceTester.performAutoOptimization();

    // 최적화 후 성능 상태
    const afterMetrics = await performanceTester.collectCurrentMetrics();

    // 개선 효과 계산
    const improvement = {
      memoryReduction:
        currentMetrics.memoryUsage.usagePercent -
        afterMetrics.memoryUsage.usagePercent,
      redisReconnected: optimizationResult.redisReconnection,
      cacheCleared: optimizationResult.cacheOptimization,
    };

    return createSuccessResponse(
      {
        optimization: optimizationResult,
        performance: {
          before: currentMetrics,
          after: afterMetrics,
          improvement,
        },
        recommendations: generateOptimizationRecommendations(afterMetrics),
        timestamp: new Date().toISOString(),
      },
      '자동 성능 최적화 완료'
    );
  } catch (error) {
    console.error('❌ 자동 성능 최적화 실패:', error);
    return createErrorResponse(
      `자동 성능 최적화 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
      'INTERNAL_SERVER_ERROR'
    );
  }
}

/**
 * 🛑 부하 테스트 중지 (DELETE)
 */
async function stopLoadTestHandler(request: NextRequest) {
  try {
    console.log('🛑 부하 테스트 중지 API 호출');

    if (!performanceTester.isTestRunning()) {
      return createErrorResponse(
        '실행 중인 부하 테스트가 없습니다',
        'NOT_FOUND'
      );
    }

    // 테스트 중지
    performanceTester.stopTest();

    // 현재 메트릭 수집
    const currentMetrics = performanceTester.getCurrentMetrics();

    return createSuccessResponse(
      {
        message: '부하 테스트가 중지되었습니다',
        finalMetrics: currentMetrics,
        timestamp: new Date().toISOString(),
      },
      '부하 테스트 중지됨'
    );
  } catch (error) {
    console.error('❌ 부하 테스트 중지 실패:', error);
    return createErrorResponse(
      `부하 테스트 중지 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
      'INTERNAL_SERVER_ERROR'
    );
  }
}

/**
 * 🏆 빠른 성능 등급 계산
 */
function calculateQuickGrade(metrics: any): string {
  let score = 100;

  // 메모리 사용률 (40점)
  if (metrics.memoryUsage.usagePercent > 90) score -= 40;
  else if (metrics.memoryUsage.usagePercent > 80) score -= 20;
  else if (metrics.memoryUsage.usagePercent > 70) score -= 10;

  // Redis 연결 상태 (30점)
  if (!metrics.redisMetrics?.connected) score -= 30;
  else if (metrics.redisMetrics.responseTime > 100) score -= 15;

  // API 응답시간 (30점)
  if (metrics.apiResponseTimes.average > 1000) score -= 30;
  else if (metrics.apiResponseTimes.average > 500) score -= 15;
  else if (metrics.apiResponseTimes.average > 200) score -= 5;

  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
}

/**
 * 💡 최적화 권장사항 생성
 */
function generateOptimizationRecommendations(metrics: any): string[] {
  const recommendations: string[] = [];

  if (metrics.memoryUsage.usagePercent > 80) {
    recommendations.push('메모리 사용률이 높습니다. 추가 최적화를 고려하세요.');
  }

  if (!metrics.redisMetrics?.connected) {
    recommendations.push('Redis 연결을 확인하고 재연결을 시도하세요.');
  }

  if (metrics.apiResponseTimes.average > 500) {
    recommendations.push('API 응답시간이 느립니다. 코드 최적화가 필요합니다.');
  }

  if (recommendations.length === 0) {
    recommendations.push('시스템 성능이 양호합니다.');
  }

  return recommendations;
}

// 에러 핸들러로 래핑
export const GET = withErrorHandler(getPerformanceMetricsHandler);
export const POST = withErrorHandler(runLoadTestHandler);
export const PUT = withErrorHandler(performOptimizationHandler);
export const DELETE = withErrorHandler(stopLoadTestHandler);
