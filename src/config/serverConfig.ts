/**
 * 🎯 서버 데이터 생성 중앙 설정
 *
 * 서버 개수를 중앙에서 관리하고, 이에 따라 다른 설정들이 자동으로 조정됩니다.
 */

interface PerformanceMemory {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
}

interface PerformanceWithMemory extends Performance {
  memory?: PerformanceMemory;
}

export interface ServerGenerationConfig {
  // 기본 서버 설정
  maxServers: number;

  // 시나리오 설정 (서버 개수에 따라 자동 계산)
  scenario: {
    criticalCount: number; // 심각한 상태 서버 수
    warningPercent: number; // 경고 상태 서버 비율
    tolerancePercent: number; // 허용 오차 비율
  };

  // 서버 타입 할당 설정 (8개 서버 전용)
  serverTypes?: {
    orderedTypes: string[]; // 서버 타입 순서대로 할당
    statusMapping: {
      critical: number[]; // 심각 상태 서버 인덱스 배열
      warning: number[]; // 경고 상태 서버 인덱스 배열
      normal: number[]; // 정상 상태 서버 인덱스 배열
    };
  };

  // 페이지네이션 설정
  pagination: {
    defaultPageSize: number; // 기본 페이지 크기
    maxPageSize: number; // 최대 페이지 크기
  };

  // 캐시 설정
  cache: {
    updateInterval: number; // 업데이트 간격 (ms)
    expireTime: number; // 캐시 만료 시간 (ms)
  };

  // 성능 설정
  performance: {
    batchSize: number; // 배치 처리 크기
    bufferSize: number; // 버퍼 크기
  };
}

/**
 * 🎯 기본 서버 개수 (15개로 확장 - 더 현실적인 장애 시나리오)
 */
export const DEFAULT_SERVER_COUNT = 15;

/**
 * 🧮 서버 개수에 따른 자동 설정 계산
 */
export function calculateServerConfig(
  serverCount: number = DEFAULT_SERVER_COUNT
): ServerGenerationConfig {
  // 🎯 사용자 요구사항에 따른 서버 상태 분포 (8개 기준)
  const criticalPercent = 0.25; // 25% 심각 상태 (8개 중 2개)
  const warningPercent = 0.375; // 37.5% 경고 상태 (8개 중 3개)
  const tolerancePercent = 0.05; // 5% 변동값 (±5%)

  // 심각 상태 서버 수 계산 (8개 기준 2개 고정)
  const criticalCount =
    serverCount === 8
      ? 2
      : Math.max(1, Math.floor(serverCount * criticalPercent));

  // 페이지네이션 설정 (서버 개수에 따라 조정)
  const defaultPageSize =
    serverCount <= 15 ? serverCount : Math.min(12, Math.ceil(serverCount / 2));
  const maxPageSize = Math.min(50, serverCount);

  // 성능 설정 (서버 개수에 따라 조정)
  const batchSize = Math.min(100, Math.max(10, Math.ceil(serverCount / 2)));
  const bufferSize = Math.min(1000, serverCount * 10);

  // 캐시 설정 (30-40초 갱신 주기 최적화)
  const updateInterval = calculateOptimalUpdateInterval(); // 동적 계산
  const expireTime = 60000; // 1분 고정

  return {
    maxServers: serverCount,
    scenario: {
      criticalCount,
      warningPercent,
      tolerancePercent,
    },
    // 8개 서버 전용 타입 할당 설정
    serverTypes:
      serverCount === 8
        ? {
            orderedTypes: [
              'web', // 웹 서버 (nginx, apache)
              'app', // 애플리케이션 서버
              'api', // API 서버 (REST, GraphQL)
              'database', // 데이터베이스 서버
              'cache', // 캐시 서버 (Redis, Memcached)
              'storage', // 스토리지 서버
              'load-balancer', // 로드밸런서
              'backup', // 백업 서버
            ],
            statusMapping: {
              critical: [3, 6], // database(인덱스 3), load-balancer(인덱스 6) - 심각 2대
              warning: [1, 4, 7], // app(인덱스 1), cache(인덱스 4), backup(인덱스 7) - 경고 3대
              normal: [0, 2, 5], // web(인덱스 0), api(인덱스 2), storage(인덱스 5) - 정상 3대
            },
          }
        : undefined,
    pagination: {
      defaultPageSize,
      maxPageSize,
    },
    cache: {
      updateInterval,
      expireTime,
    },
    performance: {
      batchSize,
      bufferSize,
    },
  };
}

