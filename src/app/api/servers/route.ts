import { ACTIVE_SERVER_CONFIG } from '@/config/serverConfig';
import { RealServerDataGenerator } from '@/services/data-generator/RealServerDataGenerator';
import { NextRequest, NextResponse } from 'next/server';

// 목업 서버 데이터 생성
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

  for (let i = 1; i <= 15; i++) {
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
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(
      searchParams.get('limit') || String(ACTIVE_SERVER_CONFIG.maxServers)
    );
    const status = searchParams.get('status');

    // 실제 서버 데이터 생성기 사용
    const generator = RealServerDataGenerator.getInstance();
    let servers = await generator.getAllServers();

    // 폴백: 데이터가 없으면 목업 데이터 사용
    if (!servers || servers.length === 0) {
      servers = generateMockServers();
    }

    // 상태별 필터링
    let filteredServers = servers;
    if (status && status !== 'all') {
      filteredServers = servers.filter(server => server.status === status);
    }

    // 페이지네이션 계산
    const totalItems = filteredServers.length;
    const totalPages = Math.ceil(totalItems / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedServers = filteredServers.slice(startIndex, endIndex);

    // 통계 계산
    const stats = {
      total: servers.length,
      online: servers.filter(s => s.status === 'running').length,
      warning: servers.filter(s => s.status === 'warning').length,
      offline: servers.filter(
        s => s.status === 'error' || s.status === 'stopped'
      ).length,
      avgCpu: Math.round(
        servers.reduce((sum, s) => sum + (s.metrics?.cpu || 0), 0) /
          servers.length
      ),
      avgMemory: Math.round(
        servers.reduce((sum, s) => sum + (s.metrics?.memory || 0), 0) /
          servers.length
      ),
      avgDisk: Math.round(
        servers.reduce((sum, s) => sum + (s.metrics?.disk || 0), 0) /
          servers.length
      ),
    };

    return NextResponse.json({
      success: true,
      data: paginatedServers,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems,
        itemsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
      summary: {
        servers: stats,
      },
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('Error fetching servers:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error : undefined,
      },
      { status: 500 }
    );
  }
}
