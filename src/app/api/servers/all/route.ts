import { NextRequest, NextResponse } from 'next/server';
import { getServersFromGCPVM } from '@/lib/gcp-vm-client';
import type { EnhancedServerMetrics } from '@/types/server';
// TODO: 누락된 모듈들 - 추후 구현 필요
// import { createServerSideAction } from '@/core/security/server-side-action';
// import { createSystemMetricsAnalytics } from '@/lib/analytics/system-metrics-analytics';

interface ServerMetrics {
  name: string;
  cpu: number;
  memory: number;
  disk: number;
  network?: number; // 선택적 속성으로 명시
  uptime: number;
  status: 'online' | 'offline' | 'warning' | 'critical';
}

// 타입 가드 함수 추가 (Codex 제안)
const ensureNumber = (value: number | undefined, fallback: number = 0): number => {
  return typeof value === 'number' && !isNaN(value) ? value : fallback;
};

// 정렬 키 타입 정의 강화
type SortableKey = keyof Pick<ServerMetrics, 'cpu' | 'memory' | 'disk' | 'network' | 'uptime' | 'name'>;

/**
 * 폴백용 목업 데이터 생성 함수 (API 라우트 전용)
 * GCP VM 연결 실패 시 사용 - GCP VM 클라이언트와 일관성 유지
 */
