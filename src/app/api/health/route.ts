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
import { getSupabaseClient } from '@/lib/supabase/client';
import { getCacheStats } from '@/lib/cache/cache-helper';
import { getApiConfig } from '@/lib/api/api-config';
import { env, isDevelopment } from '@/env';
import debug from '@/utils/debug';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic'; // 수동 테스트 전용, 자동 호출 금지

// 서비스 상태 체크 함수들 - 실제 구현
async function checkDatabaseStatus(): Promise<
  'connected' | 'disconnected' | 'error'
> {
  try {
    const startTime = Date.now();
    const supabase = getSupabaseClient();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);
    try {
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
      debug.log(
        `✅ Database connected (latency: ${latency}ms, records: ${data?.length || 0})`
      );
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

function checkCacheStatus(): Promise<'connected' | 'disconnected' | 'error'> {
  try {
    const stats = getCacheStats();
    if (stats.size >= 0) {
      debug.log(
        `✅ Cache operational (${stats.size}/${stats.maxSize} items, hit rate: ${stats.hitRate}%)`
      );
      return Promise.resolve('connected');
    }
    return Promise.resolve('disconnected');
  } catch (error) {
    debug.error('❌ Cache check error:', error);
    return Promise.resolve('error');
  }
}

async function checkAIStatus(): Promise<
  'connected' | 'disconnected' | 'error'
> {
  try {
    const startTime = Date.now();
    const gcpMcpEnabled = env.ENABLE_GCP_MCP_INTEGRATION === 'true';

    if (!gcpMcpEnabled) {
      debug.log('✅ AI service operational (local mode)');
      return 'connected';
    }

    const vmUrl = env.GCP_MCP_SERVER_URL || 'http://104.154.205.25:10000';
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

interface ServiceCheckResult {
  status: 'connected' | 'disconnected' | 'error';
  latency: number;
}

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

const healthCheckHandler = createApiRoute()
  .response(HealthCheckResponseSchema)
  .configure({ showDetailedErrors: true, enableLogging: true })
  .build(async (_request, _context): Promise<HealthCheckResponse> => {
    const apiConfig = getApiConfig();
    const [dbResult, cacheResult, aiResult] = await Promise.all([
      checkDatabaseWithLatency(),
      checkCacheWithLatency(),
      checkAIWithLatency(),
    ]);

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
      version: env.APP_VERSION || '5.66.32',
      timestamp: new Date().toISOString(),
    };

    if (isDevelopment) {
      (response as Record<string, unknown>).environment = {
        type: env.NODE_ENV,
        urls: {
          site: env.NEXT_PUBLIC_APP_URL,
          api: `${env.NEXT_PUBLIC_APP_URL}/api`,
          vmApi: env.VM_API_URL,
        },
        config: {
          rateLimit: apiConfig.rateLimit,
          timeout: apiConfig.timeout,
          cache: apiConfig.cache,
        },
      };
    }

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
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (apiConfig.cache.enabled) {
      headers['Cache-Control'] =
        `public, max-age=${apiConfig.cache.ttl}, stale-while-revalidate=30`;
    } else {
      headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
    }

    const body = await response.json();
    return NextResponse.json(body, { headers });
  } catch (error) {
    debug.error('❌ Health check failed:', error);
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

export function HEAD(_request: NextRequest) {
  try {
    return new NextResponse(null, {
      status: 200,
      headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' },
    });
  } catch {
    return new NextResponse(null, { status: 503 });
  }
}