/**
 * 🧠 메모리 사용량 기반 최적 업데이트 간격 계산 (30-40초 범위)
 * 🎯 생성과 수집 분리 전략: 생성 30-35초, 수집 35-40초
 */
export function calculateOptimalUpdateInterval(): number {
  // 서버 사이드에서는 Node.js process.memoryUsage() 사용
  if (typeof process !== 'undefined' && process.memoryUsage) {
    const memoryUsage = process.memoryUsage();
    const usagePercent = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;

    // 🎯 데이터 생성 간격 (30-35초 범위)
    if (usagePercent > 80) return 35000; // 높은 사용률: 35초
    if (usagePercent > 60) return 33000; // 중간 사용률: 33초
    return 30000; // 낮은 사용률: 30초
  }

  // 클라이언트 사이드에서는 performance.memory 사용
  if (typeof window !== 'undefined' && 'memory' in performance) {
    const memory = (performance as PerformanceWithMemory).memory;
    if (memory) {
      const usagePercent =
        (memory.usedJSHeapSize / memory.totalJSHeapSize) * 100;

      if (usagePercent > 80) return 35000; // 높은 사용률: 35초
      if (usagePercent > 60) return 33000; // 중간 사용률: 33초
      return 30000; // 낮은 사용률: 30초
    }
  }

  return 30000; // 기본값: 30초 (생성 간격)
}

/**
 * 🎯 데이터 수집 최적화 간격 계산 (5-10분 범위)
 * 🚨 무료 티어 절약: 기존 35-40초 → 5-10분으로 변경
 */
export function calculateOptimalCollectionInterval(): number {
  // 서버 사이드에서는 Node.js process.memoryUsage() 사용
  if (typeof process !== 'undefined' && process.memoryUsage) {
    const memoryUsage = process.memoryUsage();
    const usagePercent = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;

    // 🚨 무료 티어 최적화: 5-10분 범위로 대폭 증가
    if (usagePercent > 80) return 600000; // 높은 사용률: 10분
    if (usagePercent > 60) return 450000; // 중간 사용률: 7.5분
    return 300000; // 낮은 사용률: 5분
  }

  // 클라이언트 사이드에서는 performance.memory 사용
  if (typeof window !== 'undefined' && 'memory' in performance) {
    const memory = (performance as PerformanceWithMemory).memory;
    if (memory) {
      const usagePercent =
        (memory.usedJSHeapSize / memory.totalJSHeapSize) * 100;

      if (usagePercent > 80) return 600000; // 높은 사용률: 10분
      if (usagePercent > 60) return 450000; // 중간 사용률: 7.5분
      return 300000; // 낮은 사용률: 5분
    }
  }

  return process.env.DATA_COLLECTION_INTERVAL
    ? parseInt(process.env.DATA_COLLECTION_INTERVAL)
    : 300000; // 환경변수 우선, 기본값: 5분
}

/**
 * 🎯 기본 서버 설정 (8개 서버 기준)
 */
export const DEFAULT_SERVER_CONFIG =
  calculateServerConfig(DEFAULT_SERVER_COUNT);

/**
 * 🌍 환경별 서버 설정 (로컬/Vercel 통일, 8개 서버 전용)
 */
export function getEnvironmentServerConfig(): ServerGenerationConfig {
  // 환경 변수에서 서버 개수 읽기
  const envServerCount = process.env.SERVER_COUNT
    ? parseInt(process.env.SERVER_COUNT)
    : undefined;
  const envMaxServers = process.env.MAX_SERVERS
    ? parseInt(process.env.MAX_SERVERS)
    : undefined;

  // 기본값: 8개 고정 (사용자 요구사항)
  let serverCount = DEFAULT_SERVER_COUNT;

  // 환경변수로 오버라이드 가능
  if (envServerCount) {
    serverCount = envServerCount;
  } else if (envMaxServers) {
    serverCount = envMaxServers;
  }

  // 모든 환경에서 동일한 설정 사용
  return calculateServerConfig(serverCount);
}

