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
 * 통합된 정적 서버 데이터 (10개 서버)
 * /api/gcp-vm-data 라우트 우회하여 직접 통합
 * GCP VM 연결 실패 시 또는 Vercel 프로덕션 환경에서 사용
 */
function generateStaticServers(): EnhancedServerMetrics[] {
  const timestamp = new Date().toISOString();
  
  // GCP VM 정적 데이터를 EnhancedServerMetrics 형식으로 변환
  const staticVMData = [
    {
      "server_id": "server-1756455178476-0",
      "hostname": "web-server-01",
      "timestamp": "2025-08-29T17:12:58.000Z",
      "system": {
        "cpu_usage_percent": 34.38,
        "memory_total_bytes": 8589934592,
        "memory_used_bytes": 2438209376,
        "disk_total_bytes": 214748364800,
        "disk_used_bytes": 115848619254,
        "uptime_seconds": 1756429123
      },
      "metadata": {
        "ip": "192.168.1.100",
        "os": "Ubuntu 22.04 LTS",
        "server_type": "web",
        "role": "worker",
        "provider": "GCP-VM"
      },
      "specs": {
        "cpu_cores": 4,
        "memory_gb": 8,
        "disk_gb": 200
      },
      "status": "online"
    },
    {
      "server_id": "server-1756455178476-1",
      "hostname": "web-server-02",
      "timestamp": "2025-08-29T17:12:58.000Z",
      "system": {
        "cpu_usage_percent": 29.85,
        "memory_total_bytes": 8589934592,
        "memory_used_bytes": 3115824828,
        "disk_total_bytes": 214748364800,
        "disk_used_bytes": 85787383921,
        "uptime_seconds": 1754389804
      },
      "metadata": {
        "ip": "192.168.1.101",
        "os": "Ubuntu 22.04 LTS",
        "server_type": "web",
        "role": "worker",
        "provider": "GCP-VM"
      },
      "specs": {
        "cpu_cores": 4,
        "memory_gb": 8,
        "disk_gb": 200
      },
      "status": "online"
    },
    {
      "server_id": "server-1756455178476-2",
      "hostname": "api-server-01",
      "timestamp": "2025-08-29T17:12:58.000Z",
      "system": {
        "cpu_usage_percent": 47.52,
        "memory_total_bytes": 17179869184,
        "memory_used_bytes": 7126592271,
        "disk_total_bytes": 322122547200,
        "disk_used_bytes": 95283441851,
        "uptime_seconds": 1756404615
      },
      "metadata": {
        "ip": "192.168.2.100",
        "os": "Ubuntu 22.04 LTS",
        "server_type": "api",
        "role": "primary",
        "provider": "GCP-VM"
      },
      "specs": {
        "cpu_cores": 6,
        "memory_gb": 16,
        "disk_gb": 300
      },
      "status": "online"
    },
    {
      "server_id": "server-1756455178476-3",
      "hostname": "api-server-02",
      "timestamp": "2025-08-29T17:12:58.000Z",
      "system": {
        "cpu_usage_percent": 43.99,
        "memory_total_bytes": 17179869184,
        "memory_used_bytes": 6626593510,
        "disk_total_bytes": 322122547200,
        "disk_used_bytes": 100544609153,
        "uptime_seconds": 1756435387
      },
      "metadata": {
        "ip": "192.168.2.101",
        "os": "Ubuntu 22.04 LTS",
        "server_type": "api",
        "role": "secondary",
        "provider": "GCP-VM"
      },
      "specs": {
        "cpu_cores": 6,
        "memory_gb": 16,
        "disk_gb": 300
      },
      "status": "online"
    },
    {
      "server_id": "server-1756455178477-4",
      "hostname": "db-master-primary",
      "timestamp": "2025-08-29T17:12:58.000Z",
      "system": {
        "cpu_usage_percent": 12.51,
        "memory_total_bytes": 34359738368,
        "memory_used_bytes": 19946046061,
        "disk_total_bytes": 1073741824000,
        "disk_used_bytes": 435889319904,
        "uptime_seconds": 1755470558
      },
      "metadata": {
        "ip": "192.168.3.100",
        "os": "Ubuntu 22.04 LTS",
        "server_type": "database",
        "role": "master",
        "provider": "GCP-VM"
      },
      "specs": {
        "cpu_cores": 8,
        "memory_gb": 32,
        "disk_gb": 1000
      },
      "status": "online"
    },
    {
      "server_id": "server-1756455178477-5",
      "hostname": "db-replica-01",
      "timestamp": "2025-08-29T17:12:58.000Z",
      "system": {
        "cpu_usage_percent": 17.46,
        "memory_total_bytes": 34359738368,
        "memory_used_bytes": 15177950420,
        "disk_total_bytes": 1073741824000,
        "disk_used_bytes": 571328142108,
        "uptime_seconds": 1754173478
      },
      "metadata": {
        "ip": "192.168.3.101",
        "os": "Ubuntu 22.04 LTS",
        "server_type": "database",
        "role": "replica",
        "provider": "GCP-VM"
      },
      "specs": {
        "cpu_cores": 8,
        "memory_gb": 32,
        "disk_gb": 1000
      },
      "status": "online"
    },
    {
      "server_id": "server-1756455178477-6",
      "hostname": "redis-cache-01",
      "timestamp": "2025-08-29T17:12:58.000Z",
      "system": {
        "cpu_usage_percent": 42.0,
        "memory_total_bytes": 17179869184,
        "memory_used_bytes": 9964324126,
        "disk_total_bytes": 107374182400,
        "disk_used_bytes": 48318382080,
        "uptime_seconds": 1754764890
      },
      "metadata": {
        "ip": "192.168.4.100",
        "os": "Ubuntu 22.04 LTS",
        "server_type": "cache",
        "role": "primary",
        "provider": "GCP-VM"
      },
      "specs": {
        "cpu_cores": 4,
        "memory_gb": 16,
        "disk_gb": 100
      },
      "status": "online"
    },
    {
      "server_id": "server-1756455178478-7",
      "hostname": "monitoring-server",
      "timestamp": "2025-08-29T17:12:58.000Z",
      "system": {
        "cpu_usage_percent": 26.24,
        "memory_total_bytes": 8589934592,
        "memory_used_bytes": 4120458156,
        "disk_total_bytes": 536870912000,
        "disk_used_bytes": 422756725966,
        "uptime_seconds": 1755894695
      },
      "metadata": {
        "ip": "192.168.5.100",
        "os": "Ubuntu 22.04 LTS",
        "server_type": "monitoring",
        "role": "standalone",
        "provider": "GCP-VM"
      },
      "specs": {
        "cpu_cores": 2,
        "memory_gb": 8,
        "disk_gb": 500
      },
      "status": "online"
    },
    {
      "server_id": "server-1756455178478-8",
      "hostname": "security-server",
      "timestamp": "2025-08-29T17:12:58.000Z",
      "system": {
        "cpu_usage_percent": 13.91,
        "memory_total_bytes": 8589934592,
        "memory_used_bytes": 5578614106,
        "disk_total_bytes": 214748364800,
        "disk_used_bytes": 156557749037,
        "uptime_seconds": 1754027553
      },
      "metadata": {
        "ip": "192.168.6.100",
        "os": "Ubuntu 22.04 LTS",
        "server_type": "security",
        "role": "standalone",
        "provider": "GCP-VM"
      },
      "specs": {
        "cpu_cores": 4,
        "memory_gb": 8,
        "disk_gb": 200
      },
      "status": "online"
    },
    {
      "server_id": "server-1756455178478-9",
      "hostname": "backup-server",
      "timestamp": "2025-08-29T17:12:58.000Z",
      "system": {
        "cpu_usage_percent": 38.28,
        "memory_total_bytes": 4294967296,
        "memory_used_bytes": 1100128893,
        "disk_total_bytes": 2147483648000,
        "disk_used_bytes": 753447563255,
        "uptime_seconds": 1755171946
      },
      "metadata": {
        "ip": "192.168.7.100",
        "os": "Ubuntu 22.04 LTS",
        "server_type": "backup",
        "role": "standalone",
        "provider": "GCP-VM"
      },
      "specs": {
        "cpu_cores": 2,
        "memory_gb": 4,
        "disk_gb": 2000
      },
      "status": "online"
    }
  ];

  // VM 데이터를 EnhancedServerMetrics 형식으로 변환
  return staticVMData.map((vmServer, index) => {
    const memoryUsagePercent = (vmServer.system.memory_used_bytes / vmServer.system.memory_total_bytes) * 100;
    const diskUsagePercent = (vmServer.system.disk_used_bytes / vmServer.system.disk_total_bytes) * 100;
    const networkIn = Math.random() * 15 + 5; // 5-20 MB/s
    const networkOut = Math.random() * 10 + 3; // 3-13 MB/s
    
    return {
      id: vmServer.server_id,
      name: vmServer.hostname,
      hostname: vmServer.hostname,
      status: vmServer.status as 'online' | 'offline' | 'warning' | 'critical',
      cpu: vmServer.system.cpu_usage_percent,
      cpu_usage: vmServer.system.cpu_usage_percent,
      memory: memoryUsagePercent,
      memory_usage: memoryUsagePercent,
      disk: diskUsagePercent,
      disk_usage: diskUsagePercent,
      network: networkIn + networkOut,
      network_in: networkIn,
      network_out: networkOut,
      uptime: vmServer.system.uptime_seconds,
      location: 'Seoul-DC-01',
      alerts: vmServer.status === 'critical' ? 3 : vmServer.status === 'warning' ? 1 : 0,
      ip: vmServer.metadata.ip,
      os: vmServer.metadata.os,
      type: vmServer.metadata.server_type,
      role: vmServer.metadata.role,
      environment: 'production',
      provider: 'GCP-VM-Static-Integrated',
      specs: {
        cpu_cores: vmServer.specs.cpu_cores,
        memory_gb: vmServer.specs.memory_gb,
        disk_gb: vmServer.specs.disk_gb,
        network_speed: '1Gbps'
      },
      lastUpdate: vmServer.timestamp,
      services: [],
      systemInfo: {
        os: vmServer.metadata.os,
        uptime: Math.floor(vmServer.system.uptime_seconds / 3600) + 'h',
        processes: 120 + index * 15,
        zombieProcesses: vmServer.status === 'critical' ? 5 : 0,
        loadAverage: `${(vmServer.system.cpu_usage_percent / 20).toFixed(2)}, ${((vmServer.system.cpu_usage_percent - 5) / 20).toFixed(2)}, ${((vmServer.system.cpu_usage_percent - 10) / 20).toFixed(2)}`,
        lastUpdate: vmServer.timestamp
      },
      networkInfo: {
        interface: 'eth0',
        receivedBytes: `${networkIn.toFixed(1)} MB`,
        sentBytes: `${networkOut.toFixed(1)} MB`,
        receivedErrors: vmServer.status === 'critical' ? 3 : 0,
        sentErrors: vmServer.status === 'critical' ? 2 : 0,
        status: vmServer.status === 'online' ? 'healthy' : vmServer.status
      }
    };
  });
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
    
    // 🚨 강제 배포 확인 로그 - 베르셀 캐시 무효화 테스트
    console.log('🔥 [FORCE-DEPLOY-v2.1] 10개 서버 API 라우트 확정 배포 - 2025.08.29');
    console.log('🌐 [VERCEL-CACHE-BUST] 서버 데이터 요청 - GCP VM 통합 모드');
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
      console.log('🛡️ [API-ROUTE] 폴백 경로: 통합된 정적 데이터 (10개 서버)');
      
      // 🔍 디버깅을 위한 에러 정보 저장
      const errorInfo = {
        errorType: gcpError?.constructor?.name || 'Unknown',
        errorMessage: gcpError instanceof Error ? gcpError.message : String(gcpError),
        stack: gcpError instanceof Error ? gcpError.stack?.split('\n').slice(0, 3).join('\n') : undefined,
        timestamp: new Date().toISOString(),
        nodeEnv: process.env.NODE_ENV,
        vercelEnv: process.env.VERCEL_ENV
      };
      
      enhancedServers = generateStaticServers();
      dataSource = 'static-integrated';
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
        // 🚨 강제 배포 확인 정보
        forceDeployVersion: 'v2.1-2025.08.29',
        cacheBreaker: `cache-break-${Date.now()}`,
        // 🔍 디버깅 정보 (에러 발생시만 포함)
        ...(global.gcpErrorInfo && fallbackUsed ? { gcpError: global.gcpErrorInfo } : {})
      }
    }, {
      // 🔥 강력한 캐시 무효화 헤더
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0',
        'X-Vercel-Cache': 'MISS',
        'X-Force-Deploy-Version': 'v2.1-2025.08.29'
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