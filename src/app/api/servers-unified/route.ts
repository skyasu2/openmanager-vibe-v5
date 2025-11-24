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
import { getSupabaseClient } from '@/lib/supabase/client';
import fs from 'fs/promises';
import path from 'path';

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

// 🗂️ 파일 캐시 시스템
interface FileCache {
  data: HourlyServerData;
  timestamp: number;
  hour: number;
}

const fileCache = new Map<string, FileCache>();
const FILE_CACHE_TTL = 60000; // 1분 캐시

/**
 * 🚀 캐시된 시간별 파일 읽기
 */
async function readCachedHourlyFile(hour: number): Promise<HourlyServerData> {
  const cacheKey = hour.toString().padStart(2, '0');
  const cached = fileCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < FILE_CACHE_TTL) {
    debug.log(`🎯 파일 캐시 히트: ${hour}시 데이터`);
    return cached.data;
  }

  const filePath = path.join(
    process.cwd(),
    'public',
    'server-scenarios',
    'hourly-metrics',
    `${cacheKey}.json`
  );

  try {
    const rawData = await fs.readFile(filePath, 'utf8');
    const hourlyData = JSON.parse(rawData);

    fileCache.set(cacheKey, {
      data: hourlyData,
      timestamp: Date.now(),
      hour,
    });

    debug.log(`✅ 파일 읽기 완료: ${hour}시 데이터`);
    return hourlyData;
  } catch {
    console.error(`❌ 시간별 데이터 파일 오류: ${filePath}`);
    throw new Error(`시간별 데이터 파일 누락: ${cacheKey}.json`);
  }
}

/**
 * 🔄 시간별 시나리오 데이터 로드
 */
async function loadHourlyScenarioData(): Promise<EnhancedServerMetrics[]> {
  try {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentSecond = now.getSeconds();

    const segmentInHour = Math.floor((currentMinute * 60 + currentSecond) / 30);
    const rotationMinute = segmentInHour % 60;

    debug.log(
      `🕒 시간별 데이터 회전: ${currentHour}:${currentMinute.toString().padStart(2, '0')}`
    );

    const hourlyData = await readCachedHourlyFile(currentHour);
    return convertToEnhancedMetrics(hourlyData, currentHour, rotationMinute);
  } catch (error) {
    console.error('❌ 시간별 데이터 로드 실패:', error);
    return generateFallbackServers();
  }
}

/**
 * 🎯 Enhanced 메트릭으로 변환
 */
function convertToEnhancedMetrics(
  hourlyData: HourlyServerData,
  currentHour: number,
  rotationMinute: number
): EnhancedServerMetrics[] {
  const servers = hourlyData.servers || {};

  // 10개 서버 보장
  if (Object.keys(servers).length < 10) {
    const missingCount = 10 - Object.keys(servers).length;
    for (let i = 0; i < missingCount; i++) {
      const serverIndex = Object.keys(servers).length + i + 1;
      const serverTypes = ['security', 'backup', 'proxy', 'gateway'];
      const serverType = serverTypes[i % serverTypes.length] ?? 'gateway';
      const serverId = `${serverType}-server-${serverIndex}`;

      servers[serverId] = {
        id: serverId,
        name: `${serverType.charAt(0).toUpperCase() + serverType.slice(1)} Server #${serverIndex}`,
        hostname: `${serverType}-${serverIndex.toString().padStart(2, '0')}.prod.example.com`,
        status: 'online',
        type: serverType,
        service: `${serverType} Service`,
        location: 'us-east-1a',
        environment: 'production',
        provider: 'Auto-Generated',
        uptime: 2592000 + Math.floor(Math.random() * 86400),
        cpu: Math.floor(15 + Math.random() * 20),
        memory: Math.floor(20 + Math.random() * 30),
        disk: Math.floor(25 + Math.random() * 40),
        network: Math.floor(5 + Math.random() * 25),
        specs: { cpu_cores: 4, memory_gb: 8, disk_gb: 200 },
      };
    }
  }

  return Object.values(servers).map((serverData: RawServerData, index) => {
    const minuteFactor = rotationMinute / 59;
    const fixedOffset = Math.sin(minuteFactor * 2 * Math.PI) * 2;
    const serverOffset = (index * 3.7) % 10;
    const fixedVariation = 1 + (fixedOffset + serverOffset) / 100;

    return {
      id: serverData.id || `server-${index}`,
      name: serverData.name || `Server ${index + 1}`,
      hostname: serverData.hostname || `server-${index}`,
      status: serverData.status || 'online',
      cpu: Math.round((serverData.cpu || 0) * fixedVariation),
      cpu_usage: Math.round((serverData.cpu || 0) * fixedVariation),
      memory: Math.round((serverData.memory || 0) * fixedVariation),
      memory_usage: Math.round((serverData.memory || 0) * fixedVariation),
      disk: Math.round((serverData.disk || 0) * fixedVariation),
      disk_usage: Math.round((serverData.disk || 0) * fixedVariation),
      network: Math.round((serverData.network || 20) * fixedVariation),
      network_in: Math.round((serverData.network || 20) * 0.6 * fixedVariation),
      network_out: Math.round(
        (serverData.network || 20) * 0.4 * fixedVariation
      ),
      uptime: serverData.uptime || 86400,
      responseTime: Math.round(
        (serverData.responseTime || 200) * fixedVariation
      ),
      last_updated: new Date().toISOString(),
      location: serverData.location || 'Seoul',
      alerts: [],
      ip: serverData.ip || `192.168.1.${100 + index}`,
      os: serverData.os || 'Ubuntu 22.04 LTS',
      type: serverData.type || 'web',
      role: serverData.role || serverData.type || 'worker',
      environment: serverData.environment || 'production',
      provider: `DataCenter-${currentHour.toString().padStart(2, '0')}${rotationMinute.toString().padStart(2, '0')}`,
      specs: {
        cpu_cores: serverData.specs?.cpu_cores || 4,
        memory_gb: serverData.specs?.memory_gb || 8,
        disk_gb: serverData.specs?.disk_gb || 200,
        network_speed: '1Gbps',
      },
      lastUpdate: new Date().toISOString(),
      services: serverData.services || [],
      systemInfo: {
        os: serverData.os || 'Ubuntu 22.04 LTS',
        uptime: Math.floor((serverData.uptime || 86400) / 3600) + 'h',
        processes: (serverData.processes || 120) + Math.floor(serverOffset),
        zombieProcesses:
          serverData.status === 'critical'
            ? 3
            : serverData.status === 'warning'
              ? 1
              : 0,
        loadAverage: `${(((serverData.cpu || 0) * fixedVariation) / 20).toFixed(2)}`,
        lastUpdate: new Date().toISOString(),
      },
      networkInfo: {
        interface: 'eth0',
        receivedBytes: `${((serverData.network || 20) * 0.6 * fixedVariation).toFixed(1)} MB`,
        sentBytes: `${((serverData.network || 20) * 0.4 * fixedVariation).toFixed(1)} MB`,
        receivedErrors:
          serverData.status === 'critical'
            ? Math.floor(serverOffset % 5) + 1
            : 0,
        sentErrors:
          serverData.status === 'critical'
            ? Math.floor(serverOffset % 3) + 1
            : 0,
        status: serverData.status, // 🔧 수정: 직접 사용 (타입 통합 완료)
      },
    } as EnhancedServerMetrics;
  });
}

