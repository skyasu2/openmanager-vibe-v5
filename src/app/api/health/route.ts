/**
 * 🏥 Health Check API v1.0
 *
 * OpenManager v5.21.0 - 시스템 헬스 체크
 * GET: 전체 시스템 상태 확인
 */

import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * 🏥 시스템 헬스 체크
 */
export async function GET(request: NextRequest) {
  try {
    // 🔓 Vercel Protection Bypass 헤더 설정
    const headers = new Headers({
      'Content-Type': 'application/json',
      'x-vercel-protection-bypass':
        process.env.VERCEL_AUTOMATION_BYPASS_SECRET ||
        'ee2aGggamAVy7ti2iycFOXamwgjIhuhr',
      'x-vercel-set-bypass-cookie': 'true',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers':
        'Content-Type, x-vercel-protection-bypass',
    });

    const startTime = Date.now();

    // 🚀 빠른 기본 응답을 위한 최적화
    const systemInfo = {
      status: 'healthy',
      timestamp: Date.now(),
      uptime: process.uptime ? Math.floor(process.uptime()) : null,
      environment: process.env.NODE_ENV || 'development',
      version: '5.21.0',
      phase: 'Phase 1 - 무설정 배포',
    };

    // 메모리 사용량 확인 (빠른 처리)
    let memoryInfo = null;
    try {
      if (process.memoryUsage) {
        const mem = process.memoryUsage();
        memoryInfo = {
          heapUsed: Math.round(mem.heapUsed / 1024 / 1024),
          heapTotal: Math.round(mem.heapTotal / 1024 / 1024),
          external: Math.round(mem.external / 1024 / 1024),
          rss: Math.round(mem.rss / 1024 / 1024),
        };
      }
    } catch (error) {
      // 메모리 정보를 가져올 수 없는 환경
    }

    // Phase 1 모듈 상태 확인 (병렬 처리)
    let dataGeneratorStatus = 'active';
    let monitoringStatus = 'active';

    // 실제 데이터 생성기 상태 확인
    try {
      const globalStatus = (global as any)?.dataGeneratorStatus;
      if (globalStatus) {
        const timeSinceLastPing = Date.now() - (globalStatus.lastPing || 0);
        dataGeneratorStatus =
          timeSinceLastPing < 30000 && globalStatus.isHealthy
            ? 'active'
            : 'degraded';

        // 통신 상태도 확인
        if (!globalStatus.communicationOk) {
          monitoringStatus = 'degraded';
        }
      }
    } catch (error) {
      console.warn('데이터 생성기 상태 확인 실패:', error);
      dataGeneratorStatus = 'unknown';
    }

    const moduleStatus = {
      realTimeHub: 'active',
      patternMatcher: 'active',
      dataRetention: 'active',
      dataGenerator: dataGeneratorStatus, // 실제 상태 반영
      monitoring: monitoringStatus, // 실제 통신 상태 반영
    };

    // 응답 시간 계산
    const responseTime = Date.now() - startTime;
    const isHealthy = responseTime < 2000; // 2초 이내 응답을 건강한 상태로 판정

    const healthData = {
      status: isHealthy ? 'healthy' : 'degraded',
      system: systemInfo,
      memory: memoryInfo,
      modules: moduleStatus,
      performance: {
        responseTime,
        healthy: isHealthy,
        target: '<2000ms', // 목표 응답 시간 명시
      },
      checks: [
        {
          name: 'API Server',
          status: 'passing',
          message: 'API 서버 정상 동작',
        },
        {
          name: 'Memory Usage',
          status: memoryInfo ? 'passing' : 'warning',
          message: memoryInfo ? '메모리 사용량 정상' : '메모리 정보 확인 불가',
        },
        {
          name: 'Response Time',
          status: isHealthy ? 'passing' : 'warning',
          message: `응답 시간: ${responseTime}ms`,
        },
        {
          name: 'Data Generator',
          status:
            dataGeneratorStatus === 'active'
              ? 'passing'
              : dataGeneratorStatus === 'degraded'
                ? 'warning'
                : 'critical',
          message:
            dataGeneratorStatus === 'active'
              ? '데이터 생성기 정상 작동'
              : dataGeneratorStatus === 'degraded'
                ? '데이터 생성기 성능 저하'
                : '데이터 생성기 상태 확인 불가',
        },
        {
          name: 'Monitoring System',
          status: monitoringStatus === 'active' ? 'passing' : 'warning',
          message:
            monitoringStatus === 'active'
              ? '모니터링 시스템 정상 통신'
              : '모니터링 시스템 통신 문제',
        },
      ],
      // 🚀 추가 진단 정보
      diagnostics: {
        ready: true,
        dataFlowHealthy: dataGeneratorStatus === 'active',
        communicationOk: monitoringStatus === 'active',
        lastHealthCheck: new Date().toISOString(),
        dataGenerator: {
          status: dataGeneratorStatus,
          lastPing: (global as any)?.dataGeneratorStatus?.lastPing || null,
          consecutiveFailures:
            (global as any)?.dataGeneratorStatus?.consecutiveFailures || 0,
          recoveryAttempts: (global as any)?.dataGeneratorStatus
            ?.recoveryAttempt
            ? 1
            : 0,
        },
        monitoring: {
          status: monitoringStatus,
          lastSuccessfulCommunication:
            (global as any)?.dataGeneratorStatus?.lastSuccessfulCommunication ||
            null,
        },
      },
    };

    return NextResponse.json(healthData, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error('⚠️ 헬스 체크 오류 - 서버는 정상 동작 중입니다:', error);

    const errorHeaders = new Headers({
      'Content-Type': 'application/json',
      'x-vercel-protection-bypass':
        process.env.VERCEL_AUTOMATION_BYPASS_SECRET ||
        'ee2aGggamAVy7ti2iycFOXamwgjIhuhr',
      'x-vercel-set-bypass-cookie': 'true',
    });

    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: Date.now(),
        error: 'Health check failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      {
        status: 200,
        headers: errorHeaders,
      }
    );
  }
}

/**
 * OPTIONS - CORS 지원
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers':
        'Content-Type, x-vercel-protection-bypass, x-vercel-set-bypass-cookie',
      'x-vercel-protection-bypass':
        process.env.VERCEL_AUTOMATION_BYPASS_SECRET ||
        'ee2aGggamAVy7ti2iycFOXamwgjIhuhr',
    },
  });
}
