import { NextRequest, NextResponse } from 'next/server';

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
      uptime: status === 'offline' ? '0d 0h 0m' :
        `${Math.floor(Math.random() * 365)}d ${Math.floor(Math.random() * 24)}h ${Math.floor(Math.random() * 60)}m`,
      location,
      alerts: status === 'warning' ? Math.floor(Math.random() * 5) + 1 :
        status === 'offline' ? Math.floor(Math.random() * 10) + 5 : 0,
      lastUpdate: new Date(Date.now() - Math.random() * 300000), // 최근 5분 내
      services: serviceSet,
    });
  }

  return servers;
};

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 API /servers 요청 처리 시작');

    // 실제 서비스에서는 데이터베이스에서 서버 정보를 가져옵니다
    const servers = generateMockServers();

    // 제한 개수 처리
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '8'); // 🎯 기본값을 8개로 변경
    const limitedServers = servers.slice(0, limit);

    console.log(
      `✅ 정렬된 서버 데이터 반환: ${limitedServers.length}개 (전체: ${servers.length}개)`
    );

    // 🔧 **전체 서버 기준** 상태별 분포 계산 (헤더 표시용)
    const fullStatusDistribution = {
      online: servers.filter(s => s.status === 'online').length,
      warning: servers.filter(s => s.status === 'warning').length,
      offline: servers.filter(s => s.status === 'offline').length,
    };

    // 🔧 **표시용 서버 기준** 상태별 분포 계산 (리스트 표시용)
    const displayStatusDistribution = {
      online: limitedServers.filter(s => s.status === 'online').length,
      warning: limitedServers.filter(s => s.status === 'warning').length,
      offline: limitedServers.filter(s => s.status === 'offline').length,
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

    return NextResponse.json({
      success: true,
      servers: limitedServers,
      total: servers.length, // 🎯 전체 서버 개수
      displayed: limitedServers.length, // 🔧 실제 표시되는 서버 개수
      stats: serverStats, // 🔧 UI에서 사용할 통계 데이터 (전체 기준)
      distribution: fullStatusDistribution, // 🔧 전체 서버 분포
      displayDistribution: displayStatusDistribution, // 🔧 표시용 서버 분포
      timestamp: new Date().toISOString(),
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
      },
    });
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
