/**
 * 🎯 통합 서버 관리 API (8개 API 통합)
 *
 * 통합된 기능:
 * - /api/servers (기본 서버 목록)
 * - /api/servers/all (전체 서버 데이터)
 * - /api/servers/cached (캐시된 서버 데이터)
 * - /api/servers/mock (목업 서버 데이터)
 * - /api/servers/next (다음 서버 데이터)
 * - /api/servers/realtime (실시간 서버 데이터)
 * - /api/servers/[id] (특정 서버 상세)
 * - /api/servers/[id]/processes (서버 프로세스 목록)
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createApiRoute } from '@/lib/api/zod-middleware';
import debug from '@/utils/debug';
import type {
  EnhancedServerMetrics,
  ServerStatus,
  ServerEnvironment,
  ServerRole,
} from '@/types/server';
import type { HourlyServerData, RawServerData } from '@/types/server-metrics';
import { getUnifiedServerDataSource } from '@/services/data/UnifiedServerDataSource';
import { createClient } from '@/lib/supabase/server';
import fs from 'fs/promises';
import path from 'path';
import { mapServerToEnhanced } from '@/utils/serverUtils';

/**
 * Supabase server_metrics 테이블 스키마 (snake_case)
 */
interface SupabaseServerMetrics {
  id?: string;
  name?: string;
  hostname?: string;
  status?: ServerStatus;
  cpu_usage?: number;
  memory_usage?: number;
  disk_usage?: number;
  network_usage?: number;
  uptime?: number;
  response_time?: number;
  updated_at?: string;
  location?: string;
  ip_address?: string;
  os?: string;
  server_type?: string;
  role?: ServerRole;
  environment?: ServerEnvironment;
  provider?: string;
  cpu_cores?: number;
  memory_gb?: number;
  disk_gb?: number;
  processes?: number;
  [key: string]: unknown;
}

// 📝 통합 요청 스키마
const serversUnifiedRequestSchema = z.object({
  action: z.enum([
    'list', // 기본 서버 목록 (기존 /api/servers/all)
    'cached', // 캐시된 서버 데이터
    'mock', // 목업 서버 데이터
    'realtime', // 실시간 서버 데이터
    'detail', // 특정 서버 상세
    'processes', // 서버 프로세스 목록
  ]),
  serverId: z.string().optional(), // detail, processes 액션용

  // 페이지네이션 & 필터링
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(10),
  search: z.string().optional(),
  sortBy: z
    .enum(['name', 'cpu', 'memory', 'disk', 'network', 'uptime'])
    .default('name'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),

  // 실시간 특화 옵션
  enableRealtime: z.boolean().default(false),
  includeProcesses: z.boolean().default(false),
  includeMetrics: z.boolean().default(true),
});

type ServersUnifiedRequest = z.infer<typeof serversUnifiedRequestSchema>;

/**
 * 🎯 실시간 서버 데이터 (Supabase 연동)
 */
async function getRealtimeServers(): Promise<EnhancedServerMetrics[]> {
  try {
    const supabase = await createClient();
    const { data: servers, error } = await supabase
      .from('server_metrics')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) throw error;

    return (
      servers?.map(
        (server: SupabaseServerMetrics): EnhancedServerMetrics => ({
          id: server.id ?? '',
          name: server.name || server.hostname || 'Unknown',
          hostname: server.hostname ?? '',
          status: server.status ?? 'offline',
          cpu: server.cpu_usage,
          cpu_usage: server.cpu_usage ?? 0,
          memory: server.memory_usage,
          memory_usage: server.memory_usage ?? 0,
          disk: server.disk_usage,
          disk_usage: server.disk_usage ?? 0,
          network: server.network_usage ?? 0,
          network_in: (server.network_usage ?? 0) * 0.6,
          network_out: (server.network_usage ?? 0) * 0.4,
          uptime: server.uptime ?? 0,
          responseTime: server.response_time ?? 0,
          last_updated: server.updated_at ?? new Date().toISOString(),
          location: server.location ?? 'Seoul',
          alerts: [],
          ip: server.ip_address,
          os: server.os ?? 'Ubuntu 22.04 LTS',
          role: (server.role ?? 'web'),
          environment: (server.environment ??
            'production'),
          provider: server.provider,
          specs: {
            cpu_cores: server.cpu_cores ?? 4,
            memory_gb: server.memory_gb ?? 8,
            disk_gb: server.disk_gb ?? 200,
            network_speed: '1Gbps',
          },
          lastUpdate: server.updated_at,
          services: [],
          systemInfo: {
            os: server.os ?? 'Ubuntu 22.04 LTS',
            uptime: Math.floor((server.uptime ?? 0) / 3600) + 'h',
            processes: server.processes ?? 120,
            zombieProcesses: 0,
            loadAverage: `${((server.cpu_usage ?? 0) / 20).toFixed(2)}`,
            lastUpdate: server.updated_at ?? new Date().toISOString(),
          },
          networkInfo: {
            interface: 'eth0',
            receivedBytes: `${((server.network_usage || 0) * 0.6).toFixed(1)} MB`,
            sentBytes: `${((server.network_usage || 0) * 0.4).toFixed(1)} MB`,
            receivedErrors: 0,
            sentErrors: 0,
            status: 'online', // 🔧 수정: 'healthy' → 'online' (ServerStatus 타입)
          },
        })
      ) || []
    );
  } catch (error) {
    console.error('❌ Supabase 실시간 데이터 오류:', error);
    // Fallback to UnifiedServerDataSource
    const dataSource = getUnifiedServerDataSource();
    const rawServers = await dataSource.getServers();
    return rawServers.map(mapServerToEnhanced);
  }
}

