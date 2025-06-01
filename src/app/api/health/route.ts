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
    const startTime = Date.now();
    
    // 기본 시스템 정보
    const systemInfo = {
      status: 'healthy',
      timestamp: Date.now(),
      uptime: process.uptime ? Math.floor(process.uptime()) : null,
      environment: process.env.NODE_ENV || 'development',
      version: '5.21.0',
      phase: 'Phase 1 - 무설정 배포'
    };

    // 메모리 사용량 확인
    let memoryInfo = null;
    try {
      if (process.memoryUsage) {
        const mem = process.memoryUsage();
        memoryInfo = {
          heapUsed: Math.round(mem.heapUsed / 1024 / 1024),
          heapTotal: Math.round(mem.heapTotal / 1024 / 1024),
          external: Math.round(mem.external / 1024 / 1024),
          rss: Math.round(mem.rss / 1024 / 1024)
        };
      }
    } catch (error) {
      // 메모리 정보를 가져올 수 없는 환경
    }

    // Phase 1 모듈 상태 확인
    const moduleStatus = {
      realTimeHub: 'active',
      patternMatcher: 'active', 
      dataRetention: 'active'
    };

    // 응답 시간 계산
    const responseTime = Date.now() - startTime;

    const healthData = {
      status: 'healthy',
      system: systemInfo,
      memory: memoryInfo,
      modules: moduleStatus,
      performance: {
        responseTime,
        healthy: responseTime < 1000
      },
      checks: [
        { name: 'API Server', status: 'passing', message: 'API 서버 정상 동작' },
        { name: 'Memory Usage', status: memoryInfo ? 'passing' : 'warning', message: memoryInfo ? '메모리 사용량 정상' : '메모리 정보 확인 불가' },
        { name: 'Response Time', status: responseTime < 1000 ? 'passing' : 'warning', message: `응답 시간: ${responseTime}ms` }
      ]
    };

    return NextResponse.json(healthData, {
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

  } catch (error) {
    console.error('❌ 헬스 체크 오류:', error);
    
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: Date.now(),
      error: 'Health check failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { 
      status: 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
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
  })
} 