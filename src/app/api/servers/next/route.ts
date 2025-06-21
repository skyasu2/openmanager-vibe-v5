import { rateLimiters, withRateLimit } from '@/lib/rate-limiter';
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
          totalServers:
            RealServerDataGenerator.getInstance().getAllServers().length,
        },
      });
    }

    const generator = RealServerDataGenerator.getInstance();

    if (generator.getAllServers().length === 0) {
      await generator.initialize();
      generator.startAutoGeneration();
    }

    const servers = generator
      .getAllServers()
      .sort((a, b) => a.id.localeCompare(b.id));

    const limited = servers;

    return NextResponse.json(
      { success: true, servers: limited },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
        },
      }
    );
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
