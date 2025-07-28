/**
 * 💾 목업 전용 캐시된 서버 데이터 API
 *
 * 목업 데이터를 메모리 캐시로 제공
 * GET /api/servers/cached
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getMockSystem } from '@/mock';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// 간단한 메모리 캐시
let memoryCache: { data: any; timestamp: number } | null = null;
const CACHE_TTL_MS = 300000; // 5분

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const forceRefresh = searchParams.get('refresh') === 'true';

  try {
    console.log(
      '💾 캐시된 서버 데이터 요청',
      forceRefresh ? '(강제 새로고침)' : ''
    );

    // 메모리 캐시 확인 (강제 새로고침이 아닌 경우)
    if (
      !forceRefresh &&
      memoryCache &&
      Date.now() - memoryCache.timestamp < CACHE_TTL_MS
    ) {
      console.log('✨ 메모리 캐시 히트');

      return NextResponse.json(
        {
          success: true,
          data: memoryCache.data.servers,
          stats: memoryCache.data.stats,
          lastUpdated: memoryCache.data.lastUpdated,
          source: 'memory-cache',
          cacheHit: true,
          timestamp: Date.now(),
        },
        {
          headers: {
            'Cache-Control': 'public, s-maxage=60',
            'X-Cache-Hit': 'true',
            'X-Data-Source': 'memory-cache',
          },
        }
      );
    }

    // 캐시 미스 또는 강제 새로고침 - 목업 데이터 가져오기
    console.log('🔄 목업 데이터 로드');

    const mockSystem = getMockSystem();
    const servers = mockSystem.getServers();

    // 통계 계산
    const stats = {
      total: servers.length,
      online: servers.filter(s => s.status === 'online').length,
      warning: servers.filter(s => s.status === 'warning').length,
      critical: servers.filter(s => s.status === 'critical').length,
    };

    // 캐시할 데이터
    const cacheData = {
      servers,
      stats,
      lastUpdated: new Date().toISOString(),
      source: 'mock',
    };

    // 메모리 캐시 저장
    memoryCache = {
      data: cacheData,
      timestamp: Date.now(),
    };
    console.log('💾 메모리 캐시 저장 완료');

    return NextResponse.json(
      {
        success: true,
        data: servers,
        stats,
        lastUpdated: cacheData.lastUpdated,
        source: 'mock',
        cacheHit: false,
        timestamp: Date.now(),
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60',
          'X-Cache-Hit': 'false',
          'X-Data-Source': 'mock',
        },
      }
    );
  } catch (error) {
    console.error('❌ 캐시된 서버 데이터 API 오류:', error);

    // 에러 발생 시 목업 데이터 반환
    const mockSystem = getMockSystem();
    const fallbackServers = mockSystem.getServers();

    return NextResponse.json(
      {
        success: true,
        data: fallbackServers,
        stats: {
          total: fallbackServers.length,
          online: fallbackServers.filter(s => s.status === 'online').length,
          warning: fallbackServers.filter(s => s.status === 'warning').length,
          critical: fallbackServers.filter(s => s.status === 'critical').length,
        },
        lastUpdated: new Date().toISOString(),
        source: 'mock-fallback',
        cacheHit: false,
        timestamp: Date.now(),
        error: 'Primary data source failed, using fallback',
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'public, s-maxage=10',
          'X-Cache-Hit': 'false',
          'X-Data-Source': 'mock-fallback',
        },
      }
    );
  }
}

/**
 * 💾 캐시 관리 API
 *
 * POST /api/servers/cached
 */
export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json();

    console.log(`💾 캐시 관리 액션: ${action}`);

    switch (action) {
      case 'clear':
        // 메모리 캐시 삭제
        memoryCache = null;
        console.log('✅ 메모리 캐시 삭제 완료');

        return NextResponse.json({
          success: true,
          message: 'Cache cleared successfully',
          timestamp: new Date().toISOString(),
        });

      case 'refresh': {
        // 캐시 강제 새로고침
        memoryCache = null;
        const refreshResponse = await GET(request);
        return refreshResponse;
      }

      case 'info': {
        // 캐시 정보 조회
        const cacheInfo = memoryCache
          ? {
              exists: true,
              ttl: Math.max(
                0,
                Math.floor(
                  (CACHE_TTL_MS - (Date.now() - memoryCache.timestamp)) / 1000
                )
              ),
              key: 'memory-cache',
              maxAge: CACHE_TTL_MS / 1000,
            }
          : {
              exists: false,
              ttl: 0,
              key: 'memory-cache',
              maxAge: CACHE_TTL_MS / 1000,
            };

        return NextResponse.json({
          success: true,
          cache: cacheInfo,
          timestamp: new Date().toISOString(),
        });
      }

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('❌ 캐시 관리 API 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Cache management failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
