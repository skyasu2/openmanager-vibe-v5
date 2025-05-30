import { NextRequest, NextResponse } from 'next/server';
import { systemStateManager } from '../../../../core/system/SystemStateManager';
import { createSuccessResponse, createErrorResponse, withErrorHandler } from '../../../../lib/api/errorHandler';

/**
 * 🚀 시스템 시작 API v2
 * POST /api/system/start
 * 통합 상태 관리자를 통한 시뮬레이션 엔진 시작
 */
async function startSystemHandler(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    console.log('🚀 시스템 시작 API 호출 (v2)');

    const body = await request.json().catch(() => ({}));
    const mode = body.mode || 'full'; // 'fast' | 'full'

    // 통합 상태 관리자를 통한 시뮬레이션 시작
    const result = await systemStateManager.startSimulation(mode);
    
    if (!result.success) {
      return createErrorResponse(
        result.message,
        'BAD_REQUEST'
      );
    }

    // 현재 시스템 상태 조회
    const systemStatus = systemStateManager.getSystemStatus();
    
    // API 호출 추적
    const responseTime = Date.now() - startTime;
    systemStateManager.trackApiCall(responseTime, false);

    return createSuccessResponse({
      isRunning: systemStatus.simulation.isRunning,
      startTime: systemStatus.simulation.startTime,
      runtime: systemStatus.simulation.runtime,
      dataCount: systemStatus.simulation.dataCount,
      serverCount: systemStatus.simulation.serverCount,
      mode: mode,
      environment: {
        plan: systemStatus.environment.plan,
        region: systemStatus.environment.region
      },
      performance: {
        updateInterval: systemStatus.simulation.updateInterval,
        responseTime: responseTime
      },
      services: systemStatus.services,
      fallback: false
    }, result.message);

  } catch (error) {
    console.error('❌ 시스템 시작 오류:', error);
    
    // API 호출 추적 (에러)
    const responseTime = Date.now() - startTime;
    systemStateManager.trackApiCall(responseTime, true);
    
    throw error; // withErrorHandler가 처리
  }
}

// 에러 핸들러 래핑
export const POST = withErrorHandler(startSystemHandler);

/**
 * OPTIONS - CORS 지원
 */
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
} 