/**
 * 🎯 서버 데이터 생성 중앙 설정
 *
 * 서버 개수를 중앙에서 관리하고, 이에 따라 다른 설정들이 자동으로 조정됩니다.
 */

export interface ServerGenerationConfig {
  // 기본 서버 설정
  maxServers: number;

  // 시나리오 설정 (서버 개수에 따라 자동 계산)
  scenario: {
    criticalCount: number; // 심각한 상태 서버 수
    warningPercent: number; // 경고 상태 서버 비율
    tolerancePercent: number; // 허용 오차 비율
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
 * 🎯 기본 서버 개수 (15개 유지 - 30-40초 갱신 주기)
 */
export const DEFAULT_SERVER_COUNT = 15;

/**
 * 🧮 서버 개수에 따른 자동 설정 계산
 */
export function calculateServerConfig(
  serverCount: number = DEFAULT_SERVER_COUNT
): ServerGenerationConfig {
  // 🎯 사용자 요구사항에 따른 서버 상태 분포 (15개 기준)
  // 장애(Critical) 서버: 2~3대 (13% ~ 20%)
  // 경고(Warning) 서버: 3~5대 (20% ~ 33%)

  // 🚨 심각 상태 서버 수 계산 (13% ~ 20% 범위에서 랜덤)
  const criticalPercent = Math.random() * 0.07 + 0.13; // 13% ~ 20%
  const criticalCount = Math.max(1, Math.floor(serverCount * criticalPercent));

  // ⚠️ 경고 상태 서버 비율 (20% ~ 33% 범위에서 랜덤)
  const warningPercent = Math.random() * 0.13 + 0.2; // 20% ~ 33%

  // 🎯 오차 허용 범위 (±5%)
  const tolerancePercent = 0.05;

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
    const memory = (performance as any).memory;
    const usagePercent = (memory.usedJSHeapSize / memory.totalJSHeapSize) * 100;

    if (usagePercent > 80) return 35000; // 높은 사용률: 35초
    if (usagePercent > 60) return 33000; // 중간 사용률: 33초
    return 30000; // 낮은 사용률: 30초
  }

  return 30000; // 기본값: 30초 (생성 간격)
}

/**
 * 🎯 데이터 수집 최적 간격 계산 (35-40초 범위)
 * 생성 간격보다 5초 늦게 시작하여 부담 분산
 */
export function calculateOptimalCollectionInterval(): number {
  const generationInterval = calculateOptimalUpdateInterval();
  // 생성 간격 + 5초 = 수집 간격
  return generationInterval + 5000;
}

/**
 * 🎯 기본 서버 설정 (20개 서버 기준)
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

  // 기본값: 15개 (로컬/Vercel 통일)
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
  console.log(
    `  📄 페이지 크기: ${config.pagination.defaultPageSize}개 (최대 ${config.pagination.maxPageSize}개)`
  );
  console.log(`  🔄 업데이트 간격: ${config.cache.updateInterval / 1000}초`);
  console.log(`  ⚡ 배치 크기: ${config.performance.batchSize}개`);
}
