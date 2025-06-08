import { NextRequest, NextResponse } from 'next/server';
import { rateLimiters, withRateLimit } from '@/lib/rate-limiter';
import { realServerDataGenerator } from '@/services/data-generator/RealServerDataGenerator';

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
      await realServerDataGenerator.initialize();
      await realServerDataGenerator.startAutoGeneration();
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
 * 서버 생성 요청 (RealServerDataGenerator 연동)
 */
async function handlePOST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));

    // 생성기 초기화 확인
    await initializeGenerator();

    // 리셋 요청 처리
    if (body.reset === true) {
      currentServerIndex = 0;
      console.log('🔄 서버 인덱스 리셋');

      return NextResponse.json({
        success: true,
        message: '서버 생성 순서가 리셋되었습니다.',
        data: { 
          currentIndex: 0, 
          resetTime: Date.now(),
          totalServers: realServerDataGenerator.getAllServers().length 
        },
      });
    }

    // RealServerDataGenerator에서 서버 목록 가져오기
    const allServers = realServerDataGenerator.getAllServers();
    
    if (allServers.length === 0) {
      return NextResponse.json({
        success: false,
        error: '서버 데이터 생성기에서 서버를 찾을 수 없습니다.',
        message: '서버 생성기가 아직 초기화되지 않았거나 서버가 생성되지 않았습니다.',
      }, { status: 404 });
    }

    // 순차적으로 서버 반환
    const currentServer = allServers[currentServerIndex % allServers.length];
    currentServerIndex++;

    // ServerInstance를 API 응답 형식으로 변환
    const serverResponse = {
      id: currentServer.id,
      hostname: `${currentServer.name.toLowerCase()}.${currentServer.environment}.openmanager.local`,
      name: currentServer.name,
      type: currentServer.type,
      environment: currentServer.environment,
      location: currentServer.location,
      provider: 'onpremise',
      status: currentServer.status === 'running' ? 'online' : 
              currentServer.status === 'warning' ? 'warning' : 'offline',
      cpu: Math.round(currentServer.metrics.cpu),
      memory: Math.round(currentServer.metrics.memory),
      disk: Math.round(currentServer.metrics.disk),
      uptime: formatUptime(currentServer.metrics.uptime / (1000 * 60 * 60)), // milliseconds to hours
      lastUpdate: new Date(),
      alerts: currentServer.health.issues.length,
      services: [
        { name: 'nginx', status: 'running' as const, port: 80 },
        { name: 'node', status: 'running' as const, port: 3000 },
        ...(currentServer.type === 'database' ? [
          { name: 'mysql', status: 'running' as const, port: 3306 }
        ] : []),
        ...(currentServer.type === 'cache' ? [
          { name: 'redis', status: 'running' as const, port: 6379 }
        ] : [])
      ],
      specs: {
        cpu_cores: currentServer.specs.cpu.cores,
        memory_gb: Math.round(currentServer.specs.memory.total / (1024 * 1024 * 1024)),
        disk_gb: Math.round(currentServer.specs.disk.total / (1024 * 1024 * 1024)),
      },
      os: currentServer.specs.cpu.architecture === 'arm64' ? 'Ubuntu 22.04 LTS (ARM64)' : 'Ubuntu 22.04 LTS',
      ip: `192.168.1.${100 + (currentServerIndex % 150)}`,
    };

    // 완료 여부 확인
    const isComplete = currentServerIndex >= allServers.length;
    const progress = Math.round((currentServerIndex / allServers.length) * 100);

    console.log(`📊 서버 ${currentServerIndex}/${allServers.length} 생성 - ${serverResponse.name} (${serverResponse.status})`);

    return NextResponse.json({
      success: true,
      server: serverResponse,
      currentCount: currentServerIndex,
      totalServers: allServers.length,
      isComplete,
      progress,
      nextServerType: isComplete ? null : allServers[currentServerIndex % allServers.length]?.type || null,
      message: isComplete 
        ? '모든 서버 생성이 완료되었습니다.'
        : `서버 생성 중... (${currentServerIndex}/${allServers.length})`,
    });

  } catch (error) {
    console.error('❌ 서버 생성 실패:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: '서버 생성 중 오류가 발생했습니다',
        currentCount: currentServerIndex,
        isComplete: false,
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