/**
 * 🎯 현재 활성 서버 설정
 */
export const ACTIVE_SERVER_CONFIG = getEnvironmentServerConfig();

/**
 * 🏢 서버 인덱스로 타입 가져오기 (0-7 인덱스)
 */
export function getServerTypeByIndex(index: number): string {
  const config = ACTIVE_SERVER_CONFIG;
  if (
    config.serverTypes &&
    index >= 0 &&
    index < config.serverTypes.orderedTypes.length
  ) {
    return config.serverTypes.orderedTypes[index];
  }
  // 폴백: 기본 타입
  const fallbackTypes = [
    'web',
    'app',
    'api',
    'database',
    'cache',
    'storage',
    'load-balancer',
    'backup',
  ];
  return fallbackTypes[index % fallbackTypes.length];
}

/**
 * 🚦 서버 인덱스로 상태 가져오기 (0-7 인덱스)
 */
export function getServerStatusByIndex(
  index: number
): 'online' | 'warning' | 'critical' {
  const config = ACTIVE_SERVER_CONFIG;
  if (config.serverTypes) {
    if (config.serverTypes.statusMapping.critical.includes(index)) {
      return 'critical';
    }
    if (config.serverTypes.statusMapping.warning.includes(index)) {
      return 'warning';
    }
    if (config.serverTypes.statusMapping.normal.includes(index)) {
      return 'online';
    }
  }
  // 폴백: 기본 상태 (인덱스 기반)
  if (index <= 1) return 'critical'; // 처음 2개
  if (index <= 4) return 'warning'; // 다음 3개
  return 'online'; // 나머지 3개
}

/**
 * 📊 서버 인덱스별 전체 정보 가져오기
 */
export function getServerInfoByIndex(index: number) {
  return {
    index,
    type: getServerTypeByIndex(index),
    status: getServerStatusByIndex(index),
    name: `${getServerTypeByIndex(index)}-${String(index + 1).padStart(2, '0')}`,
  };
}

/**
 * 📋 전체 8개 서버 정보 배열 생성
 */
export function getAllServersInfo() {
  return Array.from({ length: 8 }, (_, index) => getServerInfoByIndex(index));
}

/**
 * 📊 서버 설정 정보 로깅
 */
export function logServerConfig(
  config: ServerGenerationConfig = ACTIVE_SERVER_CONFIG
): void {
  console.log('🎯 서버 데이터 생성 설정:');
  console.log(`  📊 총 서버 수: ${config.maxServers}개`);
  console.log(
    `  🚨 심각 상태: ${config.scenario.criticalCount}개 (${Math.round((config.scenario.criticalCount / config.maxServers) * 100)}%)`
  );
  console.log(
    `  ⚠️  경고 상태: ${Math.round(config.scenario.warningPercent * 100)}%`
  );

  // 8개 서버 타입 정보 추가 로깅
  if (config.serverTypes) {
    console.log('  🏢 서버 타입 할당:');
    config.serverTypes.orderedTypes.forEach((type, index) => {
      let status = '🟢 정상';
      if (config.serverTypes.statusMapping.critical.includes(index)) {
        status = '🔴 심각';
      } else if (config.serverTypes.statusMapping.warning.includes(index)) {
        status = '🟡 경고';
      }
      console.log(`    ${index + 1}. ${type} (${status})`);
    });
  }

  console.log(
    `  📄 페이지 크기: ${config.pagination.defaultPageSize}개 (최대 ${config.pagination.maxPageSize}개)`
  );
  console.log(`  🔄 업데이트 간격: ${config.cache.updateInterval / 1000}초`);
  console.log(`  ⚡ 배치 크기: ${config.performance.batchSize}개`);

  // 전체 서버 정보 로깅
  console.log('\n  📋 전체 서버 정보:');
  getAllServersInfo().forEach((server) => {
    const statusIcon =
      server.status === 'critical'
        ? '🔴'
        : server.status === 'warning'
          ? '🟡'
          : '🟢';
    console.log(`    ${server.name}: ${server.type} ${statusIcon}`);
  });
}
