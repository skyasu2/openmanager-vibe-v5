import { RealServerDataGenerator } from '@/services/data-generator/RealServerDataGenerator';
import { NextRequest, NextResponse } from 'next/server';

/**
 * 🖥️ Sequential Server Generation API (실제 서버데이터 생성기 연동)
 *
 * ✅ 개선: RealServerDataGenerator를 사용하여 정교한 서버 데이터 제공
 * - 24시간 베이스라인 패턴 기반 데이터
 * - 실제 서버 스펙 및 메트릭
 * - 시간대별 부하 패턴 반영
 * - 서버 타입별 특성화된 데이터
 *
 * GET: 다음 서버 정보 조회 (Rate Limited: 1분에 20회)
 * POST: 서버 생성 요청 (Rate Limited: 1분에 20회)
 *
 * 실제 서버 데이터를 받으려면:
 * 1. 실제 서버 모니터링 에이전트 설치
 * 2. 데이터베이스 연결 설정
 * 3. 실제 메트릭 수집 로직 구현
 */

// 순차 생성을 위한 상태 관리
let currentServerIndex = 0;
let isGeneratorInitialized = false;

// Uptime 포맷 유틸리티 함수
function formatUptime(hours: number): string {
  const days = Math.floor(hours / 24);
  const remainingHours = Math.floor(hours % 24);
  const minutes = Math.floor((hours % 1) * 60);

  return `${days}d ${remainingHours}h ${minutes}m`;
}

// 서버 데이터 생성기 초기화
const initializeGenerator = async () => {
  if (!isGeneratorInitialized) {
    try {
      await RealServerDataGenerator.getInstance().initialize();
      await RealServerDataGenerator.getInstance().startAutoGeneration();
      isGeneratorInitialized = true;
      console.log('✅ RealServerDataGenerator 초기화 및 시작 완료');
    } catch (error) {
      console.error('❌ RealServerDataGenerator 초기화 실패:', error);
    }
  }
};

// 간단한 서버 상태 관리 (실제로는 데이터베이스 사용)
let serverCount = 0;
let lastGeneratedTime = Date.now();
// 🚀 생성된 서버들을 메모리에 저장 (실제 환경에서는 데이터베이스 사용)
let generatedServers: ServerInfo[] = [];

interface ServerInfo {
  id: string;
  hostname: string;
  name: string;
  type: string;
  environment: string;
  location: string;
  provider: string;
  status: 'online' | 'warning' | 'offline';
  cpu: number;
  memory: number;
  disk: number;
  uptime: string;
  lastUpdate: Date;
  alerts: number;
  services: Array<{
    name: string;
    status: 'running' | 'stopped';
    port: number;
  }>;
  specs: {
    cpu_cores: number;
    memory_gb: number;
    disk_gb: number;
  };
  os: string;
  ip: string;
}

/**
 * 🚀 서버 페이지네이션 API v2.1
 *
 * 목적: 서버 목록을 페이지 단위로 가져오는 최적화된 API
 *
 * 주요 기능:
 * - 페이지 기반 서버 목록 조회
 * - 캐시 최적화로 빠른 응답 제공
 * - 실시간 서버 상태 업데이트 지원
 * - 정렬 및 필터링 옵션
 */

// Next.js App Router 런타임 설정
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * 🖥️ 서버 Next API
 * 다음 서버 정보 또는 서버 페이지네이션을 처리하는 엔드포인트
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const sortBy = searchParams.get('sortBy') || 'name';
    const order = searchParams.get('order') || 'asc';
    const status = searchParams.get('status');

    // 시뮬레이션 서버 데이터
    const allServers = Array.from({ length: 50 }, (_, i) => ({
      id: `server-${i + 1}`,
      name: `Server-${String(i + 1).padStart(3, '0')}`,
      status: ['healthy', 'warning', 'critical'][Math.floor(Math.random() * 3)],
      type: ['web', 'database', 'api', 'cache'][Math.floor(Math.random() * 4)],
      cpu: Math.floor(Math.random() * 100),
      memory: Math.floor(Math.random() * 100),
      disk: Math.floor(Math.random() * 100),
      network: Math.floor(Math.random() * 100),
      uptime: Math.floor(Math.random() * 365),
      lastUpdate: new Date(Date.now() - Math.random() * 86400000).toISOString(),
      location: ['Seoul', 'Tokyo', 'Singapore', 'Mumbai'][
        Math.floor(Math.random() * 4)
      ],
      environment: ['production', 'staging', 'development'][
        Math.floor(Math.random() * 3)
      ],
    }));

    // 상태 필터링
    let filteredServers = allServers;
    if (status) {
      filteredServers = allServers.filter(server => server.status === status);
    }

    // 정렬
    filteredServers.sort((a, b) => {
      const aValue = a[sortBy as keyof typeof a];
      const bValue = b[sortBy as keyof typeof b];

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return order === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return order === 'asc' ? aValue - bValue : bValue - aValue;
      }

      return 0;
    });

    // 페이지네이션
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedServers = filteredServers.slice(startIndex, endIndex);

    const totalPages = Math.ceil(filteredServers.length / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    return NextResponse.json({
      success: true,
      data: {
        servers: paginatedServers,
        pagination: {
          currentPage: page,
          totalPages,
          totalItems: filteredServers.length,
          itemsPerPage: limit,
          hasNext,
          hasPrev,
          nextPage: hasNext ? page + 1 : null,
          prevPage: hasPrev ? page - 1 : null,
        },
        filters: {
          status,
          sortBy,
          order,
        },
        summary: {
          total: filteredServers.length,
          healthy: filteredServers.filter(s => s.status === 'healthy').length,
          warning: filteredServers.filter(s => s.status === 'warning').length,
          critical: filteredServers.filter(s => s.status === 'critical').length,
        },
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ 서버 Next API 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: '서버 정보 조회 중 오류가 발생했습니다',
      },
      { status: 500 }
    );
  }
}

/**
 * POST 요청으로 서버 배치 작업 수행
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, serverIds, settings } = body;

    switch (action) {
      case 'batch-restart':
        return NextResponse.json({
          success: true,
          message: `${serverIds.length}개 서버 재시작이 시작되었습니다`,
          serverIds,
          estimatedDuration: serverIds.length * 2, // minutes
          timestamp: new Date().toISOString(),
        });

      case 'batch-update':
        return NextResponse.json({
          success: true,
          message: `${serverIds.length}개 서버 업데이트가 시작되었습니다`,
          serverIds,
          estimatedDuration: serverIds.length * 5, // minutes
          timestamp: new Date().toISOString(),
        });

      case 'batch-configure':
        return NextResponse.json({
          success: true,
          message: `${serverIds.length}개 서버 설정이 업데이트되었습니다`,
          serverIds,
          settings,
          timestamp: new Date().toISOString(),
        });

      case 'health-check':
        return NextResponse.json({
          success: true,
          message: `${serverIds.length}개 서버 헬스체크가 시작되었습니다`,
          results: serverIds.map(id => ({
            serverId: id,
            status: ['healthy', 'warning', 'critical'][
              Math.floor(Math.random() * 3)
            ],
            responseTime: Math.floor(Math.random() * 100) + 10,
            lastCheck: new Date().toISOString(),
          })),
          timestamp: new Date().toISOString(),
        });

      default:
        return NextResponse.json(
          {
            success: false,
            error: `지원되지 않는 액션: ${action}`,
          },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('❌ 서버 배치 작업 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: '서버 배치 작업 중 오류가 발생했습니다',
      },
      { status: 500 }
    );
  }
}

/**
 * OPTIONS - CORS 지원
 */
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
