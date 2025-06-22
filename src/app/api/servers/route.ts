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
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'servers';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    const generator = RealServerDataGenerator.getInstance();

    if (format === 'dashboard') {
      // 대시보드 데이터 생성
      const servers = generator.getAllServers();
      const dashboardData = {
        servers: servers.slice(0, 15),
        stats: {
          total: servers.length,
          online: servers.filter(s => s.status === 'running').length,
          warning: servers.filter(s => s.status === 'warning').length,
          offline: servers.filter(
            s => s.status === 'stopped' || s.status === 'error'
          ).length,
        },
      };
      return NextResponse.json(dashboardData);
    }

    const servers = generator.getAllServers();
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedServers = servers.slice(startIndex, endIndex);

    return NextResponse.json({
      servers: paginatedServers,
      pagination: {
        page,
        limit,
        total: servers.length,
        totalPages: Math.ceil(servers.length / limit),
      },
    });
  } catch (error) {
    console.error('서버 데이터 조회 오류:', error);
    return NextResponse.json(
      { error: '서버 데이터를 조회할 수 없습니다.' },
      { status: 500 }
    );
  }
}
