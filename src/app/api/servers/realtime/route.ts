/**
 * 🚀 실시간 서버 데이터 API
 *
 * 기능:
 * - 실시간 서버 메트릭 제공
 * - 클러스터 상태 정보
 * - 애플리케이션 성능 지표
 * - 대시보드용 요약 데이터
 */

import { transformServerInstancesToServers } from '@/adapters/server-data-adapter';
import { getRedisClient } from '@/lib/redis';
import { GCPRealDataService } from '@/services/gcp/GCPRealDataService';
import { Server } from '@/types/server';
import { NextRequest, NextResponse } from 'next/server';

// 기본 경고 생성 함수 (폴백용)
function createBasicFallbackWarning(dataSource: string, reason: string) {
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
let gcpDataService: GCPRealDataService | null = null;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '8', 10);

  try {
    console.log('🔨 빌드 타임: 환경변수 검증 건너뜀');

    // Redis 클라이언트 초기화 시도
    try {
      const redis = await getRedisClient();
      console.log('✅ Redis 연결 성공 - 서버 데이터 저장 활성화');
    } catch (redisError) {
      console.warn('⚠️ Redis 환경변수 누락 → Enhanced Mock Redis로 자동 전환');
    }

    // GCP 데이터 서비스 초기화 (한 번만)
    if (!gcpDataService) {
      gcpDataService = GCPRealDataService.getInstance();
      await gcpDataService.initialize();
    }

    // 현재 서버 데이터 가져오기
    const allServerInstances = await gcpDataService.getRealServerMetrics().then(response => response.data);

    console.log(
      `초기화 실행 from /api/servers/realtime (서버 ${allServerInstances.length}개 감지)`
    );

    // 🛡️ 서버 데이터 검증 및 폴백 처리
    if (allServerInstances.length === 0) {
      // 경고 생성
      const warning = createBasicFallbackWarning(
        'RealServerDataGenerator',
        '서버 인스턴스가 존재하지 않음'
      );

      // 프로덕션 환경에서는 에러 발생
      if (
        process.env.NODE_ENV === 'production' ||
        process.env.VERCEL_ENV === 'production'
      ) {
        console.error('💀 PRODUCTION_REALTIME_DATA_ERROR:', warning);
        return NextResponse.json(
          {
            success: false,
            error: 'PRODUCTION_REALTIME_DATA_ERROR',
            message: '프로덕션 환경에서 실시간 서버 데이터 필수',
            warning,
            actionRequired: '실제 데이터 소스 연결 필요',
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
          {
            status: 500,
            headers: {
              'X-Data-Fallback-Warning': 'true',
              'X-Production-Error': 'true',
              'X-Data-Source': 'error',
            },
          }
        );
      }

      // 개발 환경에서만 초기화 시도
      console.warn('⚠️ REALTIME_DATA_FALLBACK_WARNING:', warning);
      console.log('🚀 GCP 실제 데이터 서비스 초기화 시작...');
      await gcpDataService.initialize();
      console.log('✅ GCP 실제 데이터 서비스 초기화 완료');

      // 초기화 후에도 데이터가 없으면 추가 경고
      const retryServerInstances = await gcpDataService.getRealServerMetrics().then(response => response.data);
      if (retryServerInstances.length === 0) {
        console.error('🚨 초기화 후에도 서버 데이터 없음 - 시스템 점검 필요');
      }
    }

    // 🔧 GCP 실제 데이터 서비스 상태 확인
    const metricsResponse = await gcpDataService.getRealServerMetrics();
    const status = { status: metricsResponse.success ? 'active' : 'error' };
    const isMockMode = metricsResponse.isErrorState;

    // 서버리스 환경에서는 자동 생성 개념 없음 (요청 시마다 데이터 가져오기)

    // 🎯 Enhanced v2.0: 완전한 타입 안전 변환
    const allServers = transformServerInstancesToServers(allServerInstances);
    const validServers = allServers.filter(
      server => server !== null
    ) as Server[];

    // 🔒 변환 품질 검증
    const validServersFiltered = validServers.filter(
      server => server && server.id && server.name && server.services
    );

    // 🎯 실제 서버 데이터 기반 요약 통계 계산 (수정됨)
    const dashboardSummary = {
      total: validServersFiltered.length,
      online: validServersFiltered.filter((s: any) => s.status === 'online' || s.status === 'healthy'
      ).length,
      warning: validServersFiltered.filter((s: any) => s.status === 'warning').length,
      critical: validServersFiltered.filter((s: any) => s.status === 'offline' || s.status === 'critical'
      ).length,
      lastUpdate: new Date().toISOString(),
      averageCpu:
        validServersFiltered.reduce((sum: number, s: any) => sum + s.cpu, 0) /
        Math.max(validServersFiltered.length, 1),
      averageMemory:
        validServersFiltered.reduce((sum: number, s: any) => sum + s.memory, 0) /
        Math.max(validServersFiltered.length, 1),
    };

    console.log(
      `🔄 Enhanced v2.0: ${allServerInstances.length}개 ServerInstance → ${validServersFiltered.length}개 검증된 Server 변환 완료`
    );
    console.log(
      `📊 요약 통계: 총 ${dashboardSummary.total}개, 온라인 ${dashboardSummary.online}개, 경고 ${dashboardSummary.warning}개, 위험 ${dashboardSummary.critical}개`
    );

    const totalServers = validServersFiltered.length;
    const totalPages = Math.ceil(totalServers / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedServers = validServersFiltered.slice(startIndex, endIndex);

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

    // 🛡️ 데이터 소스 추적
    const dataSource =
      allServerInstances.length > 0 ? 'RealServerDataGenerator' : 'initialized';

    // 응답 헤더 설정
    const responseHeaders: Record<string, string> = {
      'X-Data-Source': isMockMode ? 'mock' : 'real',
      'X-Server-Count': String(validServersFiltered.length),
    };

    if (isMockMode) {
      responseHeaders['X-Data-Fallback-Warning'] = 'true';
      responseHeaders['X-Warning-Level'] = 'CRITICAL';
    }

    // For backward compatibility, also add top-level success, data, etc.
    return NextResponse.json(
      {
        ...responseData,
        success: true,
        data: paginatedServers,
        // 🛡️ 데이터 무결성 정보 추가
        dataIntegrity: {
          dataSource,
          isMockData: isMockMode,
          environment: process.env.NODE_ENV,
          warningLevel: isMockMode ? 'CRITICAL' : 'NONE',
          serverCount: validServersFiltered.length,
          generatorStatus: generator.getRealServerMetrics().then(r => ({ status: r.success ? 'active' : 'error' })),
        },
        timestamp: Date.now(),
        count: paginatedServers.length,
      },
      {
        headers: responseHeaders,
      }
    );
  } catch (error) {
    console.error('❌ 실시간 서버 데이터 API 오류:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Internal Server Error',
        error: (error as Error).message,
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

    if (!gcpDataService) {
      gcpDataService = GCPRealDataService.getInstance();
      await gcpDataService.initialize();
    }

    switch (action) {
      case 'start':
        // 서버리스 환경에서는 자동 생성 불필요
        const startMetrics = await gcpDataService.getRealServerMetrics();
        return NextResponse.json({
          success: true,
          message: 'GCP 실제 데이터 서비스가 준비되었습니다.',
          status: { status: startMetrics.success ? 'active' : 'error' },
        });

      case 'stop':
        // 서버리스 환경에서는 중지 불필요
        return NextResponse.json({
          success: true,
          message: 'GCP 실제 데이터 서비스는 서버리스입니다 (중지 불필요).',
          status: { status: 'idle' },
        });

      case 'status':
        const statusMetrics = await gcpDataService.getRealServerMetrics();
        return NextResponse.json({
          success: true,
          status: { status: statusMetrics.success ? 'active' : 'error' },
          summary: { summary: statusMetrics.success ? 'Available' : 'Error' },
        });

      default:
        return NextResponse.json(
          { success: false, error: '지원하지 않는 액션입니다.' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('❌ 실시간 서버 데이터 POST API 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '알 수 없는 오류',
      },
      { status: 500 }
    );
  }
}
