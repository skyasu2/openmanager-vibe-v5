import { NextRequest, NextResponse } from 'next/server';
import { RealServerDataGenerator } from '@/services/data-generator/RealServerDataGenerator';

// 목업 서버 데이터
const generateMockServers = () => {
  const servers = [];
  const locations = ['Seoul', 'Tokyo', 'Singapore', 'Frankfurt', 'Oregon'];
  const statuses = ['online', 'warning', 'offline'] as const;
  const services = [
    ['nginx', 'mysql', 'redis'],
    ['apache', 'postgresql', 'memcached'],
    ['node.js', 'mongodb', 'rabbitmq'],
    ['docker', 'kubernetes', 'prometheus'],
    ['jenkins', 'gitlab', 'elasticsearch'],
  ];

  for (let i = 1; i <= 20; i++) {
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const location = locations[Math.floor(Math.random() * locations.length)];
    const serviceSet = services[Math.floor(Math.random() * services.length)];

    servers.push({
      id: `server-${i.toString().padStart(3, '0')}`,
      name: `${location}-WEB-${i.toString().padStart(2, '0')}`,
      status,
      cpu: status === 'offline' ? 0 : Math.floor(Math.random() * 100),
      memory: status === 'offline' ? 0 : Math.floor(Math.random() * 100),
      disk: status === 'offline' ? 0 : Math.floor(Math.random() * 100),
      uptime:
        status === 'offline'
          ? '0d 0h 0m'
          : `${Math.floor(Math.random() * 365)}d ${Math.floor(Math.random() * 24)}h ${Math.floor(Math.random() * 60)}m`,
      location,
      alerts:
        status === 'warning'
          ? Math.floor(Math.random() * 5) + 1
          : status === 'offline'
            ? Math.floor(Math.random() * 10) + 5
            : 0,
      lastUpdate: new Date(Date.now() - Math.random() * 300000), // 최근 5분 내
      services: serviceSet,
    });
  }

  return servers;
};

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 API /servers 요청 처리 시작');

    // 실제 서비스: RealServerDataGenerator 사용 (메모리 or Redis 캐싱)
    const generator = RealServerDataGenerator.getInstance();

    // 초기화되지 않았으면 초기화 및 자동 생성 시작
    if (generator.getAllServers().length === 0) {
      await generator.initialize();
      generator.startAutoGeneration();
    }

    // 최신 서버 목록 가져오기 (일관된 순서 보장 위해 id 정렬)
    const servers = generator
      .getAllServers()
      .sort((a, b) => a.id.localeCompare(b.id));

    // 제한 개수 처리 (고정된 순서 유지)
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '8'); // 🎯 기본값: 8개
    const limitedServers = servers.slice(0, limit);

    console.log(
      `✅ 정렬된 서버 데이터 반환: ${limitedServers.length}개 (전체: ${servers.length}개)`
    );

    // 🔧 **전체 서버 기준** 상태별 분포 계산 (헤더 표시용)
    const simplify = (status: string): 'online' | 'warning' | 'offline' => {
      switch (status) {
        case 'running':
          return 'online';
        case 'warning':
          return 'warning';
        case 'stopped':
        case 'error':
        case 'maintenance':
          return 'offline';
        default:
          return 'offline';
      }
    };

    const fullStatusDistribution = {
      online: servers.filter(s => simplify(s.status) === 'online').length,
      warning: servers.filter(s => simplify(s.status) === 'warning').length,
      offline: servers.filter(s => simplify(s.status) === 'offline').length,
    };

    // 🔧 **표시용 서버 기준** 상태별 분포 계산 (리스트 표시용)
    const displayStatusDistribution = {
      online: limitedServers.filter(s => simplify(s.status) === 'online')
        .length,
      warning: limitedServers.filter(s => simplify(s.status) === 'warning')
        .length,
      offline: limitedServers.filter(s => simplify(s.status) === 'offline')
        .length,
    };

    console.log('📊 전체 서버 분포:', fullStatusDistribution);
    console.log('📊 표시용 서버 분포:', displayStatusDistribution);

    // 🔧 **UI 호환 통계 데이터 - 전체 서버 기준으로 수정**
    const serverStats = {
      total: servers.length, // 🎯 전체 서버 개수 (30개)
      online: fullStatusDistribution.online, // online = online
      warning: fullStatusDistribution.warning,
      offline: fullStatusDistribution.offline, // offline = offline (UI 표시용)
    };

    console.log('📊 UI 호환 통계 (전체 기준):', serverStats);

    return NextResponse.json(
      {
        success: true,
        servers: limitedServers,
        total: servers.length, // 🎯 전체 서버 개수
        displayed: limitedServers.length, // 🔧 실제 표시되는 서버 개수
        stats: serverStats, // 🔧 UI에서 사용할 통계 데이터 (전체 기준)
        distribution: fullStatusDistribution, // 🔧 전체 서버 분포
        displayDistribution: displayStatusDistribution, // 🔧 표시용 서버 분포
        timestamp: new Date().toISOString(),
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
        },
      }
    );
  } catch (error) {
    console.error('❌ API /servers 오류:', error);

    return NextResponse.json(
      {
        success: false,
        error: '서버 데이터 조회 실패',
        servers: [],
        total: 0,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
