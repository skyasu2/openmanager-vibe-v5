import { getServerSettings } from '@/modules/data-consistency';
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
      id: `server-${i}`,
      name: `Server-${i.toString().padStart(2, '0')}`,
      hostname: `server-${i}.example.com`,
      status,
      location,
      cpu: Math.floor(Math.random() * 100),
      memory: Math.floor(Math.random() * 100),
      disk: Math.floor(Math.random() * 100),
      network: Math.floor(Math.random() * 1000),
      uptime: Math.floor(Math.random() * 86400 * 30),
      services: serviceSet,
      lastUpdate: new Date().toISOString(),
    });
  }

  return servers;
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // 🎯 중앙집중식 설정에서 기본값 가져오기
    const serverSettings = getServerSettings();

    // 쿼리 파라미터 파싱 (중앙 설정 기본값 사용)
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || serverSettings.apiDefaultLimit.toString());
    const status = searchParams.get('status');
    const location = searchParams.get('location');

    console.log(`🔍 서버 API 요청: page=${page}, limit=${limit}, status=${status}, location=${location}`);
    console.log(`📊 중앙 설정 적용: 기본 제한=${serverSettings.apiDefaultLimit}, 총 서버=${serverSettings.totalCount}`);

    // 실제 서버 데이터 생성기 사용
    const generator = RealServerDataGenerator.getInstance();
    let servers = await generator.getAllServers();

    console.log(`📦 데이터 생성기에서 ${servers.length}개 서버 조회`);

    // 폴백: 데이터가 없으면 목업 데이터 사용
    if (!servers || servers.length === 0) {
      console.log('⚠️ 실제 서버 데이터가 없어 목업 데이터 사용');
      servers = generateMockServers();
    }

    // 필터링
    let filteredServers = servers;

    if (status) {
      filteredServers = filteredServers.filter(server => server.status === status);
    }

    if (location) {
      filteredServers = filteredServers.filter(server =>
        server.location?.toLowerCase().includes(location.toLowerCase()) ||
        server.environment?.toLowerCase().includes(location.toLowerCase())
      );
    }

    // 페이지네이션
    const offset = (page - 1) * limit;
    const paginatedServers = filteredServers.slice(offset, offset + limit);

    // 응답 데이터 구성
    const response = {
      servers: paginatedServers,
      pagination: {
        page,
        limit,
        total: filteredServers.length,
        totalPages: Math.ceil(filteredServers.length / limit),
        hasNext: offset + limit < filteredServers.length,
        hasPrev: page > 1,
      },
      filters: {
        status,
        location,
      },
      metadata: {
        timestamp: new Date().toISOString(),
        source: servers === generateMockServers() ? 'mock' : 'real',
        settings: {
          apiDefaultLimit: serverSettings.apiDefaultLimit,
          totalConfigured: serverSettings.totalCount,
          itemsPerPage: serverSettings.itemsPerPage,
        },
        dataConsistency: {
          configured: serverSettings.totalCount,
          actual: servers.length,
          filtered: filteredServers.length,
          returned: paginatedServers.length,
          isConsistent: servers.length === serverSettings.totalCount,
        },
      },
    };

    // 🔍 데이터 일관성 로깅 (개발 환경)
    if (process.env.NODE_ENV === 'development') {
      console.log('📊 API 응답 상태:');
      console.log(`  설정된 서버 수: ${serverSettings.totalCount}개`);
      console.log(`  실제 서버 수: ${servers.length}개`);
      console.log(`  필터된 서버 수: ${filteredServers.length}개`);
      console.log(`  반환 서버 수: ${paginatedServers.length}개`);
      console.log(`  API 기본 제한: ${serverSettings.apiDefaultLimit}개`);
      console.log(`  요청 제한: ${limit}개`);

      if (servers.length !== serverSettings.totalCount) {
        console.warn(`⚠️ 데이터 불일치: 실제(${servers.length}) !== 설정(${serverSettings.totalCount})`);
      }

      if (limit !== serverSettings.apiDefaultLimit) {
        console.warn(`⚠️ 제한 불일치: 요청(${limit}) !== 기본(${serverSettings.apiDefaultLimit})`);
      }
    }

    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ 서버 API 오류:', error);

    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
