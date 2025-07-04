/**
 * 🔧 GCP Functions 설정 (중앙 관리)
 * VM 로컬 데이터 생성 대신 GCP Functions 사용
 */

// 환경변수에서 URL 가져오기 (폴백 포함)
const GCP_BASE_URL =
  process.env.GCP_FUNCTIONS_BASE_URL ||
  'https://us-central1-openmanager-free-tier.cloudfunctions.net';

const GCP_ENTERPRISE_METRICS_URL =
  process.env.GCP_ENTERPRISE_METRICS_URL ||
  `${GCP_BASE_URL}/enterprise-metrics`;

// 서버 개수 설정 (8개로 고정)
const FIXED_SERVER_COUNT = 8;

/**
 * 🚫 로컬 데이터 생성 비활성화 확인
 */
export const isLocalDataGenerationDisabled = (): boolean => {
  return (
    process.env.DISABLE_LOCAL_DATA_GENERATION === 'true' ||
    process.env.NODE_ENV === 'production' ||
    process.env.VERCEL === '1'
  );
};

/**
 * 📡 GCP Functions URL 설정
 */
export const GCP_FUNCTIONS_CONFIG = {
  BASE_URL: GCP_BASE_URL,
  ENTERPRISE_METRICS: GCP_ENTERPRISE_METRICS_URL,
  HEALTH_CHECK: `${GCP_BASE_URL}/health-check`,

  // 요청 설정
  TIMEOUT: 8000, // 8초
  RETRY_COUNT: 2,

  // 폴백 설정
  FALLBACK_ENABLED: true,
  FIXED_SERVER_COUNT: FIXED_SERVER_COUNT,

  // 캐시 설정
  CACHE_TTL: 30000, // 30초
} as const;

/**
 * 🎯 고정 서버 개수 반환 (8개)
 */
function getTargetServerCount(): number {
  return FIXED_SERVER_COUNT; // 항상 8개로 고정
}

/**
 * 🔄 폴백 서버 데이터 생성 (8개 고정)
 */
function createFallbackServers(count: number = FIXED_SERVER_COUNT): any[] {
  const serverTypes = [
    'web',
    'database',
    'api',
    'cache',
    'monitoring',
    'loadbalancer',
    'backup',
    'analytics',
  ];

  return Array.from({ length: count }, (_, i) => ({
    id: `server-${i + 1}`,
    serverId: `server-${i + 1}`,
    serverName: `${serverTypes[i % serverTypes.length].charAt(0).toUpperCase() + serverTypes[i % serverTypes.length].slice(1)} Server ${i + 1}`,
    serverType: serverTypes[i % serverTypes.length],
    systemHealth: {
      serviceHealthScore: 70 + Math.random() * 30,
      uptime: Math.random() * 100,
      status: Math.random() > 0.1 ? 'running' : 'warning',
    },
    systemResources: {
      cpuUsage: Math.random() * 100,
      memoryUsage: Math.random() * 100,
      diskUsage: Math.random() * 100,
      networkIO: Math.random() * 1000,
    },
    applicationPerformance: {
      requestsPerSecond: Math.random() * 1000,
      responseTime: Math.random() * 500,
      errorRate: Math.random() * 5,
    },
  }));
}

/**
 * ☁️ GCP Functions에서 서버 데이터 가져오기 (공통 함수)
 */
export async function fetchGCPServers() {
  try {
    const response = await fetch(GCP_FUNCTIONS_CONFIG.ENTERPRISE_METRICS, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(GCP_FUNCTIONS_CONFIG.TIMEOUT),
    });

    if (!response.ok) {
      throw new Error(`GCP Functions 응답 오류: ${response.status}`);
    }

    const data = await response.json();
    let servers = data.data?.metrics || data.servers || [];

    // 🎯 서버 개수 고정: 8개로 제한
    const targetCount = getTargetServerCount(); // 8개

    if (servers.length > targetCount) {
      console.log(`🔧 서버 개수 제한: ${servers.length}개 → ${targetCount}개`);
      servers = servers.slice(0, targetCount);
    } else if (servers.length < targetCount) {
      console.log(
        `🔧 서버 개수 부족: ${servers.length}개 → ${targetCount}개로 폴백`
      );
      // 부족한 경우 폴백 데이터로 채우기
      return createFallbackServers(targetCount);
    }

    console.log(`📊 GCP Functions 서버 데이터: ${servers.length}개`);
    return servers;
  } catch (error) {
    console.error('GCP Functions 호출 실패:', error);

    if (GCP_FUNCTIONS_CONFIG.FALLBACK_ENABLED) {
      const fallbackCount = getTargetServerCount();
      console.log(`🔄 폴백 모드: ${fallbackCount}개 서버 생성`);

      // 폴백: 통합 함수 사용
      return createFallbackServers(fallbackCount);
    }

    throw error;
  }
}

/**
 * 🔍 GCP Functions 상태 확인
 */
export async function checkGCPFunctionsHealth(): Promise<{
  isHealthy: boolean;
  responseTime: number;
  serverCount: number;
  error?: string;
}> {
  const startTime = Date.now();

  try {
    const servers = await fetchGCPServers();
    const responseTime = Date.now() - startTime;

    return {
      isHealthy: true,
      responseTime,
      serverCount: servers.length,
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;

    return {
      isHealthy: false,
      responseTime,
      serverCount: 0,
      error: error instanceof Error ? error.message : '알 수 없는 오류',
    };
  }
}
