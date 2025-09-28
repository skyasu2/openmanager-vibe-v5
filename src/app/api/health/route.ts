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
import { createApiRoute } from '@/lib/api/zod-middleware';
import {
  HealthCheckResponseSchema,
  type HealthCheckResponse,
} from '@/schemas/api.schema';
import { getErrorMessage } from '@/types/type-utils';
import { getSupabaseClient } from '@/lib/supabase/supabase-client';
import { getCacheStats } from '@/lib/cache-helper';
import { getEnvConfig } from '@/lib/env-config';
import { getApiConfig } from '@/lib/api-config';
import debug from '@/utils/debug';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// 서비스 상태 체크 함수들 - 실제 구현
async function checkDatabaseStatus(): Promise<
  'connected' | 'disconnected' | 'error'
> {
  try {
    const startTime = Date.now();
    const supabase = getSupabaseClient();

    // 타임아웃 설정 (2초)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);

    try {
      // Supabase 연결 체크 - 실제 존재하는 테이블 사용
      const { data, error } = await supabase
        .from('command_vectors')
        .select('id')
        .limit(1);

      clearTimeout(timeoutId);
      const latency = Date.now() - startTime;

      if (error) {
        debug.error('❌ Database check failed:', error.message);
        return 'error';
      }

      // 데이터 존재 여부와 관계없이 쿼리가 성공하면 연결됨
      debug.log(`✅ Database connected (latency: ${latency}ms, records: ${data?.length || 0})`);
      return 'connected';
    } catch (fetchError) {
      clearTimeout(timeoutId);
      debug.error('❌ Database fetch timeout or error:', fetchError);
      return 'error';
    }
  } catch (error) {
    debug.error('❌ Database check error:', error);
    return 'error';
  }
}

async function checkCacheStatus(): Promise<
  'connected' | 'disconnected' | 'error'
> {
  try {
    // Memory-based 캐시 상태 체크
    const stats = getCacheStats();

    if (stats.size >= 0) {
      debug.log(
        `✅ Cache operational (${stats.size}/${stats.maxSize} items, hit rate: ${stats.hitRate}%)`
      );
      return 'connected';
    }

    return 'disconnected';
  } catch (error) {
    debug.error('❌ Cache check error:', error);
    return 'error';
  }
}

async function checkAIStatus(): Promise<
  'connected' | 'disconnected' | 'error'
> {
  try {
    const startTime = Date.now();

    // GCP VM AI 서비스 상태 체크 (비활성화 상태 체크)
    const gcpMcpEnabled = process.env.ENABLE_GCP_MCP_INTEGRATION === 'true';

    if (!gcpMcpEnabled) {
      // MCP 비활성화 상태에서는 로컬 AI만 체크
      debug.log('✅ AI service operational (local mode)');
      return 'connected';
    }

    // GCP VM 헬스 체크 (활성화된 경우)
    const vmUrl =
      process.env.GCP_MCP_SERVER_URL || 'http://104.154.205.25:10000';
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
        debug.log(`✅ GCP VM AI connected (latency: ${latency}ms)`);
        return 'connected';
      }

      debug.warn(`⚠️ GCP VM AI degraded (status: ${response.status})`);
      return 'disconnected';
    } catch {
      clearTimeout(timeoutId);
      debug.warn('⚠️ GCP VM AI disconnected, using local fallback');
      return 'disconnected';
    }
  } catch (error) {
    debug.error('❌ AI check error:', error);
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
    const envConfig = getEnvConfig();
    const apiConfig = getApiConfig();

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

    // 환경별 추가 정보 (개발 환경에서만)
    if (envConfig.isDevelopment) {
      (response as any).environment = {
        type: envConfig.environment,
        urls: {
          site: envConfig.siteUrl,
          api: envConfig.apiUrl,
          vmApi: envConfig.vmApiUrl,
        },
        config: {
          rateLimit: apiConfig.rateLimit,
          timeout: apiConfig.timeout,
          cache: apiConfig.cache,
        },
      };
    }

    // 검증 (개발 환경에서 유용)
    const validation = HealthCheckResponseSchema.safeParse(response);
    if (!validation.success) {
      debug.error('Health check response validation failed:', validation.error);
    }

    return response;
  });

export async function GET(request: NextRequest) {
  try {
    const apiConfig = getApiConfig();
    const response = await healthCheckHandler(request);

    // 환경별 캐시 헤더 설정
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (apiConfig.cache.enabled) {
      headers['Cache-Control'] =
        `public, max-age=${apiConfig.cache.ttl}, stale-while-revalidate=30`;
    } else {
      headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
    }

    // Response body 추출
    const body = await response.json();

    // NextResponse 생성 및 헤더 설정
    return NextResponse.json(body, { headers });
  } catch (error) {
    debug.error('❌ Health check failed:', error);

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
