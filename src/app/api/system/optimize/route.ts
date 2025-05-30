/**
 * 🧠 시스템 메모리 최적화 API
 * POST /api/system/optimize
 * 
 * 메모리 사용률 최적화 및 성능 개선:
 * - 즉시 메모리 정리 실행
 * - 캐시 최적화
 * - 가비지 컬렉션
 * - 최적화 결과 반환
 */

import { NextRequest, NextResponse } from 'next/server';
import { createSuccessResponse, createErrorResponse, withErrorHandler } from '../../../../lib/api/errorHandler';
import { memoryOptimizer } from '../../../../utils/MemoryOptimizer';

/**
 * 🚨 즉시 메모리 최적화 실행 (POST)
 */
async function optimizeMemoryHandler(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    console.log('🧠 메모리 최적화 API 호출');

    // 요청 본문에서 최적화 레벨 확인
    const body = await request.json().catch(() => ({}));
    const { level = 'normal' } = body; // 'normal' | 'aggressive'

    // 현재 메모리 상태 확인
    const beforeStats = memoryOptimizer.getCurrentMemoryStats();
    console.log(`📊 최적화 전: ${beforeStats.usagePercent}% (${beforeStats.heapUsed}MB/${beforeStats.heapTotal}MB)`);

    // 최적화 레벨에 따른 실행
    let optimizationResult;
    if (level === 'aggressive' || beforeStats.usagePercent > 80) {
      console.log('🚀 극한 최적화 모드 실행');
      optimizationResult = await memoryOptimizer.performAggressiveOptimization();
    } else {
      console.log('🧠 일반 최적화 모드 실행');
      optimizationResult = await memoryOptimizer.optimizeMemoryNow();
    }

    // 최적화 후 메모리 상태
    const afterStats = memoryOptimizer.getCurrentMemoryStats();
    
    // API 응답 시간 계산
    const apiResponseTime = Date.now() - startTime;

    // 목표 달성 여부 확인
    const targetAchieved = afterStats.usagePercent <= 75;
    const optimalAchieved = afterStats.usagePercent <= 65;

    return createSuccessResponse({
      optimization: {
        success: true,
        level: level === 'aggressive' ? '극한 최적화' : '일반 최적화',
        duration: optimizationResult.duration,
        actions: optimizationResult.optimizationActions,
        targetAchieved,
        optimalAchieved,
        memory: {
          before: {
            usagePercent: optimizationResult.before.usagePercent,
            heapUsed: optimizationResult.before.heapUsed,
            heapTotal: optimizationResult.before.heapTotal,
            rss: optimizationResult.before.rss
          },
          after: {
            usagePercent: optimizationResult.after.usagePercent,
            heapUsed: optimizationResult.after.heapUsed,
            heapTotal: optimizationResult.after.heapTotal,
            rss: optimizationResult.after.rss
          },
          improvement: {
            freedMB: optimizationResult.freedMB,
            percentageReduction: Math.round(
              ((optimizationResult.before.usagePercent - optimizationResult.after.usagePercent) * 100) / 100
            ),
            status: afterStats.usagePercent < 65 ? 'optimal' :
                   afterStats.usagePercent < 75 ? 'good' : 
                   afterStats.usagePercent < 85 ? 'acceptable' : 'critical'
          }
        }
      },
      monitoring: {
        enabled: true,
        interval: '30초',
        threshold: {
          target: '65%',
          warning: '75%',
          critical: '90%'
        }
      },
      recommendations: generateMemoryRecommendations(afterStats),
      apiMetrics: {
        responseTime: apiResponseTime,
        timestamp: new Date().toISOString()
      }
    }, `메모리 최적화 완료 - ${afterStats.usagePercent}% (${targetAchieved ? '목표 달성' : '추가 최적화 필요'})`);

  } catch (error) {
    console.error('❌ 메모리 최적화 실패:', error);
    
    // 에러 시에도 현재 메모리 상태 포함
    const currentStats = memoryOptimizer.getCurrentMemoryStats();
    
    return createErrorResponse(
      `메모리 최적화 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
      'INTERNAL_SERVER_ERROR',
      {
        currentMemory: {
          usagePercent: currentStats.usagePercent,
          heapUsed: currentStats.heapUsed,
          status: currentStats.usagePercent >= 90 ? 'critical' : 'warning'
        },
        apiResponseTime: Date.now() - startTime
      }
    );
  }
}

/**
 * 📊 메모리 상태 조회 (GET)
 */
async function getMemoryStatusHandler(request: NextRequest) {
  try {
    console.log('📊 메모리 상태 조회 API 호출');

    // 메모리 상태 요약
    const memorySummary = memoryOptimizer.getMemorySummary();
    
    // 최적화 히스토리
    const optimizationHistory = memoryOptimizer.getOptimizationHistory();

    return createSuccessResponse({
      status: memorySummary.status,
      current: memorySummary.current,
      monitoring: {
        enabled: true,
        lastOptimization: memorySummary.lastOptimization,
        totalOptimizations: memorySummary.totalOptimizations
      },
      history: optimizationHistory.map(result => ({
        timestamp: new Date(result.before.timestamp).toISOString(),
        improvement: {
          before: `${result.before.usagePercent}%`,
          after: `${result.after.usagePercent}%`,
          freedMB: result.freedMB
        },
        duration: result.duration,
        actions: result.optimizationActions
      })),
      recommendations: generateMemoryRecommendations(memorySummary)
    }, '메모리 상태 조회 완료');

  } catch (error) {
    console.error('❌ 메모리 상태 조회 실패:', error);
    return createErrorResponse(
      `메모리 상태 조회 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
      500
    );
  }
}

/**
 * 💡 메모리 최적화 권장사항 생성
 */
function generateMemoryRecommendations(memorySummary: any): string[] {
  const recommendations: string[] = [];
  const { current, status } = memorySummary;

  if (status === 'critical') {
    recommendations.push('🚨 즉시 메모리 최적화 필요 - 시스템 불안정 위험');
    recommendations.push('🔄 불필요한 프로세스 종료 권장');
    recommendations.push('📊 데이터 압축 및 정리 필요');
  } else if (status === 'warning') {
    recommendations.push('⚠️ 예방적 메모리 정리 권장');
    recommendations.push('🗑️ 캐시 데이터 정리 고려');
    recommendations.push('⏰ 정기적인 최적화 스케줄 설정');
  } else {
    recommendations.push('✅ 메모리 상태 양호');
    recommendations.push('🔍 정기 모니터링 유지');
    recommendations.push('📈 성능 최적화 지속');
  }

  // RSS 메모리가 높은 경우
  if (current.rss > current.heapTotal * 1.5) {
    recommendations.push('🔧 RSS 메모리 최적화 필요 - 시스템 재시작 고려');
  }

  // 외부 메모리가 높은 경우
  if (current.external > 100) {
    recommendations.push('🌐 외부 라이브러리 메모리 사용량 점검 필요');
  }

  return recommendations;
}

// 에러 핸들러로 래핑
export const POST = withErrorHandler(optimizeMemoryHandler);
export const GET = withErrorHandler(getMemoryStatusHandler); 