/**
 * 🔄 폴백 서버 데이터 생성
 */
function generateFallbackServers(): EnhancedServerMetrics[] {
  return Array.from({ length: 10 }, (_, index) => ({
    id: `fallback-${index + 1}`,
    name: `Fallback Server ${index + 1}`,
    hostname: `fallback-${index + 1}`,
    status: 'warning' as const,
    cpu: 45 + Math.floor(Math.random() * 20),
    cpu_usage: 45 + Math.floor(Math.random() * 20),
    memory: 60 + Math.floor(Math.random() * 15),
    memory_usage: 60 + Math.floor(Math.random() * 15),
    disk: 25 + Math.floor(Math.random() * 30),
    disk_usage: 25 + Math.floor(Math.random() * 30),
    network: 30 + Math.floor(Math.random() * 20),
    network_in: 18 + Math.floor(Math.random() * 12),
    network_out: 12 + Math.floor(Math.random() * 8),
    uptime: 99900 + Math.floor(Math.random() * 100),
    responseTime: 200 + Math.floor(Math.random() * 100),
    last_updated: new Date().toISOString(),
    location: 'Seoul',
    alerts: [],
    ip: `192.168.1.${100 + index}`,
    os: 'Ubuntu 22.04 LTS',
    type: (['web', 'api', 'database', 'cache'][index % 4] ||
      'web') as ServerRole,
    role: 'fallback',
    environment: 'production',
    provider: 'Fallback-System',
    specs: {
      cpu_cores: 4,
      memory_gb: 8,
      disk_gb: 200,
      network_speed: '1Gbps',
    },
    lastUpdate: new Date().toISOString(),
    services: [],
    systemInfo: {
      os: 'Ubuntu 22.04 LTS',
      uptime: '24h',
      processes: 120 + index * 10,
      zombieProcesses: 0,
      loadAverage: '1.5',
      lastUpdate: new Date().toISOString(),
    },
    networkInfo: {
      interface: 'eth0',
      receivedBytes: '15.5 MB',
      sentBytes: '8.2 MB',
      receivedErrors: 0,
      sentErrors: 0,
      status: 'online', // 🔧 수정: 'healthy' → 'online' (ServerStatus 타입)
    },
  }));
}

/**
 * 🎯 실시간 서버 데이터 (Supabase 연동)
 */
async function getRealtimeServers(): Promise<EnhancedServerMetrics[]> {
  try {
    const supabase = getSupabaseClient();
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
          role: (server.role ?? 'web') as ServerRole,
          environment: (server.environment ??
            'production') as ServerEnvironment,
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
    return await loadHourlyScenarioData();
  }
}

/**
 * 🔍 특정 서버 상세 정보
 */
async function getServerDetail(
  serverId: string
): Promise<EnhancedServerMetrics | null> {
  const servers = await loadHourlyScenarioData();
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
        servers = enableRealtime
          ? await getRealtimeServers()
          : await loadHourlyScenarioData();
        break;

      case 'cached':
        servers = await loadHourlyScenarioData();
        additionalData.cacheInfo = {
          cached: true,
          cacheTime: new Date().toISOString(),
          source: 'hourly-json-files',
        };
        break;

      case 'mock':
        servers = generateFallbackServers();
        additionalData.mockInfo = {
          generated: true,
          serverCount: servers.length,
          source: 'mock-generator',
        };
        break;

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
      data:
        action === 'detail' || action === 'processes'
          ? null
          : generateFallbackServers().slice(0, limit),
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
