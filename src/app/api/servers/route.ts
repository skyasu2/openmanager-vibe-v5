import { detectEnvironment } from '@/config/environment';
import { ERROR_STATE_METADATA, STATIC_ERROR_SERVERS } from '@/config/fallback-data';
import { GCPRealDataService } from '@/services/gcp/GCPRealDataService';
import { GCPServerDataGenerator } from '@/services/gcp/GCPServerDataGenerator';
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

/**
 * 🌐 서버 데이터 API - 명시적 에러 상태 반환
 * ⚠️ Silent fallback 금지 - 모든 실패는 명확한 에러로 표시
 */
export async function GET(request: NextRequest) {
  try {
    const env = detectEnvironment();

    // 🌐 Vercel 환경: GCP 실제 데이터만 사용
    if (env.IS_VERCEL) {
      console.log('🌐 Vercel 환경: GCP 실제 서버 데이터 요청');

      try {
        // ✅ GCP 실제 데이터 사용 시도
        const gcpService = GCPRealDataService.getInstance();
        await gcpService.initialize();
        const gcpResponse = await gcpService.getRealServerMetrics();

        // GCP 데이터 조회 성공
        if (gcpResponse.success && !gcpResponse.isErrorState) {
          return NextResponse.json({
            success: true,
            data: gcpResponse.data,
            source: 'gcp-real-data',
            timestamp: new Date().toISOString(),
            environment: 'vercel',
            isErrorState: false,
            message: '✅ GCP 실제 데이터 조회 성공'
          });
        }

        // ❌ GCP 실패 시 명시적 에러 응답 (Silent fallback 금지)
        return NextResponse.json({
          success: false,
          data: gcpResponse.data, // 정적 에러 서버 데이터
          source: 'static-error',
          timestamp: new Date().toISOString(),
          environment: 'vercel',
          isErrorState: true,
          errorMetadata: gcpResponse.errorMetadata,
          message: '🚨 GCP 연결 실패 - 에러 상태 데이터 표시',
          userMessage: '⚠️ 실제 서버 데이터를 가져올 수 없습니다. 관리자에게 문의하세요.',
          recommendations: [
            'GCP 연결 상태를 확인하세요',
            '잠시 후 다시 시도하세요',
            '문제가 지속되면 시스템 관리자에게 문의하세요'
          ]
        }, { status: 503 }); // Service Unavailable
      } catch (error) {
        console.error('❌ GCP 서비스 호출 실패:', error);

        // ❌ 치명적 오류 시 정적 에러 데이터 반환
        return NextResponse.json({
          success: false,
          data: STATIC_ERROR_SERVERS,
          source: 'static-error',
          timestamp: new Date().toISOString(),
          environment: 'vercel',
          isErrorState: true,
          errorMetadata: {
            ...ERROR_STATE_METADATA,
            originalError: error instanceof Error ? error.message : String(error)
          },
          message: '🚨 서버 데이터 API 호출 실패',
          userMessage: '⚠️ 서버와 연결할 수 없습니다. 잠시 후 다시 시도해주세요.',
          recommendations: [
            '페이지를 새로고침하세요',
            '네트워크 연결을 확인하세요',
            '시스템 관리자에게 문의하세요'
          ]
        }, { status: 500 });
      }
    }

    // 🏠 로컬 환경: 목업 데이터 사용
    console.log('🏠 로컬 환경: 목업 서버 데이터 사용');

    try {
      const generator = RealServerDataGenerator.getInstance();

      // 목업 생성기 초기화 확인
      if (!generator.isInitialized) {
        await generator.initialize();
      }

      const servers = await generator.getAllServers();

      return NextResponse.json({
        success: true,
        data: servers,
        source: 'mock-data',
        timestamp: new Date().toISOString(),
        environment: 'local',
        isErrorState: false,
        message: '✅ 로컬 목업 데이터 조회 성공'
      });
    } catch (error) {
      console.error('❌ 로컬 목업 데이터 생성 실패:', error);

      // ❌ 로컬에서도 실패 시 명시적 에러 반환
      return NextResponse.json({
        success: false,
        data: STATIC_ERROR_SERVERS,
        source: 'static-error',
        timestamp: new Date().toISOString(),
        environment: 'local',
        isErrorState: true,
        errorMetadata: {
          ...ERROR_STATE_METADATA,
          originalError: error instanceof Error ? error.message : String(error)
        },
        message: '🚨 로컬 목업 데이터 생성 실패',
        userMessage: '⚠️ 개발 환경에서 데이터를 생성할 수 없습니다.',
        recommendations: [
          '개발 서버를 재시작하세요',
          '환경 설정을 확인하세요',
          '로그를 확인하세요'
        ]
      }, { status: 500 });
    }

  } catch (error) {
    console.error('❌ 서버 데이터 API 치명적 오류:', error);

    return NextResponse.json({
      success: false,
      data: [],
      source: 'critical-error',
      timestamp: new Date().toISOString(),
      isErrorState: true,
      errorMetadata: {
        ...ERROR_STATE_METADATA,
        severity: 'CRITICAL',
        originalError: error instanceof Error ? error.message : String(error)
      },
      message: '🚨 API 치명적 오류 발생',
      userMessage: '⚠️ 서버에서 심각한 오류가 발생했습니다.',
      recommendations: [
        '페이지를 새로고침하세요',
        '잠시 후 다시 시도하세요',
        '즉시 시스템 관리자에게 문의하세요'
      ]
    }, { status: 500 });
  }
}

/**
 * 🌐 GCP 실제 서버 데이터 조회
 */
async function getGCPRealServerData(): Promise<any[]> {
  try {
    // GCP 실제 데이터 생성기 사용
    const gcpGenerator = new GCPServerDataGenerator(
      null as any, // Firestore client (실제 구현 시 연결)
      null as any  // Cloud Storage client (실제 구현 시 연결)
    );

    // 실제 GCP 메트릭 조회 (임시로 빈 배열 반환)
    // TODO: 실제 GCP Monitoring API 연동
    console.log('🌐 GCP 실제 서버 메트릭 조회 중...');

    return [
      {
        id: 'gcp-server-001',
        name: 'GCP Production Server 01',
        type: 'compute-engine',
        status: 'healthy',
        metrics: {
          cpu: { usage: 45 },
          memory: { usage: 62 },
          disk: { usage: 38 },
          network: { rx: 1024, tx: 512 }
        },
        source: 'gcp-monitoring',
        lastUpdated: new Date().toISOString()
      }
    ];

  } catch (error) {
    console.error('❌ GCP 실제 데이터 조회 실패:', error);
    return [];
  }
}
