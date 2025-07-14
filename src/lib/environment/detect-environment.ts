import { EnvironmentConfig } from '../../config/environment';

function getEnvVar(key: string, defaultValue: string = ''): string {
  if (typeof window !== 'undefined') {
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
    console.warn(`⚠️ 환경변수 미설정: ${key}`);
  }
  return value || defaultValue;
}

export function detectEnvironment(): EnvironmentConfig {
  const isVercel = process.env.VERCEL === '1' || process.env.VERCEL_ENV === 'production';
  const isLocal = process.env.NODE_ENV === 'development' && !isVercel;
  const isTest = process.env.NODE_ENV === 'test';
  const isProduction = process.env.NODE_ENV === 'production' || isVercel;
  const isDevelopment = process.env.NODE_ENV === 'development';

  return {
    // 기본 환경 정보
    IS_VERCEL: isVercel,
    IS_LOCAL: isLocal,
    IS_TEST: isTest,
    IS_PRODUCTION: isProduction,
    IS_DEVELOPMENT: isDevelopment,
    name: getEnvVar('APP_NAME', 'OpenManager Vibe v5'),
    tier: isProduction ? 'production' : isDevelopment ? 'development' : 'test',
    maxServers: 15,
    interval: 30000,
    database: {
      supabase: {
        url: getEnvVar('NEXT_PUBLIC_SUPABASE_URL'),
        key: getEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
        enabled: !!(getEnvVar('NEXT_PUBLIC_SUPABASE_URL') && getEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY')),
        connectionStatus: getEnvVar('NEXT_PUBLIC_SUPABASE_URL') && getEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY') ? 'connected' : 'disabled',
      },
      redis: {
        url: getEnvVar('UPSTASH_REDIS_REST_URL'),
        token: getEnvVar('UPSTASH_REDIS_REST_TOKEN'),
        enabled: !!(getEnvVar('UPSTASH_REDIS_REST_URL') && getEnvVar('UPSTASH_REDIS_REST_TOKEN')) && !isTest,
        connectionStatus: getEnvVar('UPSTASH_REDIS_REST_URL') && getEnvVar('UPSTASH_REDIS_REST_TOKEN') && !isTest ? 'connected' : 'disabled',
      },
    },
    updateInterval: isProduction ? 30000 : 15000,
    refreshInterval: isProduction ? 30000 : 10000,
    pollingInterval: isProduction ? 30000 : 5000,
    maxClusters: isVercel ? 8 : 10,
    maxApplications: 15,
    enableMetrics: true,
    enableValidation: isProduction || isVercel,
    strictMode: isProduction,
    platform: isVercel ? 'vercel' : isLocal ? 'local' : 'unknown',

    // 🎛️ 기능 토글
    features: {
      enableAI: true,
      enableRealtime: !isTest,
      enableNotifications: !isTest,
      enableWebSocket: isLocal,
      enableMockData: isLocal || isDevelopment,
      enableDebugLogs: isDevelopment || isLocal,
    },

    // ⚡ 성능 설정
    performance: {
      maxMemory: isVercel ? 1024 : isLocal ? 4096 : 2048,
      maxConcurrency: isVercel ? 10 : isLocal ? 20 : 15,
      timeout: isVercel ? 25000 : isLocal ? 60000 : 30000,
      enableOptimizations: isProduction || isVercel,
    },
  };
} 