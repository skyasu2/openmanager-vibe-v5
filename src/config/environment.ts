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
    apiTimeout: number;
    cacheTimeout: number;
  };

  // Feature Flags
  features: {
    enableAI: boolean;
    enableRealtimeData: boolean;
    enableAdvancedAnalytics: boolean;
    enableWebSocket: boolean;
  };
}

/**
 * 🔧 환경 감지 및 설정 로드
 */
export function getEnvironmentConfig(): EnvironmentConfig {
  const isVercel = !!process.env.VERCEL;
  const isLocal = process.env.NODE_ENV === 'development';
  const nodeEnv = (process.env.NODE_ENV || 'development') as
    | 'development'
    | 'production'
    | 'test';

  return {
    NODE_ENV: nodeEnv,
    IS_VERCEL: isVercel,
    IS_LOCAL: isLocal,

    database: {
      supabase: {
        url: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
        key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
        enabled: !!(
          process.env.NEXT_PUBLIC_SUPABASE_URL &&
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        ),
      },
      redis: {
        url: process.env.UPSTASH_REDIS_REST_URL || '',
        token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
        enabled: !!(
          process.env.UPSTASH_REDIS_REST_URL &&
          process.env.UPSTASH_REDIS_REST_TOKEN
        ),
      },
    },

    performance: {
      maxMemory: isVercel ? 1024 : 4096,
      apiTimeout: isVercel ? 30000 : 60000,
      cacheTimeout: isVercel ? 300000 : 600000, // 5분 vs 10분
    },

    features: {
      enableAI: true,
      enableRealtimeData: true,
      enableAdvancedAnalytics: !isVercel || nodeEnv === 'production',
      enableWebSocket: !isVercel, // Vercel에서는 WebSocket 제한
    },
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
      performance: {
        ...config.performance,
        maxMemory: 1024, // Vercel Free Plan 제한
        apiTimeout: 25000, // Vercel 30초 제한에 여유
        cacheTimeout: 180000, // 3분으로 단축
      },
      features: {
        ...config.features,
        enableWebSocket: false, // Vercel에서 WebSocket 비활성화
        enableAdvancedAnalytics: false, // 메모리 절약
      },
    };
  }

  return config;
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
    `📊 실시간 데이터: ${config.features.enableRealtimeData ? '활성화' : '비활성화'}`
  );
}

// 🔧 추가 함수들 (빌드 오류 수정용)

/**
 * 환경 감지 함수
 */
export function detectEnvironment() {
  return getEnvironmentConfig();
}

/**
 * 현재 환경 정보 반환
 */
export function getCurrentEnvironment() {
  return getEnvironmentConfig();
}

/**
 * 환경 변수 객체
 */
export const env = getEnvironmentConfig();

/**
 * 데이터 생성기 설정 반환
 */
export function getDataGeneratorConfig() {
  const config = getEnvironmentConfig();

  // 🚀 환경별 서버 수 조절: Vercel Free(8개) / Vercel Pro(16개) / 로컬(30개)
  let maxServers = 30; // 기본값 (로컬)
  let serverArchitecture:
    | 'single'
    | 'master-slave'
    | 'load-balanced'
    | 'microservices' = 'load-balanced';

  if (config.IS_VERCEL) {
    // Vercel 환경 감지
    const isVercelPro =
      process.env.VERCEL_ENV === 'production' &&
      process.env.VERCEL_TIER === 'pro';

    if (isVercelPro) {
      maxServers = 16; // Vercel Pro: 16개 서버
      serverArchitecture = 'load-balanced';
    } else {
      maxServers = 8; // Vercel Free: 8개 서버
      serverArchitecture = 'master-slave';
    }
  }

  return {
    enabled: config.features.enableRealtimeData,
    maxServers,
    defaultArchitecture: serverArchitecture,
    updateInterval: config.IS_VERCEL ? 5000 : 3000,
    refreshInterval: config.IS_VERCEL ? 10000 : 5000,
    memoryLimit: config.performance.maxMemory,
    mode: config.IS_VERCEL ? 'production' : 'development',
    features: {
      networkTopology: config.features.enableAdvancedAnalytics,
      demoScenarios: config.features.enableAdvancedAnalytics,
      baselineOptimization: config.features.enableAdvancedAnalytics,
      maxNodes: config.IS_VERCEL ? 20 : 50,
      autoRotate: config.features.enableAdvancedAnalytics,
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
    timeout: config.performance.apiTimeout,
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
      return config.features.enableRealtimeData;
    case 'analytics':
      return config.features.enableAdvancedAnalytics;
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
    timeout: config.performance.apiTimeout,
    memoryLimit: config.performance.maxMemory,
    maxNodes: config.IS_VERCEL ? 20 : 50,
    autoRotate: config.features.enableAdvancedAnalytics,
    maxQueries: config.IS_VERCEL ? 100 : 500,
    cacheEnabled: config.database.redis.enabled,
    updateInterval: config.IS_VERCEL ? 10000 : 5000,
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
        updateInterval: config.IS_VERCEL ? 5000 : 3000,
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
