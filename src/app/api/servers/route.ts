import { RealServerDataGenerator } from '@/services/data-generator/RealServerDataGenerator';
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
    ['docker', 'containers', 'prometheus'],
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
      cpu:
        status === 'offline' ? 0 : parseFloat((Math.random() * 100).toFixed(2)),
      memory:
        status === 'offline' ? 0 : parseFloat((Math.random() * 100).toFixed(2)),
      disk:
        status === 'offline' ? 0 : parseFloat((Math.random() * 100).toFixed(2)),
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

    // 🛡️ 안전한 서버 데이터 가져오기
    let servers = [];
    try {
      const rawServers = generator.getAllServers();
      // 배열 검증 및 안전한 처리
      if (Array.isArray(rawServers)) {
        servers = rawServers.sort((a, b) => a.id.localeCompare(b.id));
      } else {
        console.warn(
          '⚠️ getAllServers()가 배열을 반환하지 않음:',
          typeof rawServers
        );
        servers = [];
      }
    } catch (serverError) {
      console.error('❌ 서버 데이터 가져오기 실패:', serverError);
      servers = [];
    }

    // 제한 개수 처리 (고정된 순서 유지)
    const { searchParams } = new URL(request.url);
    const limit = Math.max(1, parseInt(searchParams.get('limit') || '15')); // 최소 1개
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

    // 🛡️ 안전한 상태 분포 계산
    const fullStatusDistribution = {
      online: servers.filter(
        s => s && simplify(s.status || 'offline') === 'online'
      ).length,
      warning: servers.filter(
        s => s && simplify(s.status || 'offline') === 'warning'
      ).length,
      offline: servers.filter(
        s => s && simplify(s.status || 'offline') === 'offline'
      ).length,
    };

    // 🔧 **표시용 서버 기준** 상태별 분포 계산 (리스트 표시용)
    const displayStatusDistribution = {
      online: limitedServers.filter(
        s => s && simplify(s.status || 'offline') === 'online'
      ).length,
      warning: limitedServers.filter(
        s => s && simplify(s.status || 'offline') === 'warning'
      ).length,
      offline: limitedServers.filter(
        s => s && simplify(s.status || 'offline') === 'offline'
      ).length,
    };

    console.log('📊 전체 서버 분포:', fullStatusDistribution);
    console.log('📊 표시용 서버 분포:', displayStatusDistribution);

    // 🔧 **UI 호환 통계 데이터 - 전체 서버 기준으로 수정**
    const serverStats = {
      total: servers.length, // 🎯 전체 서버 개수
      online: fullStatusDistribution.online,
      warning: fullStatusDistribution.warning,
      offline: fullStatusDistribution.offline,
    };

    console.log('📊 UI 호환 통계 (전체 기준):', serverStats);

    // 🛡️ 안전한 응답 반환 (항상 배열 보장)
    return NextResponse.json(
      {
        success: true,
        servers: Array.isArray(limitedServers) ? limitedServers : [], // 배열 보장
        total: servers.length,
        displayed: limitedServers.length,
        stats: serverStats,
        distribution: fullStatusDistribution,
        displayDistribution: displayStatusDistribution,
        timestamp: new Date().toISOString(),
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
          'Content-Type': 'application/json; charset=utf-8',
        },
      }
    );
  } catch (error) {
    console.error('❌ API /servers 오류:', error);

    // 🛡️ 오류 시에도 안전한 응답 반환
    return NextResponse.json(
      {
        success: false,
        error: '서버 데이터 조회 실패',
        servers: [], // 빈 배열 보장
        total: 0,
        displayed: 0,
        stats: { total: 0, online: 0, warning: 0, offline: 0 },
        distribution: { online: 0, warning: 0, offline: 0 },
        displayDistribution: { online: 0, warning: 0, offline: 0 },
        timestamp: new Date().toISOString(),
      },
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
        },
      }
    );
  }
}
