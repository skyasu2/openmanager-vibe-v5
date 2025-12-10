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

  // 서버 타입 할당 설정 (동적 서버 수 지원)
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
  // 🎯 서버 상태 분포 비율 (DEFAULT_SERVER_COUNT=15 기준)
  const criticalPercent = 0.25; // 25% 심각 상태
  const warningPercent = 0.375; // 37.5% 경고 상태
  const tolerancePercent = 0.05; // 5% 변동값 (±5%)

  // 심각 상태 서버 수 계산 (비율 기반)
  const criticalCount = Math.max(1, Math.floor(serverCount * criticalPercent));

  // 페이지네이션 설정 (서버 개수에 따라 조정)
  const defaultPageSize =
    serverCount <= 15 ? serverCount : Math.min(12, Math.ceil(serverCount / 2));
  const maxPageSize = Math.min(50, serverCount);

  // 성능 설정 (서버 개수에 따라 조정)
  const batchSize = Math.min(100, Math.max(10, Math.ceil(serverCount / 2)));
  const bufferSize = Math.min(1000, serverCount * 10);

  // 캐시 설정 (5-10분 갱신 주기 최적화 - Vercel 무료 티어 절약)
  const updateInterval = calculateOptimalCollectionInterval(); // 5-10분 동적 계산
  const expireTime = 300000; // 5분 고정

  return {
    maxServers: serverCount,
    scenario: {
      criticalCount,
      warningPercent,
      tolerancePercent,
    },
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
  // Edge Runtime 호환성을 위한 안전한 메모리 체크
  try {
    // Edge Runtime 완전 호환성 보장 (process 접근 차단)
    if (typeof window === 'undefined' && 
        typeof process !== 'undefined' && 
        process.env?.NODE_ENV !== 'production' &&
        process.memoryUsage && 
        typeof process.memoryUsage === 'function') {
      // Edge Runtime에서는 이 코드에 절대 도달하지 않음
      const memoryUsage = process.memoryUsage();
      const usagePercent = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;

      // 🎯 데이터 생성 간격 (30-35초 범위)
      if (usagePercent > 80) return 35000; // 높은 사용률: 35초
      if (usagePercent > 60) return 33000; // 중간 사용률: 33초
      return 30000; // 낮은 사용률: 30초
    }
  } catch {
    // Edge Runtime에서는 process.memoryUsage()가 지원되지 않음
    console.log('🔧 Edge Runtime 환경 - 기본 업데이트 간격 사용');
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
  // Edge Runtime 호환성을 위한 안전한 메모리 체크
  try {
    // Edge Runtime 완전 호환성 보장 (서버 사이드 안전 처리)
    if (typeof window === 'undefined' && 
        typeof process !== 'undefined' && 
        process.env?.NODE_ENV !== 'production' &&
        process.memoryUsage && 
        typeof process.memoryUsage === 'function') {
      // Edge Runtime에서는 이 코드에 절대 도달하지 않음
      const memoryUsage = process.memoryUsage();
      const usagePercent = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;

      // 🚨 무료 티어 최적화: 5-10분 범위로 대폭 증가
      if (usagePercent > 80) return 600000; // 높은 사용률: 10분
      if (usagePercent > 60) return 450000; // 중간 사용률: 7.5분
      return 300000; // 낮은 사용률: 5분
    }
  } catch {
    // Edge Runtime에서는 process.memoryUsage()가 지원되지 않음
    console.log('🔧 Edge Runtime 환경 - 데이터 수집 간격 기본값 사용');
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
 * 🎯 기본 서버 설정 (DEFAULT_SERVER_COUNT 기준)
 */
export const DEFAULT_SERVER_CONFIG =
  calculateServerConfig(DEFAULT_SERVER_COUNT);

/**
 * 🌍 환경별 서버 설정 (로컬/Vercel 통일)
 */
export function getEnvironmentServerConfig(): ServerGenerationConfig {
  // 환경 변수에서 서버 개수 읽기
  const envServerCount = process.env.SERVER_COUNT
    ? parseInt(process.env.SERVER_COUNT)
    : undefined;
  const envMaxServers = process.env.MAX_SERVERS
    ? parseInt(process.env.MAX_SERVERS)
    : undefined;

  // 기본값: DEFAULT_SERVER_COUNT (15개)
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
 * 🏢 서버 인덱스로 타입 가져오기
 */
export function getServerTypeByIndex(index: number): string {
  const config = ACTIVE_SERVER_CONFIG;
  if (
    config.serverTypes &&
    index >= 0 &&
    index < config.serverTypes.orderedTypes.length
  ) {
    return config.serverTypes.orderedTypes[index] ?? 'web';
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
  return fallbackTypes[index % fallbackTypes.length] ?? 'web';
}

/**
 * 🚦 서버 인덱스로 상태 가져오기
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
 * 📋 전체 서버 정보 배열 생성 (현재: 15개)
 */
export function getAllServersInfo() {
  return Array.from({ length: ACTIVE_SERVER_CONFIG.maxServers }, (_, index) =>
    getServerInfoByIndex(index)
  );
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

  // 서버 타입 정보 로깅
  if (config.serverTypes) {
    console.log('  🏢 서버 타입 할당:');
    const { serverTypes } = config;
    serverTypes.orderedTypes.forEach((type, index) => {
      let status = '🟢 정상';
      if (serverTypes.statusMapping.critical.includes(index)) {
        status = '🔴 심각';
      } else if (serverTypes.statusMapping.warning.includes(index)) {
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
