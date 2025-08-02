/**
 * 🏥 기본 헬스체크 API
 *
 * E2E 테스트 및 기본 시스템 상태 확인용
 * Zod 스키마와 타입 안전성이 적용된 예시
 *
 * GET /api/health
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createApiRoute } from '@/lib/api/zod-middleware';
import { HealthCheckResponseSchema, type HealthCheckResponse } from '@/schemas/api.schema';
import { getErrorMessage } from '@/types/type-utils';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// 서비스 상태 체크 함수들 (실제 구현 시 각 서비스 체크 로직 추가)
async function checkDatabaseStatus(): Promise<'connected' | 'disconnected' | 'error'> {
  try {
    // TODO: 실제 데이터베이스 연결 체크
    return 'connected';
  } catch {
    return 'error';
  }
}

async function checkCacheStatus(): Promise<'connected' | 'disconnected' | 'error'> {
  try {
    // TODO: 실제 Redis 연결 체크
    return 'connected';
  } catch {
    return 'error';
  }
}

async function checkAIStatus(): Promise<'connected' | 'disconnected' | 'error'> {
  try {
    // TODO: 실제 AI 서비스 상태 체크
    return 'connected';
  } catch {
    return 'error';
  }
}

// 헬스체크 핸들러
const healthCheckHandler = createApiRoute()
  .response(HealthCheckResponseSchema)
  .configure({
    showDetailedErrors: true,
    enableLogging: true,
  })
  .build(async (_request, _context): Promise<HealthCheckResponse> => {
    const startTime = Date.now();

    // 병렬로 모든 서비스 상태 체크
    const [dbStatus, cacheStatus, aiStatus] = await Promise.all([
      checkDatabaseStatus(),
      checkCacheStatus(),
      checkAIStatus(),
    ]);

    // 전체 상태 결정
    const allServicesHealthy = 
      dbStatus === 'connected' && 
      cacheStatus === 'connected' && 
      aiStatus === 'connected';

    const hasErrors = 
      dbStatus === 'error' || 
      cacheStatus === 'error' || 
      aiStatus === 'error';

    const overallStatus = hasErrors 
      ? 'unhealthy' 
      : allServicesHealthy 
      ? 'healthy' 
      : 'degraded';

    // 응답 생성
    const response: HealthCheckResponse = {
      status: overallStatus,
      services: {
        database: {
          status: dbStatus,
          lastCheck: new Date().toISOString(),
          latency: 5, // TODO: 실제 레이턴시 측정
        },
        cache: {
          status: cacheStatus,
          lastCheck: new Date().toISOString(),
          latency: 2,
        },
        ai: {
          status: aiStatus,
          lastCheck: new Date().toISOString(),
          latency: 150,
        },
      },
      uptime: process.uptime ? Math.floor(process.uptime()) : 0,
      version: process.env.APP_VERSION || '5.44.3',
      timestamp: new Date().toISOString(),
    };

    // 검증 (개발 환경에서 유용)
    const validation = HealthCheckResponseSchema.safeParse(response);
    if (!validation.success) {
      console.error('Health check response validation failed:', validation.error);
    }

    return response;
  });

export async function GET(request: NextRequest) {
  try {
    return await healthCheckHandler(request);
  } catch (error) {
    console.error('❌ Health check failed:', error);

    // 에러 응답도 타입 안전하게
    const errorResponse = {
      status: 'unhealthy' as const,
      timestamp: new Date().toISOString(),
      error: 'Health check failed',
      message: getErrorMessage(error),
    };

    return NextResponse.json(errorResponse, {
      status: 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Content-Type': 'application/json',
      },
    });
  }
}

/**
 * HEAD 요청도 지원 (더 가벼운 헬스체크)
 */
export async function HEAD(_request: NextRequest) {
  try {
    return new NextResponse(null, {
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch {
    return new NextResponse(null, { status: 503 });
  }
}
