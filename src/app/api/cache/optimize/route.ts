/**
 * 🚀 캐시 최적화 API
 *
 * 캐시 워밍업 및 최적화 작업 실행
 * POST /api/cache/optimize
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  warmupCache,
  invalidateCache,
  getCacheService,
} from '@/lib/cache-helper';
import { supabase as createClient } from '@/lib/supabase';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    const { action, options } = await request.json();

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
        return NextResponse.json(
          { success: false, error: '알 수 없는 작업' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('❌ 캐시 최적화 실패:', error);
    return NextResponse.json(
      { success: false, error: '캐시 최적화 실패' },
      { status: 500 }
    );
  }
}

/**
 * 캐시 워밍업 처리
 */
async function handleWarmup(options?: { targets?: string[] }) {
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
              const metrics = s.metrics as any;
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

  return NextResponse.json({
    success: true,
    message: `${warmupItems.length}개 항목 워밍업 완료`,
    items: warmupItems.map((item) => item.key),
  });
}

/**
 * 캐시 무효화 처리
 */
async function handleInvalidate(options?: { pattern?: string }) {
  await invalidateCache(options?.pattern);

  return NextResponse.json({
    success: true,
    message: options?.pattern
      ? `패턴 '${options.pattern}'에 해당하는 캐시 무효화 완료`
      : '전체 캐시 무효화 완료',
  });
}

/**
 * 캐시 최적화 처리
 */
async function handleOptimize() {
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

  return NextResponse.json({
    success: true,
    message: '캐시 최적화 완료',
    optimizations,
    newStats: cache.getStats(),
  });
}

/**
 * 통계 리셋 처리
 */
async function handleResetStats() {
  const cache = getCacheService();
  cache.resetStats();

  return NextResponse.json({
    success: true,
    message: '캐시 통계 리셋 완료',
    newStats: cache.getStats(),
  });
}
