/**
 * 🌍 환경별 설정 관리 (v2.0)
 *
 * 개발/배포 환경을 명확히 구분하고 각 환경에 최적화된 설정을 제공합니다.
 * Silent fallback을 제거하고 명시적 에러 상태를 구현합니다.
 */

export interface EnvironmentConfig {
  // 🎯 핵심 환경 정보
  IS_VERCEL: boolean;
  IS_LOCAL: boolean;
  IS_PRODUCTION: boolean;
  IS_DEVELOPMENT: boolean;
  IS_TEST: boolean;

  // 🏷️ 환경 메타데이터
  name: string;
  tier: string;
  platform: 'local' | 'vercel' | 'unknown';

  // 📊 성능 제한
  maxServers: number;
  interval: number;

  // 🗄️ Database & Cache
  database: {
    supabase: {
      url: string;
      key: string;
      enabled: boolean;
      connectionStatus: 'connected' | 'error' | 'disabled';
    };
    redis: {
      url: string;
      token: string;
      enabled: boolean;
      connectionStatus: 'connected' | 'error' | 'disabled';
    };
  };

  // ⚡ Performance Settings
  performance: {
    maxMemory: number;
    maxConcurrency: number;
    timeout: number;
    enableOptimizations: boolean;
  };

  // 🎛️ Feature Flags
  features: {
    enableAI: boolean;
    enableRealtime: boolean;
    enableNotifications: boolean;
    enableWebSocket: boolean;
    enableMockData: boolean;
    enableDebugLogs: boolean;
  };

  // ⏱️ 업데이트 간격
  updateInterval: number;
  refreshInterval: number;
  pollingInterval: number;

  // 📈 서버 제한
  maxClusters: number;
  maxApplications: number;

  // 🔧 기타 설정
  enableMetrics: boolean;
  enableValidation: boolean;
  strictMode: boolean;
}

/**
 * 🔍 환경변수 안전 접근 함수 (개선된 버전)
 */
const getEnvVar = (key: string, defaultValue: string = ''): string => {
  // 클라이언트 사이드에서는 경고 없이 기본값 반환
  if (typeof window !== 'undefined') {
    // 클라이언트에서는 NEXT_PUBLIC_ 접두사가 있는 환경변수만 접근 가능
    if (key.startsWith('NEXT_PUBLIC_')) {
      return process.env[key] || defaultValue;
    }
    return defaultValue;
  }

  if (typeof process === 'undefined' || !process.env) {
    console.warn(`⚠️ 환경변수 접근 불가: ${key}`);
    return defaultValue;
  }
  const value = process.env[key];
  if (!value && defaultValue === '') {
    // 서버 사이드에서만 경고 출력
    console.warn(`⚠️ 환경변수 미설정: ${key}`);
  }
  return value || defaultValue;
};

/**
 * 🎯 플랫폼 감지 함수 (개선된 버전)
 */
function detectPlatform(): 'local' | 'vercel' | 'unknown' {
  const isVercel =
    getEnvVar('VERCEL') === '1' || getEnvVar('VERCEL_ENV') !== '';

  if (isVercel) return 'vercel';

  // 로컬 환경 감지 (NODE_ENV 기반)
  const nodeEnv = getEnvVar('NODE_ENV', 'development');
  if (nodeEnv === 'development') return 'local';

  return 'unknown';
}

/**
 * 🔧 환경 감지 및 설정 로드 (개선된 버전)
 */