/**
 * 🔍 특정 서버 상세 정보
 */
/**
 * 🔍 특정 서버 상세 정보
 */
async function getServerDetail(
  serverId: string
): Promise<EnhancedServerMetrics | null> {
  const dataSource = getUnifiedServerDataSource();
  const rawServers = await dataSource.getServers();
  const servers = rawServers.map(mapServerToEnhanced);
  return servers.find((server) => server.id === serverId) || null;
}

/**
 * ⚙️ 서버 프로세스 목록
 */
async function getServerProcesses(serverId: string) {
  const server = await getServerDetail(serverId);
  if (!server) return null;

  // 현실적인 프로세스 목록 생성
  const processes = [
    { pid: 1, name: 'systemd', cpu: 0.1, memory: 0.2, status: 'running' },
    { pid: 2, name: 'kthreadd', cpu: 0.0, memory: 0.0, status: 'running' },
    { pid: 123, name: 'nginx', cpu: 2.5, memory: 1.2, status: 'running' },
    { pid: 456, name: 'node', cpu: 15.3, memory: 8.7, status: 'running' },
    { pid: 789, name: 'postgres', cpu: 5.2, memory: 12.1, status: 'running' },
    {
      pid: 1012,
      name: 'redis-server',
      cpu: 1.8,
      memory: 2.3,
      status: 'running',
    },
    { pid: 1345, name: 'docker', cpu: 3.1, memory: 4.5, status: 'running' },
    { pid: 1678, name: 'ssh', cpu: 0.1, memory: 0.3, status: 'running' },
  ];

  return {
    serverId,
    serverName: server.name,
    totalProcesses: processes.length,
    runningProcesses: processes.filter((p) => p.status === 'running').length,
    processes: processes.map((proc) => ({
      ...proc,
      cpu: proc.cpu * (1 + (Math.random() - 0.5) * 0.2), // ±10% 변동
      memory: proc.memory * (1 + (Math.random() - 0.5) * 0.1), // ±5% 변동
    })),
    lastUpdate: new Date().toISOString(),
  };
}

/**
 * 📊 데이터 필터링 및 정렬
 */
function filterAndSortServers(
  servers: EnhancedServerMetrics[],
  search?: string,
  sortBy: string = 'name',
  sortOrder: 'asc' | 'desc' = 'asc'
): EnhancedServerMetrics[] {
  let filtered = servers;

  // 검색 필터 적용
  if (search) {
    const searchLower = search.toLowerCase();
    filtered = servers.filter(
      (server) =>
        server.name.toLowerCase().includes(searchLower) ||
        server.hostname.toLowerCase().includes(searchLower) ||
        server.status.toLowerCase().includes(searchLower) ||
        (server.type?.toLowerCase() || '').includes(searchLower)
    );
  }

  // 정렬 적용
  filtered.sort((a, b) => {
    const dir = sortOrder === 'asc' ? 1 : -1;
    switch (sortBy) {
      case 'cpu':
        return (a.cpu_usage - b.cpu_usage) * dir;
      case 'memory':
        return (a.memory_usage - b.memory_usage) * dir;
      case 'disk':
        return (a.disk_usage - b.disk_usage) * dir;
      case 'network':
        return ((a.network || 0) - (b.network || 0)) * dir;
      case 'uptime':
        return (a.uptime - b.uptime) * dir;
      default:
        return a.name.localeCompare(b.name) * dir;
    }
  });

  return filtered;
}

/**
 * 🎯 메인 핸들러
 */
