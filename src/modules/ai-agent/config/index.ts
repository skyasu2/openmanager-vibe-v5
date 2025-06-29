/**
 * AI Agent Configuration System
 *
 * 🔧 환경 독립적인 설정 관리
 * - 다양한 환경에서 동작 가능
 * - 런타임 설정 변경 지원
 * - 플러그인 기반 확장성
 */

export interface AIAgentEnvironmentConfig {
  // 환경 설정
  environment: 'browser' | 'node' | 'edge' | 'worker';
  platform: 'web' | 'mobile' | 'desktop' | 'server';

  // 런타임 설정
  runtime: {
    enableLogging: boolean;
    logLevel: 'debug' | 'info' | 'warn' | 'error';
    enableMetrics: boolean;
    enableCache: boolean;
    cacheSize: number;
    timeout: number;
  };

  // 스토리지 설정
  storage: {
    type:
      | 'memory'
      | 'localStorage'
      | 'sessionStorage'
      | 'indexedDB'
      | 'file'
      | 'redis';
    prefix: string;
    ttl: number;
  };

  // AI 엔진 설정
  engine: {
    enableInference: boolean;
    enableMCP: boolean;
    maxContextLength: number;
    confidenceThreshold: number;
    fallbackMode: 'simple' | 'pattern' | 'llm';
  };

  // 네트워크 설정
  network: {
    enableOffline: boolean;
    retryAttempts: number;
    retryDelay: number;
    enableCORS: boolean;
  };

  // 보안 설정
  security: {
    enableEncryption: boolean;
    enableSanitization: boolean;
    allowedOrigins: string[];
    rateLimiting: {
      enabled: boolean;
      maxRequests: number;
      windowMs: number;
    };
  };

  // 플러그인 설정
  plugins: {
    enabled: string[];
    config: Record<string, any>;
  };
}

export interface AIAgentAdapterConfig {
  // 데이터 어댑터
  dataAdapter: {
    type: 'rest' | 'graphql' | 'websocket' | 'mock' | 'file';
    endpoint?: string;
    headers?: Record<string, string>;
    transform?: (data: any) => any;
  };

  // 스토리지 어댑터
  storageAdapter: {
    type: 'memory' | 'localStorage' | 'indexedDB' | 'file' | 'custom';
    implementation?: any;
  };

  // 로깅 어댑터
  loggingAdapter: {
    type: 'console' | 'file' | 'remote' | 'custom';
    implementation?: any;
  };

  // 메트릭 어댑터
  metricsAdapter: {
    type: 'none' | 'console' | 'prometheus' | 'custom';
    implementation?: any;
  };
}

/**
 * 기본 설정 생성
 */
export const createDefaultConfig = (
  overrides: Partial<AIAgentEnvironmentConfig> = {}
): AIAgentEnvironmentConfig => {
  const defaultConfig: AIAgentEnvironmentConfig = {
    environment: typeof window !== 'undefined' ? 'browser' : 'node',
    platform: typeof window !== 'undefined' ? 'web' : 'server',

    runtime: {
      enableLogging: true,
      logLevel: 'info',
      enableMetrics: false,
      enableCache: true,
      cacheSize: 100,
      timeout: 5000,
    },

    storage: {
      type: typeof window !== 'undefined' ? 'localStorage' : 'memory',
      prefix: 'ai-agent',
      ttl: 3600000, // 1시간
    },

    engine: {
      enableInference: true,
      enableMCP: true,
      maxContextLength: 4096,
      confidenceThreshold: 0.5,
      fallbackMode: 'pattern',
    },

    network: {
      enableOffline: true,
      retryAttempts: 3,
      retryDelay: 1000,
      enableCORS: true,
    },

    security: {
      enableEncryption: false,
      enableSanitization: true,
      allowedOrigins: ['*'],
      rateLimiting: {
        enabled: false,
        maxRequests: 100,
        windowMs: 60000,
      },
    },

    plugins: {
      enabled: [],
      config: {},
    },
  };

  return deepMerge(defaultConfig, overrides);
};

/**
 * 환경별 설정 프리셋
 */
