/**
 * 🚀 Mock 시스템 기반 실시간 서버 데이터 API
 *
 * 기능:
 * - 실시간 서버 메트릭 제공 (Mock 시스템 자동 로테이션)
 * - 클러스터 상태 정보
 * - 애플리케이션 성능 지표
 * - 대시보드용 요약 데이터
 */

import { getMockSystem } from '@/mock';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import debug from '@/utils/debug';

// 기본 경고 생성 함수 (폴백용)
function _createBasicFallbackWarning(dataSource: string, reason: string) {
  return {
    level: 'CRITICAL',
    type: 'DATA_FALLBACK_WARNING',
    message: '실시간 서버 데이터 생성기 실패',
    dataSource,
    fallbackReason: reason,
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
    actionRequired: '실제 데이터 소스 연결 필요',
    productionImpact:
      process.env.NODE_ENV === 'production' ||
      process.env.VERCEL_ENV === 'production'
        ? 'CRITICAL'
        : 'LOW',
  };
}

export const dynamic = 'force-dynamic';

// 전역 변수로 GCP 실제 데이터 서비스 상태 관리
// Using mock system for realtime server data

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '8', 10);

  try {
    debug.log('🚀 실시간 서버 데이터 API - Mock 시스템 실시간 모드');

    // Mock 시스템에서 실시간 서버 데이터 가져오기 (자동 로테이션 포함)
    const mockSystem = getMockSystem({
      autoRotate: true,
      rotationInterval: 30000, // 30초마다 데이터 업데이트
      speed: 1, // 실시간 속도
    });

    const allServers = mockSystem.getServers();
    debug.log(`📊 Mock 시스템에서 ${allServers.length}개 서버 로드됨`);

    // 실시간 업데이트 타임스탬프 추가
    const realtimeServers = allServers.map((server) => ({
      ...server,
      lastUpdate: new Date().toISOString(),
      // Mock 시스템이 이미 실시간 변동을 처리하므로 추가 시뮬레이션 불필요
    }));

    // 요약 통계 계산
    const dashboardSummary = {
      total: realtimeServers.length,
      online: realtimeServers.filter((s) => s.status === 'online').length,
      warning: realtimeServers.filter((s) => s.status === 'warning').length,
      critical: realtimeServers.filter((s) => s.status === 'critical').length,
      lastUpdate: new Date().toISOString(),
      averageCpu:
        realtimeServers.reduce((sum, s) => sum + s.cpu, 0) /
        Math.max(realtimeServers.length, 1),
      averageMemory:
        realtimeServers.reduce((sum, s) => sum + s.memory, 0) /
        Math.max(realtimeServers.length, 1),
    };

    debug.log(
      `📊 요약 통계: 총 ${dashboardSummary.total}개, 온라인 ${dashboardSummary.online}개, 경고 ${dashboardSummary.warning}개, 위험 ${dashboardSummary.critical}개`
    );

    // 페이지네이션 처리
    const totalServers = realtimeServers.length;
    const totalPages = Math.ceil(totalServers / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedServers = realtimeServers.slice(startIndex, endIndex);

    const responseData = {
      servers: paginatedServers,
      summary: {
        servers: dashboardSummary,
      },
      pagination: {
        currentPage: page,
        totalPages: totalPages,
        totalItems: totalServers,
        itemsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };

    // 응답 헤더 설정
    const responseHeaders: Record<string, string> = {
      'X-Data-Source': 'mock-realtime',
      'X-Server-Count': String(realtimeServers.length),
    };

    return NextResponse.json(
      {
        ...responseData,
        success: true,
        data: paginatedServers,
        // 데이터 무결성 정보
        dataIntegrity: {
          dataSource: 'mock-realtime',
          isMockData: true,
          environment: process.env.NODE_ENV,
          warningLevel: 'NONE',
          serverCount: realtimeServers.length,
          generatorStatus: { status: 'active' },
        },
        timestamp: Date.now(),
        count: paginatedServers.length,
      },
      {
        headers: responseHeaders,
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    debug.error('❌ Mock 시스템 실시간 서버 데이터 API 오류:', errorMessage);
    return NextResponse.json(
      {
        success: false,
        message: 'Mock System Error',
        error: errorMessage,
        servers: [],
        summary: {},
        pagination: {
          currentPage: page,
          totalPages: 0,
          totalItems: 0,
          itemsPerPage: limit,
          hasNextPage: false,
          hasPrevPage: false,
        },
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json();

    switch (action) {
      case 'start':
        // 목업 모드에서는 항상 준비 상태
        return NextResponse.json({
          success: true,
          message: '목업 실시간 데이터가 준비되었습니다.',
          status: { status: 'active' },
        });

      case 'stop':
        // 목업 모드에서는 중지 불필요
        return NextResponse.json({
          success: true,
          message: '목업 실시간 데이터는 항상 활성 상태입니다.',
          status: { status: 'active' },
        });

      case 'status':
        return NextResponse.json({
          success: true,
          status: { status: 'active' },
          summary: { summary: 'Mock data available' },
        });

      case 'refresh': {
        // Mock 시스템 데이터 새로고침 (시스템 리셋)
        debug.log('🔄 Mock 시스템 실시간 서버 데이터 새로고침 요청');
        const mockSystem = getMockSystem();
        mockSystem.reset(); // Mock 시스템 리셋으로 새로운 데이터 생성
        return NextResponse.json({
          success: true,
          message: 'Mock 시스템 실시간 서버 데이터가 새로고침되었습니다.',
          status: { status: 'active' },
        });
      }
      default:
        return NextResponse.json(
          { success: false, error: '지원하지 않는 액션입니다.' },
          { status: 400 }
        );
    }
  } catch (error) {
    debug.error('❌ Mock 시스템 실시간 서버 데이터 POST API 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '알 수 없는 오류',
      },
      { status: 500 }
    );
  }
}
