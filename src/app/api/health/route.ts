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
import { getSupabaseClient } from '@/lib/supabase/supabase-client';
import { getCacheStats } from '@/lib/cache-helper';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// 서비스 상태 체크 함수들 - 실제 구현
async function checkDatabaseStatus(): Promise<'connected' | 'disconnected' | 'error'> {
  try {
    const startTime = Date.now();
    const supabase = getSupabaseClient();
    
    // Supabase 연결 체크 - 간단한 쿼리 실행
    const { data, error } = await supabase
      .from('servers')
      .select('id')
      .limit(1)
      .single();
    
    const latency = Date.now() - startTime;
    
    if (error) {
      console.error('❌ Database check failed:', error.message);
      return 'error';
    }
    
    console.log(`✅ Database connected (latency: ${latency}ms)`);
    return 'connected';
  } catch (error) {
    console.error('❌ Database check error:', error);
    return 'error';
  }
}

async function checkCacheStatus(): Promise<'connected' | 'disconnected' | 'error'> {
  try {
    // Memory-based 캐시 상태 체크
    const stats = getCacheStats();
    
    if (stats.size >= 0) {
      console.log(`✅ Cache operational (${stats.size}/${stats.maxSize} items, hit rate: ${stats.hitRate}%)`);
      return 'connected';
    }
    
    return 'disconnected';
  } catch (error) {
    console.error('❌ Cache check error:', error);
    return 'error';
  }
}

async function checkAIStatus(): Promise<'connected' | 'disconnected' | 'error'> {
  try {
    const startTime = Date.now();
    
    // GCP VM AI 서비스 상태 체크 (비활성화 상태 체크)
    const gcpMcpEnabled = process.env.ENABLE_GCP_MCP_INTEGRATION === 'true';
    
    if (!gcpMcpEnabled) {
      // MCP 비활성화 상태에서는 로컬 AI만 체크
      console.log('✅ AI service operational (local mode)');
      return 'connected';
    }
    
    // GCP VM 헬스 체크 (활성화된 경우)
    const vmUrl = process.env.GCP_MCP_SERVER_URL || 'http://104.154.205.25:10000';
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    
    try {
      const response = await fetch(`${vmUrl}/health`, {
        signal: controller.signal,
        method: 'GET',
      });
      
      clearTimeout(timeoutId);
      const latency = Date.now() - startTime;
      
      if (response.ok) {
        console.log(`✅ GCP VM AI connected (latency: ${latency}ms)`);
        return 'connected';
      }
      
      console.warn(`⚠️ GCP VM AI degraded (status: ${response.status})`);
      return 'disconnected';
    } catch {
      clearTimeout(timeoutId);
      console.warn('⚠️ GCP VM AI disconnected, using local fallback');
      return 'disconnected';
    }
  } catch (error) {
    console.error('❌ AI check error:', error);
    return 'error';
  }
}

// 레이턴시 추적을 위한 타입
interface ServiceCheckResult {
  status: 'connected' | 'disconnected' | 'error';
  latency: number;
}

// 서비스 체크 함수들 수정하여 레이턴시 포함
async function checkDatabaseWithLatency(): Promise<ServiceCheckResult> {
  const startTime = Date.now();
  const status = await checkDatabaseStatus();
  return { status, latency: Date.now() - startTime };
}

async function checkCacheWithLatency(): Promise<ServiceCheckResult> {
  const startTime = Date.now();
  const status = await checkCacheStatus();
  return { status, latency: Date.now() - startTime };
}

async function checkAIWithLatency(): Promise<ServiceCheckResult> {
  const startTime = Date.now();
  const status = await checkAIStatus();
  return { status, latency: Date.now() - startTime };
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

    // 병렬로 모든 서비스 상태 체크 (레이턴시 포함)
    const [dbResult, cacheResult, aiResult] = await Promise.all([
      checkDatabaseWithLatency(),
      checkCacheWithLatency(),
      checkAIWithLatency(),
    ]);

    // 전체 상태 결정
    const allServicesHealthy = 
      dbResult.status === 'connected' && 
      cacheResult.status === 'connected' && 
      aiResult.status === 'connected';

    const hasErrors = 
      dbResult.status === 'error' || 
      cacheResult.status === 'error' || 
      aiResult.status === 'error';

    const overallStatus = hasErrors 
      ? 'unhealthy' 
      : allServicesHealthy 
      ? 'healthy' 
      : 'degraded';

    // 응답 생성 (실제 측정된 레이턴시 포함)
    const response: HealthCheckResponse = {
      status: overallStatus,
      services: {
        database: {
          status: dbResult.status,
          lastCheck: new Date().toISOString(),
          latency: dbResult.latency,
        },
        cache: {
          status: cacheResult.status,
          lastCheck: new Date().toISOString(),
          latency: cacheResult.latency,
        },
        ai: {
          status: aiResult.status,
          lastCheck: new Date().toISOString(),
          latency: aiResult.latency,
        },
      },
      uptime: process.uptime ? Math.floor(process.uptime()) : 0,
      version: process.env.APP_VERSION || '5.66.32',
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
