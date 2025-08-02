/**
 * 🚀 캐시 최적화 API
 *
 * 캐시 워밍업 및 최적화 작업 실행
 * POST /api/cache/optimize
 * - Zod 스키마로 타입 안전성 보장
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  warmupCache,
  invalidateCache,
  getCacheService,
} from '@/lib/cache-helper';
import { supabase as createClient } from '@/lib/supabase';
import { createApiRoute } from '@/lib/api/zod-middleware';
import {
  CacheOptimizeRequestSchema,
  CacheWarmupResponseSchema,
  CacheInvalidateResponseSchema,
  CacheOptimizeResponseSchema,
  CacheResetStatsResponseSchema,
  type CacheOptimizeRequest,
  type CacheWarmupResponse,
  type CacheInvalidateResponse,
  type CacheOptimizeResponse,
  type CacheResetStatsResponse,
  type CacheStats,
  type ServerMetricsDetail,
} from '@/schemas/api.schema';
import { getErrorMessage } from '@/types/type-utils';

export const runtime = 'edge';

// POST 핸들러
const postHandler = createApiRoute()
  .body(CacheOptimizeRequestSchema)
  .configure({
    showDetailedErrors: process.env.NODE_ENV === 'development',
    enableLogging: true,
  })
  .build(async (_request, context) => {
    const { action, options } = context.body;

    switch (action) {
      case 'warmup':
        return await handleWarmup(options);

      case 'invalidate':
        return await handleInvalidate(options);

      case 'optimize':
        return await handleOptimize();

      case 'reset-stats':
        return await handleResetStats();

      default:
        throw new Error('알 수 없는 작업');
    }
  });

export async function POST(request: NextRequest) {
  try {
    return await postHandler(request);
  } catch (error) {
    console.error('❌ 캐시 최적화 실패:', error);
    return NextResponse.json(
      { success: false, error: '캐시 최적화 실패', message: getErrorMessage(error) },
      { status: 500 }
    );
  }
}

/**
 * 캐시 워밍업 처리
 */
async function handleWarmup(options?: { targets?: string[]; pattern?: string }): Promise<CacheWarmupResponse> {
  const supabaseClient = createClient;
  const warmupItems = [];

  // 서버 목록 워밍업
  if (!options?.targets || options.targets.includes('servers')) {
    warmupItems.push({
      key: 'servers:list',
      fetcher: async () => {
        const { data } = await supabaseClient
          .from('servers')
          .select('*')
          .order('created_at', { ascending: false });
        return data || [];
      },
      ttl: 300, // 5분
    });
  }

  // 서버 요약 워밍업
  if (!options?.targets || options.targets.includes('summary')) {
    warmupItems.push({
      key: 'servers:summary',
      fetcher: async () => {
        const { data: servers } = await supabaseClient
          .from('servers')
          .select('id, status, metrics');

        if (!servers) return null;

        return {
          totalServers: servers.length,
          onlineServers: servers.filter((s) => s.status === 'online').length,
          avgCpuUsage:
            servers.reduce((sum, s) => {
              const metrics = s.metrics as ServerMetricsDetail;
              return sum + (metrics?.cpu?.usage || 0);
            }, 0) / servers.length,
          timestamp: Date.now(),
        };
      },
      ttl: 900, // 15분
    });
  }

  // 개별 서버 데이터 워밍업
  if (!options?.targets || options.targets.includes('server-details')) {
    const { data: serverIds } = await supabaseClient
      .from('servers')
      .select('id')
      .limit(10); // 상위 10개만

    if (serverIds) {
      serverIds.forEach(({ id }) => {
        warmupItems.push({
          key: `server:${id}`,
          fetcher: async () => {
            const { data } = await supabaseClient
              .from('servers')
              .select('*')
              .eq('id', id)
              .single();
            return data;
          },
          ttl: 300, // 5분
        });
      });
    }
  }

  await warmupCache(warmupItems);

  return {
    success: true,
    message: `${warmupItems.length}개 항목 워밍업 완료`,
    items: warmupItems.map((item) => item.key),
  };
}

/**
 * 캐시 무효화 처리
 */
async function handleInvalidate(options?: { targets?: string[]; pattern?: string }): Promise<CacheInvalidateResponse> {
  await invalidateCache(options?.pattern);

  return {
    success: true,
    message: options?.pattern
      ? `패턴 '${options.pattern}'에 해당하는 캐시 무효화 완료`
      : '전체 캐시 무효화 완료',
  };
}

/**
 * 캐시 최적화 처리
 */
async function handleOptimize(): Promise<CacheOptimizeResponse> {
  const cache = getCacheService();
  const stats = cache.getStats();

  const optimizations: string[] = [];

  // 낮은 히트율 최적화
  if (stats.hitRate < 70) {
    // 주요 데이터 워밍업
    await handleWarmup({ targets: ['servers', 'summary'] });
    optimizations.push('주요 데이터 사전 캐싱 완료');
  }

  // 높은 에러율 대응
  if (stats.errors > 50) {
    // 통계 리셋
    cache.resetStats();
    optimizations.push('에러 통계 리셋 완료');
  }

  // 메모리 사용량 최적화
  if (stats.memoryUsageMB > 200) {
    // 오래된 실시간 데이터 정리
    await invalidateCache('realtime');
    optimizations.push('실시간 데이터 캐시 정리 완료');
  }

  const rawStats = cache.getStats();
  const { recommendations, ...baseStats } = rawStats;
  const newStats: CacheStats = {
    hits: baseStats.hits || 0,
    misses: baseStats.misses || 0,
    errors: baseStats.errors || 0,
    commands: baseStats.sets + baseStats.deletes || 0, // sets + deletes로 총 명령 수 계산
    memoryUsage: baseStats.memoryUsageMB || 0, // memoryUsage는 memoryUsageMB와 동일하게 설정
    storeSize: baseStats.hits + baseStats.misses || 0, // 스토어 크기는 총 요청 수로 추정
    hitRate: baseStats.hitRate || 0,
    commandsPerSecond: (baseStats.sets + baseStats.deletes) / Math.max(1, (Date.now() - baseStats.lastReset) / 1000) || 0, // 초당 명령 수 계산
    memoryUsageMB: baseStats.memoryUsageMB || 0,
  };

  return {
    success: true,
    message: '캐시 최적화 완료',
    optimizations,
    newStats,
  };
}

/**
 * 통계 리셋 처리
 */
async function handleResetStats(): Promise<CacheResetStatsResponse> {
  const cache = getCacheService();
  cache.resetStats();

  const rawStats = cache.getStats();
  const { recommendations, ...baseStats } = rawStats;
  const newStats: CacheStats = {
    hits: baseStats.hits || 0,
    misses: baseStats.misses || 0,
    errors: baseStats.errors || 0,
    commands: baseStats.sets + baseStats.deletes || 0, // sets + deletes로 총 명령 수 계산
    memoryUsage: baseStats.memoryUsageMB || 0, // memoryUsage는 memoryUsageMB와 동일하게 설정
    storeSize: baseStats.hits + baseStats.misses || 0, // 스토어 크기는 총 요청 수로 추정
    hitRate: baseStats.hitRate || 0,
    commandsPerSecond: (baseStats.sets + baseStats.deletes) / Math.max(1, (Date.now() - baseStats.lastReset) / 1000) || 0, // 초당 명령 수 계산
    memoryUsageMB: baseStats.memoryUsageMB || 0,
  };

  return {
    success: true,
    message: '캐시 통계 리셋 완료',
    newStats,
  };
}
