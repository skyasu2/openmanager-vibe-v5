/**
 * 🔧 시스템 상태 API with Fallback Support
 * GET /api/system/status
 *
 * 서버 비가동 상태에서도 안정적인 응답 제공:
 * - 시뮬레이션 엔진 오프라인 시 fallback JSON 응답
 * - UI 튕김 방지를 위한 "offline" 상태값 반환
 * - 503 에러 대신 200 OK + 상태 정보 제공
 */

import { NextRequest, NextResponse } from 'next/server';
import { systemStateManager } from '../../../../core/system/SystemStateManager';

/**
 * 🏥 시스템 상태 조회
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    console.log('🔧 시스템 상태 조회 시작');

    // 시스템 상태 매니저에서 현재 상태 조회
    const systemStatus = systemStateManager.getSystemStatus();

    if (systemStatus) {
      // 정상적인 시스템 상태 반환
      return NextResponse.json({
        success: true,
        status: systemStatus.health,
        uptime: systemStatus.simulation.runtime,
        version: process.env.npm_package_version || '5.17.0',
        environment: process.env.NODE_ENV || 'development',

        // 상세 상태 정보
        simulation: {
          isRunning: systemStatus.simulation.isRunning,
          serverCount: systemStatus.simulation.serverCount,
          dataCount: systemStatus.simulation.dataCount,
          status: systemStatus.services.simulation,
        },

        services: systemStatus.services,
        performance: systemStatus.performance,

        // 메타데이터
        lastUpdated: systemStatus.lastUpdated,
        responseTime: Date.now() - startTime,
        fallback: false,
      });
    }

    // SystemStateManager가 아직 초기화되지 않은 경우 fallback
    throw new Error('SystemStateManager not initialized');
  } catch (error) {
    console.warn('⚠️ 시스템 상태 조회 실패, fallback 모드 사용:', error);

    // Fallback 응답 - 503 대신 200 OK + offline 상태
    const fallbackResponse = {
      success: true,
      status: 'offline', // 'unhealthy' 대신 'offline' 사용
      uptime: 0,
      version: process.env.npm_package_version || '5.17.0',
      environment: process.env.NODE_ENV || 'development',

      // 오프라인 상태 정보
      simulation: {
        isRunning: false,
        serverCount: 0,
        dataCount: 0,
        status: 'offline',
      },

      services: {
        simulation: 'offline',
        cache: 'offline',
        prometheus: 'offline',
        vercel: 'unknown',
      },

      performance: {
        averageResponseTime: 0,
        apiCalls: 0,
        cacheHitRate: 0,
        errorRate: 0,
      },

      // 메타데이터
      lastUpdated: new Date().toISOString(),
      responseTime: Date.now() - startTime,
      fallback: true,
      message: '시스템이 일시적으로 오프라인 상태입니다',
    };

    // 200 OK 반환하여 UI 튕김 방지
    return NextResponse.json(fallbackResponse, {
      status: 200, // 503 대신 200 사용
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-System-Status': 'offline',
        'X-Fallback-Mode': 'true',
      },
    });
  }
}

/**
 * OPTIONS - CORS 지원
 */
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
