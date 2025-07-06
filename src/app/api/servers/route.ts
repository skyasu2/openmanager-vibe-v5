import { ACTIVE_SERVER_CONFIG } from '@/config/serverConfig';
import { logger } from '@/lib/logger';
import { createServerDataGenerator } from '@/services/data-generator/RealServerDataGenerator';
import { NextRequest, NextResponse } from 'next/server';

// 기본 데이터 검증 함수
async function getDataValidator() {
  // 기본 검증 로직 사용
  return {
    validateServerData: (data: any) => {
      // 기본적인 서버 데이터 검증
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid server data format');
      }
      return true;
    },
    validateServerArray: (servers: any[]) => {
      // 기본적인 서버 배열 검증
      if (!Array.isArray(servers)) {
        throw new Error('Servers must be an array');
      }
      return true;
    },
  };
}

// 기본 경고 생성 함수 (폴백용)
function createBasicFallbackWarning(dataSource: string, reason: string) {
  return {
    level: 'CRITICAL',
    type: 'DATA_FALLBACK_WARNING',
    message: '서버 데이터 생성기 실패 - 목업 데이터 사용 중',
    dataSource,
    fallbackReason: reason,
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
    actionRequired: '실제 데이터 소스 연결 필요',
    productionImpact:
      process.env.NODE_ENV === 'production' ||
        process.env.VERCEL_ENV === 'production'
        ? 'CRITICAL'
        : 'LOW',
  };
}

// 🚨 경고: 목업 서버 데이터 생성 (프로덕션에서 사용 금지)
const generateMockServers = () => {
  const servers: any[] = [];
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
      hostname: `server-${i}.example.com`, // 🚨 의심스러운 호스트네임
      status,
      location,
      cpu: Math.floor(Math.random() * 100),
      memory: Math.floor(Math.random() * 100),
      disk: Math.floor(Math.random() * 100),
      network: Math.floor(Math.random() * 1000),
      uptime: Math.floor(Math.random() * 86400 * 30),
      services: serviceSet,
      lastUpdate: new Date().toISOString(),
      // 🏷️ 목업 데이터 명시적 표시
      _isMockData: true,
      _dataSource: 'fallback',
      _warningLevel: 'CRITICAL',
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

    // 🚫 서버리스 호환: 요청별 데이터 생성기 생성
    const generator = createServerDataGenerator({
      count: ACTIVE_SERVER_CONFIG.maxServers,
      includeMetrics: true,
    });

    // 🔧 서버 데이터 생성 (요청별)
    let servers = await generator.generateServers();
    let dataSource = 'RequestScopedServerDataGenerator';

    console.log(`📊 요청별 서버 데이터 생성 완료: ${servers.length}개`);

    // 🛡️ 데이터 무결성 검증
    if (!servers || servers.length === 0) {
      console.log('🔄 빈 데이터 감지, 재시도...');

      // 새 인스턴스로 재시도
      const newGenerator = createServerDataGenerator({
        count: ACTIVE_SERVER_CONFIG.maxServers,
        includeMetrics: true,
      });
      servers = await newGenerator.generateServers();

      if (servers && servers.length > 0) {
        console.log(`✅ 재시도 성공: ${servers.length}개 서버 로드됨`);
        dataSource = 'RequestScopedServerDataGenerator-Retry';
      } else {
        // 경고 생성
        const warning = createBasicFallbackWarning(
          'RequestScopedServerDataGenerator',
          '재시도 후에도 서버 데이터가 존재하지 않음'
        );

        // 프로덕션 환경에서는 에러 발생
        if (
          process.env.NODE_ENV === 'production' ||
          process.env.VERCEL_ENV === 'production'
        ) {
          console.error('💀 PRODUCTION_DATA_ERROR:', warning);
          return NextResponse.json(
            {
              success: false,
              error: 'PRODUCTION_DATA_ERROR',
              message: '프로덕션 환경에서 실제 서버 데이터 필수',
              warning,
              actionRequired: '실제 데이터 소스 연결 필요',
            },
            {
              status: 500,
              headers: {
                'X-Data-Fallback-Warning': 'true',
                'X-Production-Error': 'true',
              },
            }
          );
        }

        // 개발 환경에서만 목업 데이터 사용
        console.warn('⚠️ DATA_FALLBACK_WARNING:', warning);
        servers = generateMockServers();
        dataSource = 'fallback';
      }
    }

    // 데이터 검증
    const validator = await getDataValidator();
    try {
      validator.validateServerArray(servers);
      logger.info('서버 데이터 검증 완료', {
        serverCount: servers.length,
        dataSource,
      });
    } catch (validationError) {
      logger.warn('서버 데이터 검증 실패', {
        error: validationError.message,
        serverCount: servers.length,
      });
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
      online: servers.filter(s => s.status === 'healthy').length,
      warning: servers.filter(s => s.status === 'warning').length,
      offline: servers.filter(s => s.status === 'critical').length,
      avgCpu: Math.round(
        servers.reduce((sum, s) => sum + (s.cpu || 0), 0) / servers.length
      ),
      avgMemory: Math.round(
        servers.reduce((sum, s) => sum + (s.memory || 0), 0) / servers.length
      ),
      avgDisk: Math.round(
        servers.reduce((sum, s) => sum + (s.disk || 0), 0) / servers.length
      ),
    };

    // 응답 헤더 설정
    const responseHeaders: Record<string, string> = {};
    if (dataSource === 'fallback') {
      responseHeaders['X-Data-Fallback-Warning'] = 'true';
      responseHeaders['X-Data-Source'] = 'mock';
      responseHeaders['X-Warning-Level'] = 'CRITICAL';
    } else {
      responseHeaders['X-Data-Source'] = 'serverless';
      responseHeaders['X-Generator-Type'] = 'request-scoped';
    }

    return NextResponse.json(
      {
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
        // 🛡️ 데이터 무결성 정보 추가
        dataIntegrity: {
          dataSource,
          isMockData: dataSource === 'fallback',
          environment: process.env.NODE_ENV,
          warningLevel: dataSource === 'fallback' ? 'CRITICAL' : 'NONE',
          serverless: true,
        },
        timestamp: Date.now(),
      },
      {
        headers: responseHeaders,
      }
    );
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