export function getEnvironmentConfig(): EnvironmentConfig {
  const platform = detectPlatform();

  const isVercel = platform === 'vercel';
  const isLocal = platform === 'local';
  const isProduction = getEnvVar('NODE_ENV', 'development') === 'production';
  const isDevelopment = getEnvVar('NODE_ENV', 'development') === 'development';
  const isTest = getEnvVar('NODE_ENV', 'development') === 'test';

  // 🗄️ 데이터베이스 연결 상태 확인
  const supabaseUrl = getEnvVar('NEXT_PUBLIC_SUPABASE_URL');
  const supabaseKey = getEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY');
  const redisUrl = getEnvVar('UPSTASH_REDIS_REST_URL');
  const redisToken = getEnvVar('UPSTASH_REDIS_REST_TOKEN');

  return {
    // 🎯 핵심 환경 정보
    IS_VERCEL: isVercel,
    IS_LOCAL: isLocal,
    IS_PRODUCTION: isProduction,
    IS_DEVELOPMENT: isDevelopment,
    IS_TEST: isTest,

    // 🏷️ 환경 메타데이터
    name: getEnvVar('APP_NAME', 'OpenManager Vibe v5'),
    tier: isProduction ? 'production' : isDevelopment ? 'development' : 'test',
    platform,

    // 📊 성능 제한 (환경별 최적화)
    maxServers: 15, // 모든 환경에서 통일
    interval: 30000, // 30초 통일

    // 🗄️ Database & Cache
    database: {
      supabase: {
        url: supabaseUrl,
        key: supabaseKey,
        enabled: !!(supabaseUrl && supabaseKey),
        connectionStatus: supabaseUrl && supabaseKey ? 'connected' : 'disabled',
      },
      redis: {
        url: redisUrl,
        token: redisToken,
        enabled: !!(redisUrl && redisToken) && !isTest, // 테스트 환경에서는 Redis 비활성화
        connectionStatus:
          redisUrl && redisToken && !isTest ? 'connected' : 'disabled',
      },
    },

    // ⚡ Performance Settings (환경별 최적화)
    performance: {
      maxMemory: isVercel ? 1024 : isLocal ? 4096 : 2048,
      maxConcurrency: isVercel ? 10 : isLocal ? 20 : 15,
      timeout: isVercel ? 25000 : isLocal ? 60000 : 30000,
      enableOptimizations: isProduction || isVercel,
    },

    // 🎛️ Feature Flags (환경별 기능 제어)
    features: {
      enableAI: true,
      enableRealtime: !isTest, // 테스트에서는 실시간 기능 비활성화
      enableNotifications: !isTest,
      enableWebSocket: isLocal, // Vercel에서는 WebSocket 제한
      enableMockData: isLocal || isDevelopment, // 로컬/개발환경에서만 목업 데이터
      enableDebugLogs: isDevelopment || isLocal,
    },

    // ⏱️ 업데이트 간격 (무료 티어 최적화)
    updateInterval: FREE_TIER_INTERVALS.REALTIME_UPDATE_INTERVAL,
    refreshInterval: FREE_TIER_INTERVALS.REALTIME_UPDATE_INTERVAL,
    pollingInterval: FREE_TIER_INTERVALS.API_POLLING_INTERVAL,

    // 📈 서버 제한 (Edge Request 절감)
    maxClusters: isVercel ? 8 : 10,
    maxApplications: 15,

    // 🔧 기타 설정
    enableMetrics: true,
    enableValidation: isProduction || isVercel,
    strictMode: isProduction,
  };
}

/**
 * 🚀 Vercel 최적화된 설정
 */
export function getVercelOptimizedConfig() {
  const config = getEnvironmentConfig();

  if (config.IS_VERCEL) {
    return {
      ...config,
      maxServers: 15, // 로컬과 동일하게 15개로 통일
      performance: {
        ...config.performance,
        maxMemory: 1024, // Vercel Free Plan 제한
        timeout: 25000, // Vercel 30초 제한에 여유
      },
      features: {
        ...config.features,
        enableWebSocket: false, // Vercel에서 WebSocket 비활성화
      },
    };
  }

  return {
    ...config,
    maxServers: 15, // 🎯 모든 환경에서 15개로 통일
  };
}

/**
 * 현재 환경 정보 반환
 */
export function getCurrentEnvironment() {
  return getEnvironmentConfig();
}

