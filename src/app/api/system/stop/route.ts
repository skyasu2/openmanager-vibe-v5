import { NextRequest } from 'next/server';
import { systemStateManager } from '../../../../core/system/SystemStateManager';
import { createSuccessResponse, createErrorResponse, withErrorHandler } from '../../../../lib/api/errorHandler';

/**
 * 🛑 시스템 중지 API v2
 * POST /api/system/stop
 * 통합 상태 관리자를 통한 시뮬레이션 엔진 중지
 */
async function stopSystemHandler(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    console.log('🛑 시스템 중지 API 호출 (v2)');

    // 통합 상태 관리자를 통한 시뮬레이션 중지
    const result = await systemStateManager.stopSimulation();
    
    if (!result.success) {
      return createErrorResponse(
        result.message,
        'VALIDATION_ERROR'
      );
    }

    // 현재 시스템 상태 조회
    const systemStatus = systemStateManager.getSystemStatus();
    
    // API 호출 추적
    const responseTime = Date.now() - startTime;
    systemStateManager.trackApiCall(responseTime, false);

    return createSuccessResponse({
      isRunning: systemStatus.simulation.isRunning,
      runtime: systemStatus.simulation.runtime,
      dataCollected: systemStatus.simulation.dataCount,
      serverCount: systemStatus.simulation.serverCount,
      performance: {
        totalApiCalls: systemStatus.performance.apiCalls,
        averageResponseTime: systemStatus.performance.averageResponseTime,
        errorRate: systemStatus.performance.errorRate,
        responseTime: responseTime
      },
      services: systemStatus.services,
      storageInfo: {
        lastUpdated: systemStatus.lastUpdated,
        health: systemStatus.health
      }
    }, result.message);

  } catch (error) {
    console.error('❌ 시스템 중지 오류:', error);
    
    // API 호출 추적 (에러)
    const responseTime = Date.now() - startTime;
    systemStateManager.trackApiCall(responseTime, true);
    
    throw error; // withErrorHandler가 처리
  }
}

// 에러 핸들러 래핑
export const POST = withErrorHandler(stopSystemHandler); 