function generateMockServers(): EnhancedServerMetrics[] {
  const timestamp = new Date().toISOString();
  return [
    // 웹 서버 (1개) - 간소화된 API 라우트 폴백
    {
      id: 'api-mock-web-01',
      name: 'web-server-01',
      hostname: 'web-server-01',
      status: 'online' as const,
      cpu: 45.2,
      cpu_usage: 45.2,
      memory: 78.5,
      memory_usage: 78.5,
      disk: 65.1,
      disk_usage: 65.1,
      network: 12.3,
      network_in: 7.4,
      network_out: 4.9,
      uptime: 359280,
      location: 'Seoul-DC-01',
      alerts: 0,
      ip: '192.168.1.100',
      os: 'Ubuntu 22.04 LTS',
      type: 'web',
      role: 'worker',
      environment: 'production',
      provider: 'API-Route-Mock-Fallback',
      specs: {
        cpu_cores: 2,
        memory_gb: 8,
        disk_gb: 260,
        network_speed: '1Gbps'
      },
      lastUpdate: timestamp,
      services: [],
      systemInfo: {
        os: 'Ubuntu 22.04 LTS',
        uptime: '99h',
        processes: 120,
        zombieProcesses: 0,
        loadAverage: '1.80, 1.75, 1.70',
        lastUpdate: timestamp
      },
      networkInfo: {
        interface: 'eth0',
        receivedBytes: '7 MB',
        sentBytes: '4 MB',
        receivedErrors: 0,
        sentErrors: 0,
        status: 'healthy'
      }
    },
    // API 서버 (1개)
    {
      id: 'api-mock-api-01',
      name: 'api-server-01',
      hostname: 'api-server-01',
      status: 'warning' as const,
      cpu: 78.4,
      cpu_usage: 78.4,
      memory: 85.1,
      memory_usage: 85.1,
      disk: 72.3,
      disk_usage: 72.3,
      network: 25.8,
      network_in: 15.2,
      network_out: 10.6,
      uptime: 325680,
      location: 'Seoul-DC-01',
      alerts: 1,
      ip: '192.168.1.110',
      os: 'Ubuntu 22.04 LTS',
      type: 'api',
      role: 'worker',
      environment: 'production',
      provider: 'API-Route-Mock-Fallback',
      specs: {
        cpu_cores: 4,
        memory_gb: 8,
        disk_gb: 320,
        network_speed: '1Gbps'
      },
      lastUpdate: timestamp,
      services: [],
      systemInfo: {
        os: 'Ubuntu 22.04 LTS',
        uptime: '90h',
        processes: 187,
        zombieProcesses: 3,
        loadAverage: '3.20, 3.15, 3.10',
        lastUpdate: timestamp
      },
      networkInfo: {
        interface: 'eth0',
        receivedBytes: '15 MB',
        sentBytes: '11 MB',
        receivedErrors: 2,
        sentErrors: 1,
        status: 'warning'
      }
    },
    // DB 서버 (1개)
    {
      id: 'api-mock-db-01',
      name: 'db-server-01',
      hostname: 'db-server-01',
      status: 'critical' as const,
      cpu: 92.4,
      cpu_usage: 92.4,
      memory: 95.7,
      memory_usage: 95.7,
      disk: 87.3,
      disk_usage: 87.3,
      network: 52.1,
      network_in: 31.3,
      network_out: 20.8,
      uptime: 340020,
      location: 'Seoul-DC-01',
      alerts: 3,
      ip: '192.168.1.120',
      os: 'Ubuntu 22.04 LTS',
      type: 'database',
      role: 'master',
      environment: 'production',
      provider: 'API-Route-Mock-Fallback',
      specs: {
        cpu_cores: 6,
        memory_gb: 16,
        disk_gb: 500,
        network_speed: '1Gbps'
      },
      lastUpdate: timestamp,
      services: [],
      systemInfo: {
        os: 'Ubuntu 22.04 LTS',
        uptime: '94h',
        processes: 287,
        zombieProcesses: 12,
        loadAverage: '4.50, 4.12, 3.98',
        lastUpdate: timestamp
      },
      networkInfo: {
        interface: 'eth0',
        receivedBytes: '31 MB',
        sentBytes: '21 MB',
        receivedErrors: 8,
        sentErrors: 5,
        status: 'critical'
      }
    }
    // API 라우트 폴백: 3개 서버 유지 (정상 작동 최우선)
  ];
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // 파라미터 검증 강화 (Codex 제안)
    const sortBy = (searchParams.get('sortBy') || 'name') as SortableKey;
    const sortOrder = searchParams.get('sortOrder') === 'desc' ? 'desc' : 'asc';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '10', 10)));
    const search = searchParams.get('search') || '';
    
    console.log('🌐 서버 데이터 요청 - GCP VM 통합 모드');
    console.log('📊 요청 파라미터:', { sortBy, sortOrder, page, limit, search });
    
    let enhancedServers: EnhancedServerMetrics[] = [];
    let dataSource = 'unknown';
    let fallbackUsed = false;

    try {
      // 🎯 1차: GCP VM에서 데이터 가져오기 시도
      console.log('🚀 [API-ROUTE] GCP VM 서버 데이터 요청 중...');
      console.log('📍 [API-ROUTE] 요청 URL:', request.url);
      console.log('🔧 [API-ROUTE] 요청 파라미터 상세:', { sortBy, sortOrder, page, limit, search });
      
      const gcpResponse = await getServersFromGCPVM();
      
      if (gcpResponse.success && gcpResponse.data && gcpResponse.data.length > 0) {
        console.log(`✅ [API-ROUTE] GCP VM 응답 성공: ${gcpResponse.data.length}개 서버`);
        console.log('📊 [API-ROUTE] GCP VM 데이터 소스:', gcpResponse.source);
        console.log('🔄 [API-ROUTE] GCP VM 폴백 여부:', gcpResponse.fallback ? '예' : '아니오');
        
        enhancedServers = gcpResponse.data;
        dataSource = gcpResponse.source;
        fallbackUsed = gcpResponse.fallback;
        

        
        // 서버별 상태 요약
        const statusSummary = enhancedServers.reduce((acc, server) => {
          acc[server.status] = (acc[server.status] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        console.log('📈 [API-ROUTE] 서버 상태 요약:', statusSummary);
        
      } else {
        throw new Error(`GCP VM 응답 실패: ${JSON.stringify(gcpResponse)}`);
      }
    } catch (gcpError) {
      // 🔄 2차: API 라우트 전용 목업 데이터로 폴백
      console.warn('⚠️ [API-ROUTE] GCP VM 연결 실패, API 라우트 목업 데이터로 폴백');
      console.error('💥 [API-ROUTE] GCP 에러 상세:', gcpError instanceof Error ? gcpError.message : gcpError);
      console.log('🛡️ [API-ROUTE] 폴백 경로: API 라우트 전용 목업 (3개 서버)');
      
      // 🔍 디버깅을 위한 에러 정보 저장
      const errorInfo = {
        errorType: gcpError?.constructor?.name || 'Unknown',
        errorMessage: gcpError instanceof Error ? gcpError.message : String(gcpError),
        stack: gcpError instanceof Error ? gcpError.stack?.split('\n').slice(0, 3).join('\n') : undefined,
        timestamp: new Date().toISOString(),
        nodeEnv: process.env.NODE_ENV,
        vercelEnv: process.env.VERCEL_ENV
      };
      
      enhancedServers = generateMockServers();
      dataSource = 'api-route-mock';
      fallbackUsed = true;
      
      console.log('📋 [API-ROUTE] 폴백 서버 목록:', enhancedServers.map(s => `${s.name}(${s.status})`).join(', '));
      
      // 디버깅 정보를 메타데이터에 포함
      global.gcpErrorInfo = errorInfo;
    }

    // 검색 필터 적용 (EnhancedServerMetrics 기준)
    let filteredServers = enhancedServers;
    if (search) {
      const searchLower = search.toLowerCase();
      filteredServers = enhancedServers.filter(server =>
        server.name.toLowerCase().includes(searchLower) ||
        server.hostname.toLowerCase().includes(searchLower) ||
        server.status.toLowerCase().includes(searchLower) ||
        server.type.toLowerCase().includes(searchLower)
      );
    }

    // 정렬 적용 (EnhancedServerMetrics 기준)
    filteredServers.sort((a, b) => {
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
          return (a.name || '').localeCompare(b.name || '') * dir;
      }
    });

    // 페이지네이션 적용
    const total = filteredServers.length;
    const startIndex = (page - 1) * limit;
    const paginatedServers = filteredServers.slice(startIndex, startIndex + limit);

    console.log(`📋 [API-ROUTE] 최종 응답: ${paginatedServers.length}개 서버 (전체: ${total}개)`);
    console.log('📡 [API-ROUTE] 데이터 소스 최종:', { dataSource, fallbackUsed });
    console.log('🔍 [API-ROUTE] 최종 서버 목록:', paginatedServers.map(s => 
      `${s.name || 'unknown'}(${s.type || 'unknown'}/${s.status || 'unknown'}/${(s.cpu_usage || s.cpu || 0).toFixed(1)}%)`
    ).join(', '));
    
    // 검색/필터링 통계
    if (search) {
      console.log('🔍 [API-ROUTE] 검색 통계:', { 
        searchTerm: search, 
        originalCount: enhancedServers.length, 
        filteredCount: filteredServers.length 
      });
    }
    
    // 페이지네이션 통계
    console.log('📃 [API-ROUTE] 페이지네이션:', { 
      page, 
      limit, 
      startIndex: (page - 1) * limit,
      totalPages: Math.ceil(total / limit)
    });



    return NextResponse.json({
      success: true,
      data: paginatedServers, // 페이지네이션된 서버 데이터
      source: dataSource, // 데이터 소스 정보 추가
      fallback: fallbackUsed, // 폴백 사용 여부

      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: startIndex + limit < total,
        hasPrev: page > 1
      },
      timestamp: new Date().toISOString(),
      metadata: {
        serverCount: paginatedServers.length,
        totalServers: total,
        dataSource,
        fallbackUsed,
        gcpVmIntegration: true, // GCP VM 통합 표시
        // 🔍 디버깅 정보 (에러 발생시만 포함)
        ...(global.gcpErrorInfo && fallbackUsed ? { gcpError: global.gcpErrorInfo } : {})
      }
    });
      
  } catch (error) {
    console.error('서버 목록 조회 실패:', error);
    
    // 에러 경계 개선 (Codex 제안)
    if (error instanceof Error) {
      return NextResponse.json({
        success: false,
        error: 'SERVERS_LIST_FAILED',
        message: process.env.NODE_ENV === 'development' ? error.message : '서버 목록을 불러올 수 없습니다.'
      }, { status: 500 });
    }
    
    return NextResponse.json({
      success: false,
      error: 'INTERNAL_SERVER_ERROR',
      message: '서버 내부 오류가 발생했습니다.'
    }, { status: 500 });
  }
}