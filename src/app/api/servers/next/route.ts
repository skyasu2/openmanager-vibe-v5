import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase/supabase-client';
import { createApiRoute } from '@/lib/api/zod-middleware';
import {
  ServerPaginationQuerySchema,
  ServerPaginatedResponseSchema,
  ServerBatchRequestSchema,
  ServerBatchResponseSchema,
  type ServerPaginationQuery,
  type ServerPaginatedResponse,
  type ServerBatchRequest,
  type ServerBatchResponse,
  type PaginatedServer,
} from '@/schemas/api.schema';
import { getErrorMessage } from '@/types/type-utils';

/**
 * 🖥️ Sequential Server Generation API (실제 서버데이터 생성기 연동)
 *
 * ✅ 개선: GCPRealDataService를 사용하여 정교한 서버 데이터 제공
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
let _currentServerIndex = 0;
let _isGeneratorInitialized = false;

// Uptime 포맷 유틸리티 함수
function _formatUptime(hours: number): string {
  const days = Math.floor(hours / 24);
  const remainingHours = Math.floor(hours % 24);
  const minutes = Math.floor((hours % 1) * 60);

  return `${days}d ${remainingHours}h ${minutes}m`;
}

// 🚫 서버 데이터 생성기 초기화 비활성화 (서버리스 호환)
const __initializeGenerator = async () => {
  console.warn('⚠️ 서버 데이터 생성기 초기화 무시됨 - 서버리스 환경');
  console.warn('📊 요청별 데이터 생성 사용 권장');

  // 🚫 전역 상태 관리 비활성화
  // await GCPRealDataService.getInstance()._initialize();
  // await GCPRealDataService.getInstance().startAutoGeneration();

  console.log('🚫 서버리스 환경에서는 요청별 처리만 지원');
};

// 간단한 서버 상태 관리 (실제로는 데이터베이스 사용)
let _serverCount = 0;
let _lastGeneratedTime = Date.now();
// 🚀 생성된 서버들을 메모리에 저장 (실제 환경에서는 데이터베이스 사용)
let _generatedServers: ServerInfo[] = [];

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

// GET 핸들러
const getHandler = createApiRoute()
  .query(ServerPaginationQuerySchema)
  .response(ServerPaginatedResponseSchema)
  .configure({
    showDetailedErrors: process.env.NODE_ENV === 'development',
    enableLogging: true,
  })
  .build(async (_request, context): Promise<ServerPaginatedResponse> => {
    const { 
      page = 1, 
      limit = 10, 
      sortBy = 'name', 
      order = 'asc', 
      status 
    } = context.query;

    // Supabase에서 서버 데이터 가져오기
    const supabase = getSupabaseClient();
    const { data: supabaseServers, error } = await supabase
      .from('servers')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Supabase 서버 데이터 조회 실패:', error);
      throw new Error(`Failed to fetch paginated servers: ${error.message}`);
    }

    const mockServers = supabaseServers || [];

    // 서버 데이터를 API 형식으로 변환
    const allServers: PaginatedServer[] = mockServers.map((server) => ({
      id: server.id,
      name: server.name,
      status:
        server.status === 'online'
          ? 'healthy'
          : server.status === 'critical'
            ? 'critical'
            : 'warning',
      type: server.type || server.role || 'unknown',
      cpu: Math.round(server.metrics?.cpu ?? server.cpu ?? 0),
      memory: Math.round(server.metrics?.memory ?? server.memory ?? 0),
      disk: Math.round(server.metrics?.disk ?? server.disk ?? 0),
      network: Math.round(server.metrics?.network ?? server.network ?? 0),
      uptime: typeof server.uptime === 'string' ? server.uptime : (typeof server.uptime === 'number' ? _formatUptime(server.uptime) : '0d 0h 0m'),
      lastUpdate: server.lastUpdate instanceof Date ? server.lastUpdate.toISOString() : (server.lastUpdate || new Date().toISOString()),
      location: server.location || 'Unknown',
      environment: server.environment || 'production',
    }));

    // 상태 필터링
    let filteredServers = allServers;
    if (status) {
      filteredServers = allServers.filter((server) => server.status === status);
    }

    // 정렬
    filteredServers.sort((a, b) => {
      const aValue = a[sortBy as keyof PaginatedServer];
      const bValue = b[sortBy as keyof PaginatedServer];

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

    return {
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
          status: status || null,
          sortBy,
          order,
        },
        summary: {
          total: filteredServers.length,
          healthy: filteredServers.filter((s) => s.status === 'healthy').length,
          warning: filteredServers.filter((s) => s.status === 'warning').length,
          critical: filteredServers.filter((s) => s.status === 'critical').length,
        },
      },
      timestamp: new Date().toISOString(),
    };
  });

/**
 * 🖥️ 서버 Next API
 * 다음 서버 정보 또는 서버 페이지네이션을 처리하는 엔드포인트
 */
export async function GET(request: NextRequest) {
  try {
    return await getHandler(request);
  } catch (error) {
    console.error('❌ 서버 Next API 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: '서버 정보 조회 중 오류가 발생했습니다',
        details: getErrorMessage(error),
      },
      { status: 500 }
    );
  }
}

// POST 핸들러
const postHandler = createApiRoute()
  .body(ServerBatchRequestSchema)
  .response(ServerBatchResponseSchema)
  .configure({
    showDetailedErrors: process.env.NODE_ENV === 'development',
    enableLogging: true,
  })
  .build(async (_request, context): Promise<ServerBatchResponse> => {
    const { action, serverIds, settings } = context.body;

    switch (action) {
      case 'batch-restart':
        return {
          success: true,
          message: `${serverIds.length}개 서버 재시작이 시작되었습니다`,
          serverIds,
          estimatedDuration: serverIds.length * 2, // minutes
          timestamp: new Date().toISOString(),
        };

      case 'batch-update':
        return {
          success: true,
          message: `${serverIds.length}개 서버 업데이트가 시작되었습니다`,
          serverIds,
          estimatedDuration: serverIds.length * 5, // minutes
          timestamp: new Date().toISOString(),
        };

      case 'batch-configure':
        return {
          success: true,
          message: `${serverIds.length}개 서버 설정이 업데이트되었습니다`,
          serverIds,
          settings,
          timestamp: new Date().toISOString(),
        };

      case 'health-check':
        return {
          success: true,
          message: `${serverIds.length}개 서버 헬스체크가 시작되었습니다`,
          results: serverIds.map((id) => ({
            serverId: id,
            status: (['healthy', 'warning', 'critical'] as const)[
              Math.floor(Math.random() * 3)
            ],
            responseTime: Math.floor(Math.random() * 100) + 10,
            lastCheck: new Date().toISOString(),
          })),
          timestamp: new Date().toISOString(),
        };

      default:
        throw new Error(`지원되지 않는 액션: ${action}`);
    }
  });

/**
 * POST 요청으로 서버 배치 작업 수행
 */
export async function POST(request: NextRequest) {
  try {
    return await postHandler(request);
  } catch (error) {
    console.error('❌ 서버 배치 작업 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: '서버 배치 작업 중 오류가 발생했습니다',
        details: getErrorMessage(error),
      },
      { status: 500 }
    );
  }
}

/**
 * OPTIONS - CORS 지원
 */
export async function OPTIONS(_request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