export const environmentPresets = {
  // 브라우저 환경
  browser: (): Partial<AIAgentEnvironmentConfig> => ({
    environment: 'browser',
    platform: 'web',
  }),

  // Node.js 서버 환경
  server: (): Partial<AIAgentEnvironmentConfig> => ({
    environment: 'node',
    platform: 'server',
    runtime: {
      enableLogging: true,
      logLevel: 'debug',
      enableMetrics: true,
      enableCache: true,
      cacheSize: 100,
      timeout: 5000,
    },
    network: {
      enableOffline: false,
      enableCORS: false,
      retryAttempts: 3,
      retryDelay: 1000,
    },
  }),

  // Edge 환경 (Vercel Edge, Cloudflare Workers)
  edge: (): Partial<AIAgentEnvironmentConfig> => ({
    environment: 'edge',
    platform: 'server',
    runtime: {
      enableLogging: false,
      enableCache: false,
      logLevel: 'error',
      enableMetrics: false,
      cacheSize: 10,
      timeout: 3000,
    },
    network: {
      enableOffline: false,
      retryAttempts: 1,
      retryDelay: 500,
      enableCORS: true,
    },
  }),

  // 모바일 환경
  mobile: (): Partial<AIAgentEnvironmentConfig> => ({
    environment: 'browser',
    platform: 'mobile',
    runtime: {
      enableLogging: false,
      cacheSize: 50,
      logLevel: 'warn',
      enableMetrics: false,
      enableCache: true,
      timeout: 8000,
    },
    network: {
      enableOffline: true,
      retryAttempts: 5,
      retryDelay: 2000,
      enableCORS: true,
    },
  }),

  // 개발 환경
  development: (): Partial<AIAgentEnvironmentConfig> => ({
    runtime: {
      enableLogging: true,
      logLevel: 'debug',
      enableMetrics: true,
      enableCache: true,
      cacheSize: 200,
      timeout: 10000,
    },
    security: {
      enableSanitization: false,
      enableEncryption: false,
      allowedOrigins: ['*'],
      rateLimiting: {
        enabled: false,
        maxRequests: 1000,
        windowMs: 60000,
      },
    },
    plugins: { enabled: ['debug', 'devtools'], config: {} },
  }),

  // 프로덕션 환경
  production: (): Partial<AIAgentEnvironmentConfig> => ({
    runtime: {
      enableLogging: false,
      logLevel: 'error',
      enableMetrics: true,
      enableCache: true,
      cacheSize: 100,
      timeout: 5000,
    },
    security: {
      enableEncryption: true,
      enableSanitization: true,
      allowedOrigins: [],
      rateLimiting: {
        enabled: true,
        maxRequests: 100,
        windowMs: 60000,
      },
    },
    network: {
      retryAttempts: 1,
      retryDelay: 1000,
      enableOffline: false,
      enableCORS: false,
    },
  }),
};

/**
 * 설정 검증
 */
export const validateConfig = (
  config: AIAgentEnvironmentConfig
): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // 필수 설정 검증
  if (!config.environment) {
    errors.push('Environment is required');
  }

  if (!config.platform) {
    errors.push('Platform is required');
  }

  // 타임아웃 검증
  if (config.runtime.timeout < 1000) {
    errors.push('Timeout should be at least 1000ms');
  }

  // 캐시 크기 검증
  if (config.runtime.cacheSize < 10) {
    errors.push('Cache size should be at least 10');
  }

  // 신뢰도 임계값 검증
  if (
    config.engine.confidenceThreshold < 0 ||
    config.engine.confidenceThreshold > 1
  ) {
    errors.push('Confidence threshold should be between 0 and 1');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

/**
 * 설정 병합 유틸리티
 */
const deepMerge = <T extends Record<string, any>>(
  target: T,
  source: Partial<T>
): T => {
  const result = { ...target };

  for (const key in source) {
    if (
      source[key] &&
      typeof source[key] === 'object' &&
      !Array.isArray(source[key])
    ) {
      result[key] = deepMerge(result[key] || ({} as any), source[key] as any);
    } else {
      result[key] = source[key] as any;
    }
  }

  return result;
};

/**
 * 환경 감지
 */
export const detectEnvironment = (): AIAgentEnvironmentConfig => {
  // 브라우저 환경
  if (typeof window !== 'undefined') {
    const isMobile =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      );
    return createDefaultConfig(
      isMobile ? environmentPresets.mobile() : environmentPresets.browser()
    );
  }

  // Node.js 환경
  if (typeof process !== 'undefined' && process.versions?.node) {
    // Edge Runtime 감지
    if (process.env.VERCEL || process.env.CLOUDFLARE_WORKERS) {
      return createDefaultConfig(environmentPresets.edge());
    }
    return createDefaultConfig(environmentPresets.server());
  }

  // 기본값
  return createDefaultConfig();
};

/**
 * 설정 빌더
 */
export class AIAgentConfigBuilder {
  private config: any = {};

  environment(env: string) {
    this.config.environment = env;
    return this;
  }

  platform(platform: string) {
    this.config.platform = platform;
    return this;
  }

  enableLogging(enabled: boolean = true) {
    if (!this.config.runtime) this.config.runtime = {};
    this.config.runtime.enableLogging = enabled;
    return this;
  }

  logLevel(level: string) {
    if (!this.config.runtime) this.config.runtime = {};
    this.config.runtime.logLevel = level;
    return this;
  }

  storage(type: string) {
    if (!this.config.storage) this.config.storage = {};
    this.config.storage.type = type;
    return this;
  }

  enableInference(enabled: boolean = true) {
    if (!this.config.engine) this.config.engine = {};
    this.config.engine.enableInference = enabled;
    return this;
  }

  enableMCP(enabled: boolean = true) {
    if (!this.config.engine) this.config.engine = {};
    this.config.engine.enableMCP = enabled;
    return this;
  }

  timeout(ms: number) {
    if (!this.config.runtime) this.config.runtime = {};
    this.config.runtime.timeout = ms;
    return this;
  }

  plugins(plugins: string[]) {
    if (!this.config.plugins) this.config.plugins = {};
    this.config.plugins.enabled = plugins;
    return this;
  }

  build(): AIAgentEnvironmentConfig {
    return createDefaultConfig(this.config);
  }
}

/**
 * 빠른 설정 생성
 */
export const createConfig = () => new AIAgentConfigBuilder();