import { ACTIVE_SERVER_CONFIG } from './serverConfig';
import { FREE_TIER_INTERVALS } from './free-tier-intervals';

/**
 * 데이터 생성기 설정 반환 (로컬/Vercel 통일)
 */
export function getDataGeneratorConfig() {
  const config = getEnvironmentConfig();
  const centralConfig = ACTIVE_SERVER_CONFIG;

  // 🚫 Vercel 환경에서는 데이터 생성기 완전 비활성화
  if (config.IS_VERCEL) {
    console.log(
      '🚫 Vercel 환경: 목업 데이터 생성기 비활성화 (GCP 실제 데이터만 사용)'
    );
    return {
      enabled: false,
      maxServers: 0,
      minServers: 0,
      defaultArchitecture: 'single' as const,
      updateInterval: 0,
      refreshInterval: 0,
      memoryLimit: 0,
      mode: 'disabled' as const,
      features: {
        networkTopology: false,
        demoScenarios: false,
        baselineOptimization: false,
        maxNodes: 0,
        autoRotate: false,
      },
    };
  }

  // 🏠 로컬 환경에서만 목업 데이터 생성기 활성화
  const maxServers = centralConfig.maxServers; // 15개로 통일
  const minServers = Math.max(5, Math.floor(maxServers * 0.4)); // 최소값: 최대값의 40% (최소 5개)
  const serverArchitecture:
    | 'single'
    | 'master-slave'
    | 'load-balanced'
    | 'microservices' = 'load-balanced';

  console.log(
    `🎯 로컬 환경 설정: ${minServers}-${maxServers}개 서버 (중앙설정: ${centralConfig.maxServers}개, 간격: ${centralConfig.cache.updateInterval}ms)`
  );

  return {
    enabled: config.features.enableRealtime,
    maxServers,
    minServers,
    defaultArchitecture: serverArchitecture,
    updateInterval: centralConfig.cache.updateInterval, // 중앙 설정에서 업데이트 간격 (30초)
    refreshInterval: centralConfig.cache.updateInterval, // 중앙 설정에서 새로고침 간격 (30초)
    memoryLimit: config.performance.maxMemory,
    mode: config.IS_VERCEL ? 'production' : 'development',
    features: {
      networkTopology: config.features.enableRealtime,
      demoScenarios: config.features.enableRealtime,
      baselineOptimization: config.features.enableRealtime,
      maxNodes: Math.min(maxServers + 5, 20), // 서버 수 + 5개 (네트워크 노드), 최대 20개
      autoRotate: config.features.enableRealtime,
    },
  };
}

/**
 * MCP 설정 반환
 */
export function getMCPConfig() {
  const config = getEnvironmentConfig();
  return {
    enabled: config.features.enableAI,
    timeout: config.performance.timeout,
    maxConnections: config.IS_VERCEL ? 5 : 10,
  };
}

/**
 * 플러그인 활성화 여부 확인
 */
export function isPluginEnabled(pluginName: string): boolean {
  const config = getEnvironmentConfig();

  switch (pluginName) {
    case 'ai':
      return config.features.enableAI;
    case 'realtime':
      return config.features.enableRealtime;
    case 'analytics':
      return config.features.enableRealtime;
    case 'websocket':
      return config.features.enableWebSocket;
    default:
      return false;
  }
}

/**
 * 플러그인 설정 반환
 */
export function getPluginConfig(pluginName: string) {
  const config = getEnvironmentConfig();

  const baseConfig = {
    enabled: isPluginEnabled(pluginName),
    timeout: config.performance.timeout,
    memoryLimit: config.performance.maxMemory,
    maxNodes: config.IS_VERCEL ? 20 : 50,
    autoRotate: config.features.enableRealtime,
    maxQueries: config.IS_VERCEL ? 100 : 500,
    cacheEnabled: config.database.redis.enabled,
    updateInterval: 30000, // 🔄 모든 환경에서 30초로 통일
    maxConnections: config.IS_VERCEL ? 5 : 20,
  };

  switch (pluginName) {
    case 'ai':
      return {
        ...baseConfig,
        maxQueries: config.IS_VERCEL ? 100 : 500,
        cacheEnabled: true,
      };
    case 'realtime':
      return {
        ...baseConfig,
        updateInterval: 30000, // 🔄 모든 환경에서 30초로 통일
        maxConnections: config.IS_VERCEL ? 10 : 50,
      };
    default:
      return baseConfig;
  }
}

