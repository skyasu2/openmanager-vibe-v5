export type Environment = 'development' | 'test' | 'staging' | 'production';

export interface EnvironmentConfig {
  name: Environment;
  isDevelopment: boolean;
  isTest: boolean;
  isStaging: boolean;
  isProduction: boolean;
  isVercel: boolean;
  database: {
    useRealDB: boolean;
    useMockData: boolean;
    redisEnabled: boolean;
  };
  mcp: {
    enabledServers: string[];
    useLocalPaths: boolean;
    enableDebugLogging: boolean;
  };
  ai: {
    useMockEngine: boolean;
    enableTensorFlow: boolean;
    enableAdvancedFeatures: boolean;
  };
  logging: {
    level: 'debug' | 'info' | 'warn' | 'error';
    enableConsole: boolean;
    enableFile: boolean;
  };
  performance: {
    enableOptimizations: boolean;
    serverCount: number;
    metricsCount: number;
  };
}

/**
 * 🔍 플랫폼 감지 및 환경 결정 (utils 버전에서 통합)
 */
export function getCurrentEnvironment(): Environment {
  // 1. 플랫폼별 감지 (utils 버전 통합)
  if (process.env.VERCEL) {
    // Vercel 환경 - utils 버전의 상세 감지 로직
    const vercelEnv = process.env.VERCEL_ENV;
    if (vercelEnv === 'production') return 'production';
    if (vercelEnv === 'preview') return 'staging';
    return 'staging'; // development 브랜치도 staging으로 처리
  }

  if (process.env.RENDER) {
    // Render 환경 - utils 버전에서 추가된 감지
    return process.env.IS_PULL_REQUEST === 'true' ? 'staging' : 'production';
  }

  if (process.env.NETLIFY) {
    // Netlify 환경 - utils 버전에서 추가된 감지
    const netlifyContext = process.env.CONTEXT;
    if (netlifyContext === 'production') return 'production';
    if (netlifyContext === 'deploy-preview') return 'staging';
    return 'staging';
  }

  // 2. Node 환경 기반 (기존 로직 유지)
  const nodeEnv = process.env.NODE_ENV;
  if (nodeEnv === 'test') return 'test';
  if (nodeEnv === 'production') return 'production';

  return 'development';
}

export function getEnvironmentConfig(): EnvironmentConfig {
  const env = getCurrentEnvironment();
  const isVercel = !!process.env.VERCEL;

  const baseConfig = {
    name: env,
    isDevelopment: env === 'development',
    isTest: env === 'test',
    isStaging: env === 'staging',
    isProduction: env === 'production',
    isVercel,
  };

  switch (env) {
    case 'development':
      return {
        ...baseConfig,
        database: {
          useRealDB: true, // 개발 환경에서도 실제 DB 사용
          useMockData: false, // Mock 데이터 사용 비활성화
          redisEnabled: true, // Redis 활성화
        },
        mcp: {
          enabledServers: ['filesystem', 'github'],
          useLocalPaths: true,
          enableDebugLogging: true,
        },
        ai: {
          useMockEngine: false,
          enableTensorFlow: true,
          enableAdvancedFeatures: true,
        },
        logging: {
          level: 'debug',
          enableConsole: true,
          enableFile: true,
        },
        performance: {
          enableOptimizations: false,
          serverCount: 16,
          metricsCount: 500,
        },
      };

    case 'test':
      return {
        ...baseConfig,
        database: {
          useRealDB: false,
          useMockData: true,
          redisEnabled: false,
        },
        mcp: {
          enabledServers: ['filesystem'], // 테스트는 최소 구성
          useLocalPaths: true,
          enableDebugLogging: false,
        },
        ai: {
          useMockEngine: true, // 테스트는 목 엔진 사용
          enableTensorFlow: false,
          enableAdvancedFeatures: false,
        },
        logging: {
          level: 'warn',
          enableConsole: false,
          enableFile: false,
        },
        performance: {
          enableOptimizations: false,
          serverCount: 4,
          metricsCount: 50,
        },
      };

    case 'staging':
      return {
        ...baseConfig,
        database: {
          useRealDB: !!process.env.DATABASE_URL,
          useMockData: !process.env.DATABASE_URL,
          redisEnabled: !!process.env.UPSTASH_REDIS_REST_URL,
        },
        mcp: {
          enabledServers: ['filesystem', 'github'],
          useLocalPaths: false,
          enableDebugLogging: true,
        },
        ai: {
          useMockEngine: false,
          enableTensorFlow: true,
          enableAdvancedFeatures: false, // 스테이징은 기본 기능만
        },
        logging: {
          level: 'info',
          enableConsole: true,
          enableFile: false,
        },
        performance: {
          enableOptimizations: true,
          serverCount: 9,
          metricsCount: 200,
        },
      };

    case 'production':
      return {
        ...baseConfig,
        database: {
          useRealDB: !!process.env.DATABASE_URL,
          useMockData: !process.env.DATABASE_URL,
          redisEnabled: !!process.env.UPSTASH_REDIS_REST_URL,
        },
        mcp: {
          enabledServers: ['filesystem', 'github'],
          useLocalPaths: false,
          enableDebugLogging: false,
        },
        ai: {
          useMockEngine: false,
          enableTensorFlow: true,
          enableAdvancedFeatures: true,
        },
        logging: {
          level: 'error',
          enableConsole: false,
          enableFile: false,
        },
        performance: {
          enableOptimizations: true,
          serverCount: 9,
          metricsCount: 200,
        },
      };

    default:
      throw new Error(`Unknown environment: ${env}`);
  }
}

