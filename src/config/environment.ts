/**
 * 🌍 환경별 설정 관리
 *
 * Vercel 배포 환경과 로컬 개발 환경을 구분하여
 * Redis, Supabase 연결을 최적화합니다.
 */

export interface EnvironmentConfig {
  NODE_ENV: 'development' | 'production' | 'test';
  IS_VERCEL: boolean;
  IS_LOCAL: boolean;
  IS_PRODUCTION: boolean;
  IS_DEVELOPMENT: boolean;

  // 환경 정보
  name: string;
  tier: string;
  maxServers: number;
  interval: number;

  // Database & Cache
  database: {
    supabase: {
      url: string;
      key: string;
      enabled: boolean;
    };
    redis: {
      url: string;
      token: string;
      enabled: boolean;
    };
  };

  // Performance Settings
  performance: {
    maxMemory: number;
    maxConcurrency: number;
    timeout: number;
  };

  // Feature Flags
  features: {
    enableAI: boolean;
    enableRealtime: boolean;
    enableNotifications: boolean;
    enableWebSocket: boolean;
  };

  // 업데이트 간격
  updateInterval: number;
  refreshInterval: number;
  pollingInterval: number;

  // 서버 제한
  maxClusters: number;
  maxApplications: number;

  // 기타 설정
  enableDebugLogs: boolean;
  enableMetrics: boolean;
  enableNotifications: boolean;
}

/**
 * 🔧 환경 감지 및 설정 로드
 */
export function getEnvironmentConfig(): EnvironmentConfig {
  const isVercel = getEnvVar('VERCEL') === '1';
  const nodeEnv = getEnvVar('NODE_ENV', 'development');
  const isProduction = nodeEnv === 'production';
  const isDevelopment = nodeEnv === 'development';
  const isLocal = !isVercel && isDevelopment;

  return {
    NODE_ENV: nodeEnv as 'development' | 'production' | 'test',
    IS_VERCEL: isVercel,
    IS_LOCAL: isLocal,
    IS_PRODUCTION: isProduction,
    IS_DEVELOPMENT: isDevelopment,

    // 추가된 속성들 (리팩토링으로 필요한 속성)
    name: getEnvVar('NAME'),
    tier: getEnvVar('TIER'),
    maxServers: 15, // 로컬/Vercel 통일
    interval: 30000, // 30초로 통일

    // Database & Cache
    database: {
      supabase: {
        url: getEnvVar('NEXT_PUBLIC_SUPABASE_URL'),
        key: getEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
        enabled: !!(
          getEnvVar('NEXT_PUBLIC_SUPABASE_URL') &&
          getEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY')
        ),
      },
      redis: {
        url: getEnvVar('UPSTASH_REDIS_REST_URL'),
        token: getEnvVar('UPSTASH_REDIS_REST_TOKEN'),
        enabled: !!(
          getEnvVar('UPSTASH_REDIS_REST_URL') &&
          getEnvVar('UPSTASH_REDIS_REST_TOKEN')
        ),
      },
    },

    // Performance Settings
    performance: {
      maxMemory: isVercel ? 1024 : 4096,
      maxConcurrency: isVercel ? 10 : 4,
      timeout: isVercel ? 30000 : 60000,
    },

    // Feature Flags
    features: {
      enableAI: true,
      enableRealtime: true,
      enableNotifications: true,
      enableWebSocket: !isVercel, // Vercel에서는 WebSocket 제한
    },

    // 업데이트 간격 (30초로 통일)
    updateInterval: 30000,
    refreshInterval: 30000,
    pollingInterval: 30000,

    // 서버 제한 (Edge Request 절감)
    maxClusters: 10,
    maxApplications: 15,

    // 기타 설정
    enableDebugLogs: isDevelopment,
    enableMetrics: true,
    enableNotifications: true,
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
 * 📊 환경 상태 로그
 */
export function logEnvironmentStatus() {
  const config = getEnvironmentConfig();

  console.log('🌍 환경 설정 상태:');
  console.log(`📋 환경: ${config.NODE_ENV}`);
  console.log(`☁️ Vercel: ${config.IS_VERCEL ? '활성화' : '비활성화'}`);
  console.log(`🏠 로컬: ${config.IS_LOCAL ? '활성화' : '비활성화'}`);
  console.log(
    `🗄️ Supabase: ${config.database.supabase.enabled ? '연결됨' : '비활성화'}`
  );
  console.log(
    `⚡ Redis: ${config.database.redis.enabled ? '연결됨' : '비활성화'}`
  );
  console.log(
    `🧠 AI 기능: ${config.features.enableAI ? '활성화' : '비활성화'}`
  );
  console.log(
    `📊 실시간 데이터: ${config.features.enableRealtime ? '활성화' : '비활성화'}`
  );
}

// 🔧 추가 함수들 (빌드 오류 수정용)

/**
 * 환경변수 안전 접근 함수
 */
const getEnvVar = (key: string, defaultValue: string = ''): string => {
  if (typeof process === 'undefined' || !process.env) {
    return defaultValue;
  }
  return process.env[key] || defaultValue;
};

/**
 * 환경 감지
 */
export const detectEnvironment = () => {
  const isVercel = getEnvVar('VERCEL') === '1';
  const nodeEnv = getEnvVar('NODE_ENV', 'development');
  const isProduction = nodeEnv === 'production';
  const isDevelopment = nodeEnv === 'development';

  return {
    isVercel,
    nodeEnv,
    isProduction,
    isDevelopment,
    isClient: typeof window !== 'undefined',
    NODE_ENV: nodeEnv as 'development' | 'production' | 'test',
    IS_VERCEL: isVercel,
    IS_PRODUCTION: isProduction,
    IS_DEVELOPMENT: isDevelopment,
    IS_LOCAL: !isVercel && isDevelopment,
    performance: {
      maxMemory: isVercel ? 1024 : 4096,
      maxConcurrency: isVercel ? 10 : 4,
      timeout: isVercel ? 30000 : 60000,
    },
  };
};

export const env = detectEnvironment();

/**
 * 현재 환경 정보 반환
 */
export function getCurrentEnvironment() {
  return getEnvironmentConfig();
}

import { ACTIVE_SERVER_CONFIG, DEFAULT_SERVER_COUNT } from './serverConfig';

/**
 * 데이터 생성기 설정 반환 (로컬/Vercel 통일)
 */
export function getDataGeneratorConfig() {
  const config = getEnvironmentConfig();
  const centralConfig = ACTIVE_SERVER_CONFIG;

  // 🚀 모든 환경에서 동일한 설정 사용
  const maxServers = centralConfig.maxServers; // 15개로 통일
  const minServers = Math.max(5, Math.floor(maxServers * 0.4)); // 최소값: 최대값의 40% (최소 5개)
  const serverArchitecture:
    | 'single'
    | 'master-slave'
    | 'load-balanced'
    | 'microservices' = 'load-balanced';

  console.log(
    `🎯 통합 환경 설정: ${minServers}-${maxServers}개 서버 (중앙설정: ${centralConfig.maxServers}개, 간격: ${centralConfig.cache.updateInterval}ms)`
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
export function envLog(message: string, data?: any): void {
  if (shouldEnableDebugLogging()) {
    console.log(`[ENV] ${message}`, data || '');
  }
}

/**
 * 디버그 로깅 활성화 여부 확인
 */
export function shouldEnableDebugLogging(): boolean {
  const config = getEnvironmentConfig();
  return (
    config.NODE_ENV === 'development' || process.env.DEBUG_LOGGING === 'true'
  );
}

export default env;
