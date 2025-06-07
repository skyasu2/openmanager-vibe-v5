/**
 * 🌍 통합 환경 감지 및 설정 유틸리티
 * ai-agent/config의 고급 기능과 통합
 */
import * as fs from 'fs';

export interface Environment {
  name: string;
  isProduction: boolean;
  isRender: boolean;
  isVercel: boolean;
  isLocal: boolean;
  platform: string;
  paths: {
    root: string;
    src: string;
    docs: string;
    data: string;
    actual: string;
  };
  limits: {
    memory: string;
    timeout: number;
    fileSize: string;
  };
  dataGenerator: {
    mode: 'local' | 'premium' | 'basic';
    maxServers: number;
    refreshInterval: number;
    features: string[];
  };
  
  // 🆕 고급 기능 추가 (ai-agent/config에서)
  runtime: {
    enableLogging: boolean;
    logLevel: 'debug' | 'info' | 'warn' | 'error';
    enableMetrics: boolean;
    enableCache: boolean;
    cacheSize: number;
    timeout: number;
  };
  
  storage: {
    type: 'memory' | 'localStorage' | 'sessionStorage' | 'indexedDB' | 'file' | 'redis';
    prefix: string;
    ttl: number;
  };
  
  engine: {
    enableInference: boolean;
    enableMCP: boolean;
    maxContextLength: number;
    confidenceThreshold: number;
    fallbackMode: 'simple' | 'pattern' | 'llm';
  };
  
  network: {
    enableOffline: boolean;
    retryAttempts: number;
    retryDelay: number;
    enableCORS: boolean;
  };
  
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
  
  plugins: {
    enabled: string[];
    config: Record<string, any>;
  };
  
  adapters: {
    data: {
      type: 'rest' | 'graphql' | 'websocket' | 'mock' | 'file';
      endpoint?: string;
      headers?: Record<string, string>;
      transform?: (data: any) => any;
    };
    storage: {
      type: 'memory' | 'localStorage' | 'indexedDB' | 'file' | 'custom';
      implementation?: any;
    };
    logging: {
      type: 'console' | 'file' | 'remote' | 'custom';
      implementation?: any;
    };
    metrics: {
      type: 'none' | 'console' | 'prometheus' | 'custom';
      implementation?: any;
    };
  };
}

// 환경 감지 싱글톤
let cachedEnvironment: Environment | null = null;

/**
 * 현재 환경 감지 (캐시된 결과 반환)
 */