// 환경별 헬퍼 함수들
export const env = getEnvironmentConfig();

export function isDevelopment(): boolean {
  return env.isDevelopment;
}

export function isProduction(): boolean {
  return env.isProduction;
}

export function isTest(): boolean {
  return env.isTest;
}

export function isVercel(): boolean {
  return env.isVercel;
}

export function shouldUseMockData(): boolean {
  // 환경변수로 명시적으로 Mock 모드를 활성화한 경우에만 Mock 사용
  const forceMock = process.env.DATABASE_ENABLE_MOCK_MODE === 'true';

  // 실제 DB 환경변수가 설정되어 있으면 실제 DB 우선 사용
  const hasSupabase =
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const hasRedis =
    process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;

  if (forceMock) {
    console.log('🔧 Mock 모드 강제 활성화됨 (DATABASE_ENABLE_MOCK_MODE=true)');
    return true;
  }

  if (hasSupabase && hasRedis) {
    console.log('✅ 실제 DB 환경변수 감지됨, 실제 DB 사용');
    return false;
  }

  console.log('⚠️ DB 환경변수 부족하지만 실제 DB 시도');
  return false; // 환경변수가 없어도 실제 DB 우선 시도
}

export function shouldEnableDebugLogging(): boolean {
  return env.mcp.enableDebugLogging;
}

// 로깅 헬퍼
export function envLog(
  level: 'debug' | 'info' | 'warn' | 'error',
  message: string,
  ...args: any[]
): void {
  if (!env.logging.enableConsole) return;

  const shouldLog =
    env.logging.level === 'debug' ||
    (env.logging.level === 'info' &&
      ['info', 'warn', 'error'].includes(level)) ||
    (env.logging.level === 'warn' && ['warn', 'error'].includes(level)) ||
    (env.logging.level === 'error' && level === 'error');

  if (shouldLog) {
    const prefix = `[${env.name.toUpperCase()}]`;
    console[level](prefix, message, ...args);
  }
}

/**
 * 🔍 플랫폼별 환경 감지 (utils 버전에서 추가)
 */
export interface DetectedEnvironment {
  name: Environment;
  platform: string;
  isVercel: boolean;
  isRender: boolean;
  isNetlify: boolean;
  paths: {
    root: string;
    src: string;
    docs: string;
    actual: string;
  };
  limits: {
    memory: string;
  };
}

export function detectEnvironment(): DetectedEnvironment {
  const currentEnv = getCurrentEnvironment();
  const platform = process.platform;

  // 기본 경로 설정
  const rootPath = process.cwd();

  return {
    name: currentEnv,
    platform,
    isVercel: !!process.env.VERCEL,
    isRender: !!process.env.RENDER,
    isNetlify: !!process.env.NETLIFY,
    paths: {
      root: rootPath,
      src: rootPath + '/src',
      docs: rootPath + '/docs',
      actual: rootPath,
    },
    limits: {
      memory: '--max-old-space-size=256',
    },
  };
}

export function checkPaths(): void {
  const envData = detectEnvironment();
  console.log(`📂 경로 확인: ${envData.paths.root}`);
  // 실제 경로 체크 로직은 간소화
}

export function getMCPConfig(): any {
  // MCP 설정 반환 (간소화된 버전)
  return {
    enabledServers: env.mcp.enabledServers,
    useLocalPaths: env.mcp.useLocalPaths,
    enableDebugLogging: env.mcp.enableDebugLogging,
  };
}

/**
 * 🔧 데이터 생성기 설정 (utils 버전에서 추가)
 */
export function getDataGeneratorConfig(): any {
  return {
    serverCount: env.performance.serverCount,
    metricsCount: env.performance.metricsCount,
    enableOptimizations: env.performance.enableOptimizations,
  };
}

export function isPluginEnabled(pluginName: string): boolean {
  // 간소화된 플러그인 체크
  return env.ai.enableAdvancedFeatures;
}

export function getPluginConfig(pluginName: string): any {
  // 기본 플러그인 설정 반환
  return {
    enabled: isPluginEnabled(pluginName),
    config: {},
  };
}
