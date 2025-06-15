/**
 * 🚀 Cached Server Data API
 *
 * 캐시된 서버 데이터를 효율적으로 제공하는 API
 * - 페이지네이션 지원
 * - 필터링 및 정렬 지원
 * - 실시간 업데이트 정보 포함
 */

import { NextRequest, NextResponse } from 'next/server';
import { serverDataCache } from '@/services/cache/ServerDataCache';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // 쿼리 파라미터 파싱
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '8');
    const status = searchParams.get('status') || 'all';
    const search = searchParams.get('search') || '';
    const location = searchParams.get('location') || 'all';
    const sortBy = searchParams.get('sortBy') || 'priority';
    const includeAll = searchParams.get('includeAll') === 'true';

    console.log(
      `📊 캐시된 서버 데이터 요청: page=${page}, pageSize=${pageSize}, status=${status}`
    );

    // 캐시 상태 확인
    const cacheStatus = serverDataCache.getCacheStatus();
    console.log('📊 캐시 상태:', cacheStatus);

    if (!cacheStatus.hasCache) {
      console.log('⚠️ 캐시가 준비되지 않음 - 초기화 대기 중');
      return NextResponse.json(
        {
          success: false,
          error: 'Cache not ready',
          message: '캐시가 초기화 중입니다. 잠시 후 다시 시도해주세요.',
          cacheStatus,
        },
        { status: 503 }
      );
    }

    // 전체 데이터 요청인 경우
    if (includeAll) {
      const cachedData = serverDataCache.getCachedData();
      if (!cachedData) {
        return NextResponse.json(
          {
            success: false,
            error: 'Cache expired',
            message: '캐시가 만료되었습니다.',
          },
          { status: 503 }
        );
      }

      return NextResponse.json({
        success: true,
        data: {
          servers: cachedData.servers,
          summary: cachedData.summary,
          pagination: {
            page: 1,
            pageSize: cachedData.servers.length,
            totalPages: 1,
            totalItems: cachedData.servers.length,
          },
          cache: {
            version: cachedData.version,
            lastUpdated: cachedData.lastUpdated,
            isUpdating: cacheStatus.isUpdating,
          },
        },
      });
    }

    // 페이지네이션된 데이터 요청
    const filters = {
      status: status !== 'all' ? status : undefined,
      search: search || undefined,
      location: location !== 'all' ? location : undefined,
      sortBy,
    };

    const paginatedData = serverDataCache.getPaginatedServers(
      page,
      pageSize,
      filters
    );

    if (!paginatedData) {
      return NextResponse.json(
        {
          success: false,
          error: 'No data available',
          message: '데이터를 가져올 수 없습니다.',
        },
        { status: 503 }
      );
    }

    // 전체 요약 정보도 함께 제공
    const cachedData = serverDataCache.getCachedData();
    const summary = cachedData?.summary || {
      total: 0,
      online: 0,
      warning: 0,
      offline: 0,
      avgCpu: 0,
      avgMemory: 0,
    };

    const response = {
      success: true,
      data: {
        servers: paginatedData.data,
        summary,
        pagination: {
          page: paginatedData.page,
          pageSize: paginatedData.pageSize,
          totalPages: paginatedData.totalPages,
          totalItems: summary.total,
        },
        filters: paginatedData.filters,
        cache: {
          version: cachedData?.version || 0,
          lastUpdated: cachedData?.lastUpdated || 0,
          isUpdating: cacheStatus.isUpdating,
          paginatedCacheSize: cacheStatus.paginatedCacheSize,
        },
      },
    };

    console.log(
      `✅ 캐시된 데이터 반환: ${paginatedData.data.length}개 서버 (v${cachedData?.version})`
    );

    return NextResponse.json(response);
  } catch (error) {
    console.error('❌ 캐시된 서버 데이터 API 오류:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: '서버 내부 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * 🔄 캐시 새로고침 API
 */
export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'refresh') {
      console.log('🔄 수동 캐시 새로고침 요청');

      await serverDataCache.refreshCache();

      const cacheStatus = serverDataCache.getCacheStatus();

      return NextResponse.json({
        success: true,
        message: '캐시가 성공적으로 새로고침되었습니다.',
        cacheStatus,
      });
    }

    if (action === 'status') {
      const cacheStatus = serverDataCache.getCacheStatus();

      return NextResponse.json({
        success: true,
        cacheStatus,
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Invalid action',
        message:
          '유효하지 않은 액션입니다. action=refresh 또는 action=status를 사용하세요.',
      },
      { status: 400 }
    );
  } catch (error) {
    console.error('❌ 캐시 새로고침 API 오류:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: '캐시 새로고침 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