export function detectEnvironment(): Environment {
  if (cachedEnvironment) {
    return cachedEnvironment;
  }

  const isProduction = process.env.NODE_ENV === 'production';
  const isRender =
    process.env.RENDER === 'true' ||
    process.env.RENDER_SERVICE_ID !== undefined;
  const isVercel =
    process.env.VERCEL === '1' || process.env.VERCEL_ENV !== undefined;
  const isLocal = !isRender && !isVercel;

  // 실제 현재 작업 디렉터리
  const actualPath = process.cwd();

  // 환경별 경로 설정
  let paths = {
    root: '.',
    src: './src',
    docs: './docs',
    data: './data',
    actual: actualPath,
  };

  if (isRender) {
    paths = {
      root: actualPath,
      src: `${actualPath}/src`,
      docs: `${actualPath}/docs`,
      data: `${actualPath}/data`,
      actual: actualPath,
    };
  } else if (isVercel) {
    paths = {
      root: '/var/task',
      src: '/var/task/src',
      docs: '/var/task/docs',
      data: '/tmp/data',
      actual: actualPath,
    };
  }

  // 환경별 제한사항
  const limits = {
    memory: isRender
      ? '--max-old-space-size=512'
      : isVercel
        ? '--max-old-space-size=256'
        : '--max-old-space-size=1024',
    timeout: isRender ? 30000 : isVercel ? 10000 : 60000,
    fileSize: isRender ? '10MB' : isVercel ? '5MB' : '50MB',
  };

  // 🎰 서버 데이터 생성기 모드 결정
  let dataGeneratorMode: 'local' | 'premium' | 'basic' = 'basic';
  let maxServers = 8;
  let refreshInterval = 10000;
  let features = ['basic-metrics'];

  if (isLocal) {
    dataGeneratorMode = 'local';
    maxServers = 30;
    refreshInterval = 2000;
    features = [
      'basic-metrics',
      'advanced-patterns', 
      'realtime-simulation',
      'custom-scenarios',
      'performance-profiling',
      'gpu-metrics'
    ];
  } else if (isVercel && process.env.VERCEL_ENV === 'production') {
    dataGeneratorMode = 'premium';
    maxServers = 20;
    refreshInterval = 5000;
    features = [
      'basic-metrics',
      'advanced-patterns',
      'realtime-simulation',
      'custom-scenarios'
    ];
  } else if (isRender) {
    dataGeneratorMode = 'premium';
    maxServers = 15;
    refreshInterval = 5000;
    features = [
      'basic-metrics',
      'advanced-patterns',
      'realtime-simulation'
    ];
  }

  // 🆕 고급 런타임 설정
  const runtime = {
    enableLogging: true,
    logLevel: (isProduction ? 'warn' : 'debug') as 'debug' | 'info' | 'warn' | 'error',
    enableMetrics: isProduction,
    enableCache: true,
    cacheSize: isLocal ? 1000 : isVercel ? 100 : 500,
    timeout: limits.timeout
  };

  // 🆕 스토리지 설정
  const storage = {
    type: (typeof window !== 'undefined' ? 'localStorage' : 'memory') as 'memory' | 'localStorage' | 'sessionStorage' | 'indexedDB' | 'file' | 'redis',
    prefix: 'openmanager-vibe',
    ttl: 3600000 // 1시간
  };

  // 🆕 AI 엔진 설정
  const engine = {
    enableInference: true,
    enableMCP: true,
    maxContextLength: isLocal ? 8192 : isVercel ? 2048 : 4096,
    confidenceThreshold: 0.5,
    fallbackMode: 'pattern' as 'simple' | 'pattern' | 'llm'
  };

  // 🆕 네트워크 설정
  const network = {
    enableOffline: isLocal,
    retryAttempts: isLocal ? 5 : 3,
    retryDelay: 1000,
    enableCORS: !isLocal
  };

  // 🆕 보안 설정
  const security = {
    enableEncryption: isProduction,
    enableSanitization: true,
    allowedOrigins: isProduction ? ['https://openmanager-vibe-v5.vercel.app'] : ['*'],
    rateLimiting: {
      enabled: isProduction,
      maxRequests: isLocal ? 1000 : 100,
      windowMs: 60000
    }
  };

  // 🆕 플러그인 설정
  const plugins = {
    enabled: isLocal 
      ? ['network-topology', 'baseline-optimizer', 'demo-scenarios', 'prometheus-integration']
      : ['baseline-optimizer'],
    config: {
      'network-topology': { maxNodes: isLocal ? 50 : 20 },
      'baseline-optimizer': { enabled: true, cacheEnabled: true },
      'demo-scenarios': { autoRotate: isLocal },
      'prometheus-integration': { enabled: isProduction }
    }
  };

  // 🆕 어댑터 설정
  const adapters = {
    data: {
      type: 'rest' as const,
      endpoint: '/api',
      headers: { 'Content-Type': 'application/json' }
    },
    storage: {
      type: typeof window !== 'undefined' ? 'localStorage' as const : 'memory' as const
    },
    logging: {
      type: isProduction ? 'remote' as const : 'console' as const
    },
    metrics: {
      type: isProduction ? 'prometheus' as const : 'console' as const
    }
  };

  cachedEnvironment = {
    name: isRender ? 'render' : isVercel ? 'vercel' : 'local',
    isProduction,
    isRender,
    isVercel,
    isLocal,
    platform: process.platform,
    paths,
    limits,
    dataGenerator: {
      mode: dataGeneratorMode,
      maxServers,
      refreshInterval,
      features,
    },
    runtime,
    storage,
    engine,
    network,
    security,
    plugins,
    adapters
  };

  return cachedEnvironment;
}

/**
 * 환경 캐시 초기화 (테스트용)
 */
export function resetEnvironmentCache(): void {
  cachedEnvironment = null;
}

/**
 * 서버 데이터 생성기 설정 조회
 */
export function getDataGeneratorConfig() {
  const env = detectEnvironment();
  return env.dataGenerator;
}

/**
 * 🆕 플러그인 활성화 여부 확인
 */
export function isPluginEnabled(pluginName: string): boolean {
  const env = detectEnvironment();
  return env.plugins.enabled.includes(pluginName);
}

/**
 * 🆕 플러그인 설정 조회
 */
export function getPluginConfig(pluginName: string): any {
  const env = detectEnvironment();
  return env.plugins.config[pluginName] || {};
}

/**
 * 🆕 어댑터 설정 조회
 */
export function getAdapterConfig(adapterType: keyof Environment['adapters']) {
  const env = detectEnvironment();
  return env.adapters[adapterType];
}

/**
 * 🆕 런타임 설정 조회
 */
export function getRuntimeConfig() {
  const env = detectEnvironment();
  return env.runtime;
}

/**
 * 환경별 로깅
 */
