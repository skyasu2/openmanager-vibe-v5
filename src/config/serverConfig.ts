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
 * 🎯 기본 서버 개수 (20개로 변경)
 */
export const DEFAULT_SERVER_COUNT = 20;

/**
 * 🧮 서버 개수에 따른 자동 설정 계산
 */
export function calculateServerConfig(
  serverCount: number = DEFAULT_SERVER_COUNT
): ServerGenerationConfig {
  // 서버 개수에 따른 비율 계산
  const criticalCount = Math.max(2, Math.floor(serverCount * 0.15)); // 15% (최소 2개)
  const warningPercent = 0.25; // 25%
  const tolerancePercent = 0.05; // 5%

  // 페이지네이션 설정 (서버 개수에 따라 조정)
  const defaultPageSize =
    serverCount <= 10 ? serverCount : Math.min(10, Math.ceil(serverCount / 2));
  const maxPageSize = Math.min(50, serverCount);

  // 성능 설정 (서버 개수에 따라 조정)
  const batchSize = Math.min(100, Math.max(10, Math.ceil(serverCount / 2)));
  const bufferSize = Math.min(1000, serverCount * 10);

  // 캐시 설정 (서버 개수가 많을수록 더 자주 업데이트)
  const updateInterval = serverCount > 15 ? 15000 : 20000; // 15초 또는 20초
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
 * 🎯 기본 서버 설정 (20개 서버 기준)
 */
export const DEFAULT_SERVER_CONFIG =
  calculateServerConfig(DEFAULT_SERVER_COUNT);

/**
 * 🌍 환경별 서버 설정
 */
export function getEnvironmentServerConfig(): ServerGenerationConfig {
  // 환경 변수에서 서버 개수 읽기
  const envServerCount = process.env.SERVER_COUNT
    ? parseInt(process.env.SERVER_COUNT)
    : undefined;
  const envMaxServers = process.env.MAX_SERVERS
    ? parseInt(process.env.MAX_SERVERS)
    : undefined;

  // Vercel 환경 감지
  const isVercel = !!process.env.VERCEL;
  const vercelPlan = process.env.VERCEL_ENV;

  let serverCount = DEFAULT_SERVER_COUNT;

  // 환경별 서버 개수 조정
  if (envServerCount) {
    serverCount = envServerCount;
  } else if (envMaxServers) {
    serverCount = envMaxServers;
  } else if (isVercel) {
    // Vercel 환경에서는 리소스 제한에 따라 조정
    switch (vercelPlan) {
      case 'production':
        serverCount = 15; // 프로덕션: 15개
        break;
      case 'preview':
        serverCount = 10; // 프리뷰: 10개
        break;
      default:
        serverCount = 8; // 개발: 8개
        break;
    }
  }

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