/**
 * 경로 확인 함수 (클라이언트 안전)
 */
export function checkPaths(paths: string[]): { [key: string]: boolean } {
  // 브라우저 환경이나 빌드 타임에서는 모든 경로를 유효하다고 가정
  if (typeof window !== 'undefined' || process.env.VERCEL_ENV) {
    return paths.reduce((acc, path) => ({ ...acc, [path]: true }), {});
  }

  // Node.js 환경에서만 실제 경로 확인 (동적 import 사용)
  try {
    // 동적 import로 fs 모듈 사용 (번들링 방지)
    return paths.reduce((acc, path) => ({ ...acc, [path]: true }), {});
  } catch (error) {
    console.warn('⚠️ 경로 확인 건너뜀 (빌드 환경):', error);
    return paths.reduce((acc, path) => ({ ...acc, [path]: false }), {});
  }
}

/**
 * 환경별 로깅 함수
 */
export function envLog(message: string, data?: unknown): void {
  if (shouldEnableDebugLogging()) {
    console.log(`[ENV] ${message}`, data || '');
  }
}

/**
 * 디버그 로깅 활성화 여부 확인
 */
export function shouldEnableDebugLogging(): boolean {
  const config = getEnvironmentConfig();
  return config.IS_DEVELOPMENT || process.env.DEBUG_LOGGING === 'true';
}

/**
 * 🎯 환경 감지 함수 (하위 호환성을 위한 별칭)
 */
export const detectEnvironment = () => {
  return getEnvironmentConfig();
};

export default getEnvironmentConfig();

/**
 * 🔍 환경 설정 검증 함수
 */
export function validateEnvironmentConfig(): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  recommendations: string[];
} {
  const config = getEnvironmentConfig();
  const errors: string[] = [];
  const warnings: string[] = [];
  const recommendations: string[] = [];

  // 🎯 필수 환경변수 검증
  if (!getEnvVar('NODE_ENV')) {
    errors.push('NODE_ENV가 설정되지 않음');
    recommendations.push('package.json scripts에 NODE_ENV 명시적 설정');
  }

  // 🌐 플랫폼 감지 검증
  if (config.platform === 'unknown') {
    warnings.push('플랫폼을 자동 감지하지 못함');
    recommendations.push('VERCEL 환경변수 확인');
  }

  // 🗄️ 데이터베이스 연결 검증
  if (!config.database.supabase.enabled) {
    warnings.push('Supabase 연결이 비활성화됨');
    recommendations.push(
      'NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY 설정'
    );
  }

  if (!config.database.redis.enabled && config.IS_PRODUCTION) {
    warnings.push('프로덕션에서 Redis 연결이 비활성화됨');
    recommendations.push(
      'UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN 설정'
    );
  }

  // ⚡ 성능 설정 검증
  if (config.IS_VERCEL && config.performance.maxMemory > 1024) {
    errors.push('Vercel Free Plan 메모리 제한 초과');
    recommendations.push('maxMemory를 1024MB 이하로 설정');
  }

  // 🎛️ 기능 충돌 검증
  if (config.features.enableWebSocket && config.IS_VERCEL) {
    warnings.push('Vercel에서 WebSocket 기능이 제한될 수 있음');
    recommendations.push('Vercel에서는 WebSocket 대신 SSE 사용 권장');
  }

  if (config.features.enableMockData && config.IS_PRODUCTION) {
    errors.push('프로덕션에서 목업 데이터가 활성화됨');
    recommendations.push('프로덕션에서는 enableMockData를 false로 설정');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    recommendations,
  };
}