export function envLog(
  level: 'info' | 'warn' | 'error' | 'debug',
  message: string
): void {
  const env = detectEnvironment();
  const timestamp = new Date().toISOString();
  const prefix = `[${env.name.toUpperCase()}]`;

  // 로그 레벨 체크
  const logLevels = { debug: 0, info: 1, warn: 2, error: 3 };
  const currentLevel = logLevels[env.runtime.logLevel];
  const messageLevel = logLevels[level];

  if (messageLevel < currentLevel) return;

  switch (level) {
    case 'info':
      console.log(`${timestamp} ${prefix} ℹ️  ${message}`);
      break;
    case 'warn':
      console.warn(`${timestamp} ${prefix} ⚠️  ${message}`);
      break;
    case 'error':
      console.error(`${timestamp} ${prefix} ❌ ${message}`);
      break;
    case 'debug':
      if (env.runtime.enableLogging) {
        console.debug(`${timestamp} ${prefix} 🐛 ${message}`);
      }
      break;
  }
}

/**
 * 🆕 환경 설정 빌더 클래스
 */
export class EnvironmentConfigBuilder {
  private overrides: Partial<Environment> = {};

  enablePlugin(plugin: string, config?: any) {
    if (!this.overrides.plugins) {
      this.overrides.plugins = { enabled: [], config: {} };
    }
    this.overrides.plugins.enabled = [...(this.overrides.plugins.enabled || []), plugin];
    if (config) {
      this.overrides.plugins.config = { ...this.overrides.plugins.config, [plugin]: config };
    }
    return this;
  }

  setLogLevel(level: 'debug' | 'info' | 'warn' | 'error') {
    if (!this.overrides.runtime) {
      this.overrides.runtime = {} as any;
    }
    (this.overrides.runtime as any).logLevel = level;
    return this;
  }

  enableMetrics(enabled: boolean = true) {
    if (!this.overrides.runtime) {
      this.overrides.runtime = {} as any;
    }
    (this.overrides.runtime as any).enableMetrics = enabled;
    return this;
  }

  setDataGeneratorMode(mode: 'local' | 'premium' | 'basic', maxServers?: number) {
    if (!this.overrides.dataGenerator) {
      this.overrides.dataGenerator = {} as any;
    }
    (this.overrides.dataGenerator as any).mode = mode;
    if (maxServers) {
      (this.overrides.dataGenerator as any).maxServers = maxServers;
    }
    return this;
  }

  build(): Environment {
    const baseEnv = detectEnvironment();
    return deepMerge(baseEnv, this.overrides);
  }
}

/**
 * 🆕 환경 설정 빌더 생성
 */
export function createEnvironmentConfig(): EnvironmentConfigBuilder {
  return new EnvironmentConfigBuilder();
}

/**
 * 경로 존재 여부 확인
 */
export function checkPaths(): void {
  const env = detectEnvironment();
  const { paths } = env;

  console.log('🔍 경로 확인 중...');
  console.log(`현재 작업 디렉터리: ${paths.actual}`);
  console.log(`프로젝트 루트: ${paths.root}`);
  console.log(`소스 디렉터리: ${paths.src}`);

  // src 디렉터리 존재 여부 확인
  try {
    if (fs.existsSync(paths.src)) {
      console.log('✅ src 디렉터리 존재함');
    } else {
      console.log('❌ src 디렉터리가 없음');
    }
  } catch (error) {
    console.log('⚠️ 경로 확인 중 오류:', error);
  }
}

/**
 * Render 전용 설정
 */
export function getRenderConfig() {
  const env = detectEnvironment();
  
  if (!env.isRender) {
    console.log('❌ Render 환경이 아닙니다.');
    return null;
  }

  return {
    serviceId: process.env.RENDER_SERVICE_ID,
    serviceName: process.env.RENDER_SERVICE_NAME,
    region: process.env.RENDER_REGION || 'oregon',
    branch: process.env.RENDER_GIT_BRANCH,
    commit: process.env.RENDER_GIT_COMMIT,
    memory: env.limits.memory,
    timeout: env.limits.timeout,
    environment: env.name
  };
}

/**
 * MCP 환경별 설정
 */
export function getMCPConfig() {
  const env = detectEnvironment();
  
  return {
    enabled: env.engine.enableMCP,
    maxContextLength: env.engine.maxContextLength,
    confidenceThreshold: env.engine.confidenceThreshold,
    fallbackMode: env.engine.fallbackMode,
    timeout: env.runtime.timeout
  };
}

// 유틸리티 함수
function deepMerge<T extends Record<string, any>>(target: T, source: Partial<T>): T {
  const result = { ...target };
  
  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = deepMerge(result[key] || ({} as any), source[key] as any);
    } else {
      result[key] = source[key] as any;
    }
  }
  
  return result;
}