async function handleServersUnified(
  request: NextRequest,
  context: {
    body: {
      action: ServersUnifiedRequest['action'];
      serverId?: string;
      page?: number;
      limit?: number;
      search?: string;
      sortBy?: ServersUnifiedRequest['sortBy'];
      sortOrder?: ServersUnifiedRequest['sortOrder'];
      enableRealtime?: boolean;
      includeProcesses?: boolean;
      includeMetrics?: boolean;
    };
    query: unknown;
    params: Record<string, string>;
  }
): Promise<unknown> {
  const {
    action,
    serverId,
    page = 1,
    limit = 10,
    search,
    sortBy = 'name',
    sortOrder = 'asc',
    enableRealtime = false,
  } = context.body;

  try {
    debug.log(`🎯 통합 서버 API - 액션: ${action}`, { serverId, page, limit });

    let servers: EnhancedServerMetrics[] = [];
    const additionalData: Record<string, unknown> = {};

    // 액션별 데이터 처리
    switch (action) {
      case 'list':
        if (enableRealtime) {
          servers = await getRealtimeServers();
        } else {
          const dataSource = getUnifiedServerDataSource();
          const rawServers = await dataSource.getServers();
          servers = rawServers.map(mapServerToEnhanced);
        }
        break;

      case 'cached': {
        // UnifiedServerDataSource handles caching internally
        const cachedDataSource = getUnifiedServerDataSource();
        const rawCachedServers = await cachedDataSource.getServers();
        servers = rawCachedServers.map(mapServerToEnhanced);
        additionalData.cacheInfo = {
          cached: true,
          cacheTime: new Date().toISOString(),
          source: 'unified-data-source',
        };
        break;
      }

      case 'mock': {
        // Mock data is also served by UnifiedServerDataSource (configured as 'custom' or 'basic')
        const mockDataSource = getUnifiedServerDataSource();
        const rawMockServers = await mockDataSource.getServers();
        servers = rawMockServers.map(mapServerToEnhanced);
        additionalData.mockInfo = {
          generated: true,
          serverCount: servers.length,
          source: 'unified-data-source',
        };
        break;
      }

      case 'realtime':
        servers = await getRealtimeServers();
        additionalData.realtimeInfo = {
          realtime: true,
          source: 'supabase-realtime',
          updateFrequency: '30s',
        };
        break;

      case 'detail': {
        if (!serverId) {
          return {
            success: false,
            error: 'serverId required for detail action',
          };
        }
        const serverDetail = await getServerDetail(serverId);
        if (!serverDetail) {
          return { success: false, error: 'Server not found' };
        }
        return {
          success: true,
          data: serverDetail,
          action: 'detail',
          serverId,
        };
      }

      case 'processes': {
        if (!serverId) {
          return {
            success: false,
            error: 'serverId required for processes action',
          };
        }
        const processData = await getServerProcesses(serverId);
        if (!processData) {
          return { success: false, error: 'Server not found' };
        }
        return {
          success: true,
          data: processData,
          action: 'processes',
          serverId,
        };
      }

      default:
        throw new Error(`Unknown action: ${action as string}`);
    }

    // 필터링 및 정렬
    const filteredServers = filterAndSortServers(
      servers,
      search,
      sortBy,
      sortOrder
    );

    // 페이지네이션 적용
    const total = filteredServers.length;
    const startIndex = (page - 1) * limit;
    const paginatedServers = filteredServers.slice(
      startIndex,
      startIndex + limit
    );

    // 서버 상태 요약
    const statusSummary = filteredServers.reduce(
      (acc, server) => {
        acc[server.status] = (acc[server.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    debug.log(`✅ 통합 서버 API 응답: ${paginatedServers.length}개 서버`);

    return {
      success: true,
      action,
      data: paginatedServers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: startIndex + limit < total,
        hasPrev: page > 1,
      },
      summary: {
        total: filteredServers.length,
        statusSummary,
        ...additionalData,
      },
      metadata: {
        action,
        serverId,
        serverCount: paginatedServers.length,
        totalServers: total,
        dataSource: enableRealtime ? 'supabase-realtime' : 'hourly-scenarios',
        unifiedApi: true,
        systemVersion: 'servers-unified-v1.0',
      },
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error(`❌ 통합 서버 API 오류 (${action}):`, error);

    return {
      success: false,
      action,
      error: error instanceof Error ? error.message : 'Unknown error',
      fallback: true,
      data: [],
      timestamp: new Date().toISOString(),
    };
  }
}

// 🚀 API 라우트 내보내기
export const POST = createApiRoute()
  .body(serversUnifiedRequestSchema)
  .configure({
    showDetailedErrors: process.env.NODE_ENV === 'development',
    enableLogging: true,
  })
  .build(handleServersUnified);

// 호환성을 위한 GET 메서드 (기본 list 액션)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const defaultRequest: ServersUnifiedRequest = {
    action: 'list',
    page: parseInt(searchParams.get('page') || '1', 10),
    limit: parseInt(searchParams.get('limit') || '10', 10),
    search: searchParams.get('search') || undefined,
    sortBy:
      (searchParams.get('sortBy') as ServersUnifiedRequest['sortBy']) || 'name',
    sortOrder:
      (searchParams.get('sortOrder') as ServersUnifiedRequest['sortOrder']) ||
      'asc',
    enableRealtime: searchParams.get('realtime') === 'true',
    includeProcesses: false,
    includeMetrics: true,
  };

  return NextResponse.json(
    await handleServersUnified(request, {
      body: defaultRequest,
      query: {},
      params: {},
    })
  );
}

export const dynamic = 'force-dynamic';
