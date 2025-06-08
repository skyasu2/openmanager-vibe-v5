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
  const nodeEnv = (process.env.NODE_ENV || 'development') as 'development' | 'production' | 'test';

  return {
    NODE_ENV: nodeEnv,
    IS_VERCEL: isVercel,
    IS_LOCAL: isLocal,
    
    database: {
      supabase: {
        url: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
        key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
        enabled: !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
      },
      redis: {
        url: process.env.UPSTASH_REDIS_REST_URL || '',
        token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
        enabled: !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN),
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
  console.log(`🗄️ Supabase: ${config.database.supabase.enabled ? '연결됨' : '비활성화'}`);
  console.log(`⚡ Redis: ${config.database.redis.enabled ? '연결됨' : '비활성화'}`);
  console.log(`🧠 AI 기능: ${config.features.enableAI ? '활성화' : '비활성화'}`);
  console.log(`📊 실시간 데이터: ${config.features.enableRealtimeData ? '활성화' : '비활성화'}`);
}
