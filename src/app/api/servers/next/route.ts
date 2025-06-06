import { NextRequest, NextResponse } from 'next/server';
import { rateLimiters, withRateLimit } from '@/lib/rate-limiter';

/**
 * 🖥️ Sequential Server Generation API
 * GET: 다음 서버 정보 조회 (Rate Limited: 1분에 20회)
 * POST: 서버 생성 요청 (Rate Limited: 1분에 20회)
 */

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
 * GET /api/servers/next
 * 다음 생성될 서버 정보 조회 또는 생성된 모든 서버 조회
 */
async function handleGET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    // 🏥 헬스체크 요청
    if (action === 'health') {
      const hasServers = generatedServers.length > 0;
      const recentActivity = Date.now() - lastGeneratedTime < 30000; // 30초 이내 활동

      return NextResponse.json({
        success: true,
        data: {
          isGenerating: recentActivity,
          isHealthy: true, // 서버가 응답하고 있으므로 건강함
          serverCount: generatedServers.length,
          totalServerCount: serverCount,
          lastGenerated: lastGeneratedTime,
          status: recentActivity ? 'generating' : hasServers ? 'ready' : 'idle',
        },
        message: recentActivity
          ? '서버 생성기가 활발히 동작 중입니다'
          : hasServers
            ? '서버 생성기가 준비 상태입니다'
            : '서버 생성기가 유휴 상태입니다',
      });
    }

    // 🚀 모든 생성된 서버 목록 조회
    if (action === 'list') {
      return NextResponse.json({
        success: true,
        data: generatedServers,
        metadata: {
          totalServers: generatedServers.length,
          serverCount,
          lastGeneratedTime,
        },
      });
    }

    // 🚀 서버 통계 조회
    if (action === 'stats') {
      const stats = generatedServers.reduce(
        (acc, server) => {
          acc.total++;
          switch (server.status) {
            case 'online':
              acc.online++;
              break;
            case 'warning':
              acc.warning++;
              break;
            case 'offline':
              acc.offline++;
              break;
          }
          return acc;
        },
        { total: 0, online: 0, warning: 0, offline: 0 }
      );

      return NextResponse.json({
        success: true,
        data: stats,
        metadata: {
          totalServers: generatedServers.length,
          serverCount,
        },
      });
    }

    // 기본: 다음 생성될 서버 정보
    const nextServerId = `server-prod-web-${String(serverCount + 1).padStart(2, '0')}`;

    const nextServer: ServerInfo = {
      id: nextServerId,
      hostname: `${nextServerId}.openmanager.local`,
      name: `OpenManager-${nextServerId}`,
      type: 'web-server',
      environment: 'production',
      location: 'Seoul DC1',
      provider: 'onpremise',
      status: 'warning', // pending 상태 대신 warning 사용
      cpu: Math.floor(Math.random() * 30) + 20, // 20-50%
      memory: Math.floor(Math.random() * 40) + 30, // 30-70%
      disk: Math.floor(Math.random() * 20) + 10, // 10-30%
      uptime: `${Math.floor(Math.random() * 15)}d ${Math.floor(Math.random() * 24)}h ${Math.floor(Math.random() * 60)}m`,
      lastUpdate: new Date(),
      alerts: Math.floor(Math.random() * 3), // 0-2 alerts
      services: [
        { name: 'nginx', status: 'running' as const, port: 80 },
        { name: 'node', status: 'running' as const, port: 3000 },
      ],
      specs: {
        cpu_cores: 2 + (serverCount % 4),
        memory_gb: 4 + (serverCount % 8),
        disk_gb: 50 + (serverCount % 100),
      },
      os: 'Ubuntu 22.04 LTS',
      ip: `192.168.1.${100 + (serverCount + 1)}`,
    };

    return NextResponse.json({
      success: true,
      data: nextServer,
      metadata: {
        totalServers: serverCount,
        lastGeneratedTime,
        nextId: serverCount + 1,
      },
    });
  } catch (error) {
    console.error('❌ 서버 생성기 상태 조회 실패:', error);

    return NextResponse.json(
      {
        success: false,
        data: {
          isGenerating: false,
          isHealthy: false,
          serverCount: 0,
          queueLength: 0,
          lastGenerated: null,
          status: 'error',
        },
        error: error instanceof Error ? error.message : 'Unknown error',
        message: '서버 생성기 상태 조회 중 오류가 발생했습니다',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/servers/next
 * 서버 생성 요청
 */
async function handlePOST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));

    // 리셋 요청 처리
    if (body.reset === true) {
      serverCount = 0;
      lastGeneratedTime = Date.now();
      generatedServers = []; // 🚀 생성된 서버 목록도 초기화

      return NextResponse.json({
        success: true,
        message: '서버 카운터가 리셋되었습니다.',
        data: { serverCount: 0, resetTime: lastGeneratedTime, totalServers: 0 },
      });
    }

    // 새 서버 생성
    serverCount++;
    lastGeneratedTime = Date.now();

    const totalServers = 20; // 고정된 총 서버 수

    // 🎯 다양한 서버 상태와 메트릭 생성 로직
    const generateServerStatus = () => {
      const random = Math.random();
      if (random < 0.6) return 'online'; // 60% 정상
      if (random < 0.85) return 'warning'; // 25% 경고
      return 'offline'; // 15% 오프라인
    };

    const generateMetrics = (status: string) => {
      switch (status) {
        case 'online':
          return {
            cpu: Math.floor(Math.random() * 40) + 15, // 15-55% (정상 범위)
            memory: Math.floor(Math.random() * 50) + 25, // 25-75% (정상 범위)
            disk: Math.floor(Math.random() * 30) + 10, // 10-40% (정상 범위)
            alerts: Math.floor(Math.random() * 2), // 0-1개 경고
          };
        case 'warning':
          return {
            cpu: Math.floor(Math.random() * 25) + 70, // 70-95% (높음)
            memory: Math.floor(Math.random() * 20) + 75, // 75-95% (높음)
            disk: Math.floor(Math.random() * 15) + 80, // 80-95% (높음)
            alerts: Math.floor(Math.random() * 3) + 1, // 1-3개 경고
          };
        case 'offline':
          return {
            cpu: 0, // 0% (오프라인)
            memory: 0, // 0% (오프라인)
            disk: Math.floor(Math.random() * 100), // 임의 (측정 불가)
            alerts: Math.floor(Math.random() * 5) + 3, // 3-7개 심각한 경고
          };
        default:
          return { cpu: 50, memory: 50, disk: 50, alerts: 0 };
      }
    };

    const generateServices = (status: string) => {
      const baseServices = [
        { name: 'nginx', port: 80 },
        { name: 'node', port: 3000 },
        { name: 'gunicorn', port: 8000 },
        { name: 'uwsgi', port: 8080 },
      ];

      return baseServices.map(service => ({
        ...service,
        status:
          status === 'offline' || (status === 'warning' && Math.random() < 0.3)
            ? ('stopped' as const)
            : ('running' as const),
      }));
    };

    const serverStatus = generateServerStatus() as
      | 'online'
      | 'warning'
      | 'offline';
    const metrics = generateMetrics(serverStatus);
    const services = generateServices(serverStatus);

    // 🎯 서버 타입 다양화
    const serverTypes = ['web', 'database', 'cache', 'worker', 'api'];
    const serverType = serverTypes[serverCount % serverTypes.length];

    // 🎯 서버 역할에 맞는 직관적인 호스트네임 생성
    const generateHostname = (type: string, count: number) => {
      const typeIndex = Math.floor((count - 1) / serverTypes.length) + 1;

      switch (type) {
        case 'web':
          const webTypes = ['nginx', 'apache', 'web'];
          const webType = webTypes[count % webTypes.length];
          return `${webType}${String(typeIndex).padStart(2, '0')}`;

        case 'database':
          const dbTypes = ['mysql', 'postgres', 'mongo', 'db'];
          const dbType = dbTypes[count % dbTypes.length];
          return `${dbType}${String(typeIndex).padStart(2, '0')}`;

        case 'cache':
          const cacheTypes = ['redis', 'memcache', 'cache'];
          const cacheType = cacheTypes[count % cacheTypes.length];
          return `${cacheType}${String(typeIndex).padStart(2, '0')}`;

        case 'worker':
          const workerTypes = ['worker', 'queue', 'job', 'batch'];
          const workerType = workerTypes[count % workerTypes.length];
          return `${workerType}${String(typeIndex).padStart(2, '0')}`;

        case 'api':
          const apiTypes = ['api', 'rest', 'graphql', 'gateway'];
          const apiType = apiTypes[count % apiTypes.length];
          return `${apiType}${String(typeIndex).padStart(2, '0')}`;

        default:
          return `server${String(count).padStart(2, '0')}`;
      }
    };

    // 🎯 서버 역할에 맞는 적절한 OS 배치
    const generateOS = (type: string, count: number) => {
      switch (type) {
        case 'web':
          const webOSList = [
            'Ubuntu 22.04 LTS',
            'CentOS 8',
            'Alpine Linux 3.18',
            'Ubuntu 20.04 LTS',
          ];
          return webOSList[count % webOSList.length];

        case 'database':
          const dbOSList = [
            'Ubuntu 22.04 LTS',
            'CentOS 8',
            'RHEL 9',
            'Ubuntu 20.04 LTS',
            'Rocky Linux 9',
          ];
          return dbOSList[count % dbOSList.length];

        case 'cache':
          const cacheOSList = [
            'Alpine Linux 3.18',
            'Ubuntu 22.04 LTS',
            'Debian 12',
            'Alpine Linux 3.17',
          ];
          return cacheOSList[count % cacheOSList.length];

        case 'worker':
          const workerOSList = [
            'Ubuntu 22.04 LTS',
            'Debian 12',
            'CentOS 8',
            'Ubuntu 20.04 LTS',
          ];
          return workerOSList[count % workerOSList.length];

        case 'api':
          const apiOSList = [
            'Ubuntu 22.04 LTS',
            'Alpine Linux 3.18',
            'CentOS 8',
            'Debian 12',
          ];
          return apiOSList[count % apiOSList.length];

        default:
          return 'Ubuntu 22.04 LTS';
      }
    };

    const hostname = generateHostname(serverType, serverCount);
    const serverOS = generateOS(serverType, serverCount);

    const newServer = {
      id: hostname,
      hostname: `${hostname}.prod.openmanager.local`,
      name: hostname,
      type: body.type || `${serverType}-server`,
      environment: 'production',
      location: ['Seoul DC1', 'Tokyo DC2', 'Singapore DC3', 'US-East DC4'][
        serverCount % 4
      ],
      provider: 'onpremise',
      status: serverStatus,
      cpu: metrics.cpu,
      memory: metrics.memory,
      disk: metrics.disk,
      uptime:
        serverStatus === 'offline'
          ? '0d 0h 0m'
          : `${Math.floor(Math.random() * 30)}d ${Math.floor(Math.random() * 24)}h ${Math.floor(Math.random() * 60)}m`,
      lastUpdate: new Date(),
      alerts: metrics.alerts,
      services: services,
      specs: {
        cpu_cores: body.specs?.cpu || 2 + (serverCount % 4),
        memory_gb: body.specs?.memory || 4 + (serverCount % 8),
        disk_gb: body.specs?.storage || 50 + (serverCount % 100),
      },
      os: serverOS,
      ip: `192.168.${1 + Math.floor(serverCount / 254)}.${100 + (serverCount % 154)}`,
    };

    // 시뮬레이션: 생성 시간 지연
    await new Promise(resolve =>
      setTimeout(resolve, Math.random() * 1000 + 500)
    );

    // 🚀 생성된 서버를 배열에 저장
    generatedServers.push(newServer);

    const isComplete = serverCount >= totalServers;
    const progress = Math.round((serverCount / totalServers) * 100);

    return NextResponse.json({
      success: true,
      server: newServer, // 훅에서 기대하는 필드명
      currentCount: serverCount,
      progress: progress,
      isComplete: isComplete,
      nextServerType: isComplete ? null : 'Database Server',
      message: isComplete
        ? '🎉 모든 서버 배포 완료!'
        : `서버 ${serverCount}/${totalServers} 배포 완료`,
      metadata: {
        totalServers: serverCount,
        creationTime: Date.now() - lastGeneratedTime,
        previousId: serverCount - 1,
      },
    });
  } catch (error) {
    console.error('POST /api/servers/next 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create server',
        message: '서버 생성 중 오류가 발생했습니다.',
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

// Rate Limited exports
export const GET = withRateLimit(rateLimiters.serversNext, handleGET);
export const POST = withRateLimit(rateLimiters.serversNext, handlePOST);