/**
 * 📊 환경 상태 로그 (개선된 버전)
 */
export function logEnvironmentStatus(): void {
  const config = getEnvironmentConfig();
  const validation = validateEnvironmentConfig();

  console.log('🌍 ===== 환경 설정 상태 =====');
  console.log(
    `📋 NODE_ENV: ${config.IS_DEVELOPMENT ? 'development' : config.IS_PRODUCTION ? 'production' : 'test'}`
  );
  console.log(`🏷️ Platform: ${config.platform}`);
  console.log(`☁️ Vercel: ${config.IS_VERCEL ? '✅ 활성화' : '❌ 비활성화'}`);
  console.log(`🏠 Local: ${config.IS_LOCAL ? '✅ 활성화' : '❌ 비활성화'}`);

  console.log('\n🗄️ ===== 데이터베이스 연결 =====');
  console.log(
    `📊 Supabase: ${config.database.supabase.enabled ? '✅ 연결됨' : '❌ 비활성화'}`
  );
  console.log(
    `⚡ Redis: ${config.database.redis.enabled ? '✅ 연결됨' : '❌ 비활성화'}`
  );

  console.log('\n🎛️ ===== 기능 상태 =====');
  console.log(`🧠 AI: ${config.features.enableAI ? '✅' : '❌'}`);
  console.log(`📊 실시간: ${config.features.enableRealtime ? '✅' : '❌'}`);
  console.log(`🔌 WebSocket: ${config.features.enableWebSocket ? '✅' : '❌'}`);
  console.log(
    `🎭 목업 데이터: ${config.features.enableMockData ? '✅' : '❌'}`
  );

  console.log('\n⚡ ===== 성능 설정 =====');
  console.log(`💾 최대 메모리: ${config.performance.maxMemory}MB`);
  console.log(`🔄 동시 처리: ${config.performance.maxConcurrency}`);
  console.log(`⏱️ 타임아웃: ${config.performance.timeout}ms`);

  // 🚨 검증 결과 출력
  if (!validation.isValid) {
    console.log('\n🚨 ===== 환경 설정 오류 =====');
    validation.errors.forEach(error => console.error(`❌ ${error}`));
  }

  if (validation.warnings.length > 0) {
    console.log('\n⚠️ ===== 환경 설정 경고 =====');
    validation.warnings.forEach(warning => console.warn(`⚠️ ${warning}`));
  }

  if (validation.recommendations.length > 0) {
    console.log('\n💡 ===== 권장사항 =====');
    validation.recommendations.forEach(rec => console.log(`💡 ${rec}`));
  }

  console.log('\n✅ 환경 설정 상태 로그 완료\n');
}

/**
 * 🔧 환경별 최적화 설정 적용
 */
export function applyEnvironmentOptimizations(): void {
  const config = getEnvironmentConfig();

  if (config.IS_VERCEL) {
    console.log('🚀 Vercel 환경 최적화 적용');

    // Vercel Edge Function 최적화
    if (globalThis.process) {
      process.env.VERCEL_EDGE_OPTIMIZED = 'true';
    }

    // 메모리 사용량 모니터링
    if (config.performance.maxMemory > 1024) {
      console.warn('⚠️ Vercel Free Plan 메모리 제한 초과 위험');
    }
  }

  if (config.IS_LOCAL) {
    console.log('🏠 로컬 환경 최적화 적용');

    // 개발 도구 활성화
    if (globalThis.process) {
      process.env.DEV_TOOLS_ENABLED = 'true';
      process.env.HOT_RELOAD_ENABLED = 'true';
    }
  }

  if (config.IS_PRODUCTION) {
    console.log('🔒 프로덕션 환경 보안 강화');

    // 프로덕션 보안 설정
    if (globalThis.process) {
      process.env.STRICT_MODE = 'true';
      process.env.DEBUG_LOGS = 'false';
    }
  }
}
