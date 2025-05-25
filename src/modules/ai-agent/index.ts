/**
 * OpenManager AI Agent Module
 * 
 * 🧠 완전히 이식 가능한 AI 에이전트 엔진
 * - 어떤 환경에서든 독립적으로 동작
 * - 플러그인 기반 확장성
 * - 어댑터 패턴으로 환경 추상화
 * - NPU 시뮬레이션 기반 경량 추론
 */

// Core Engine
export { AIAgentEngine } from './core/AIAgentEngine';
export type { 
  AIAgentConfig, 
  AIAgentRequest, 
  AIAgentResponse 
} from './core/AIAgentEngine';

// Configuration System
export {
  createDefaultConfig,
  environmentPresets,
  validateConfig,
  detectEnvironment,
  AIAgentConfigBuilder,
  createConfig
} from './config';
export type {
  AIAgentEnvironmentConfig,
  AIAgentAdapterConfig
} from './config';

// Adapter System
export {
  AdapterFactory,
  MemoryStorageAdapter,
  LocalStorageAdapter,
  ConsoleLoggingAdapter,
  SilentLoggingAdapter,
  FetchNetworkAdapter,
  MockNetworkAdapter,
  ConsoleMetricsAdapter,
  NoOpMetricsAdapter
} from './adapters';
export type {
  StorageAdapter,
  LoggingAdapter,
  NetworkAdapter,
  MetricsAdapter
} from './adapters';

// Plugin System
export {
  PluginManager,
  DebugPlugin,
  MetricsPlugin,
  CachePlugin
} from './plugins';
export type {
  Plugin,
  PluginManifest,
  PluginContext
} from './plugins';

// Core Components
export { ModeManager, createDefaultModeConfig } from './core/ModeManager';
export { ThinkingProcessor } from './core/ThinkingProcessor';
export { AdminLogger } from './core/AdminLogger';

// Processors (Internal)
export { IntentClassifier } from './processors/IntentClassifier';
export { ResponseGenerator } from './processors/ResponseGenerator';
export { ContextManager } from './processors/ContextManager';
export { ActionExecutor } from './processors/ActionExecutor';

// Version and Metadata
export const AI_AGENT_VERSION = '1.0.0';
export const AI_AGENT_NAME = '@openmanager/ai-agent';

/**
 * 빠른 설정 함수
 * 
 * @example
 * ```typescript
 * import { createAIAgent } from '@openmanager/ai-agent';
 * 
 * const aiAgent = await createAIAgent({
 *   environment: 'browser',
 *   enableLogging: true,
 *   plugins: ['debug', 'metrics']
 * });
 * 
 * const response = await aiAgent.processQuery({
 *   query: '서버 상태를 확인해주세요'
 * });
 * ```
 */
export const createAIAgent = async (options: Partial<AIAgentEnvironmentConfig> = {}) => {
  const config = options.environment 
    ? createDefaultConfig(options)
    : detectEnvironment();
    
  const aiAgent = AIAgentEngine.getInstance(config);
  await aiAgent.initialize();
  
  return aiAgent;
};

/**
 * 환경별 빠른 생성 함수들
 */
export const createBrowserAIAgent = async (options: Partial<AIAgentEnvironmentConfig> = {}) => {
  const config = createDefaultConfig({
    ...environmentPresets.browser(),
    ...options
  });
  
  const aiAgent = AIAgentEngine.getInstance(config);
  await aiAgent.initialize();
  
  return aiAgent;
};

export const createServerAIAgent = async (options: Partial<AIAgentEnvironmentConfig> = {}) => {
  const config = createDefaultConfig({
    ...environmentPresets.server(),
    ...options
  });
  
  const aiAgent = AIAgentEngine.getInstance(config);
  await aiAgent.initialize();
  
  return aiAgent;
};

export const createEdgeAIAgent = async (options: Partial<AIAgentEnvironmentConfig> = {}) => {
  const config = createDefaultConfig({
    ...environmentPresets.edge(),
    ...options
  });
  
  const aiAgent = AIAgentEngine.getInstance(config);
  await aiAgent.initialize();
  
  return aiAgent;
};

export const createMobileAIAgent = async (options: Partial<AIAgentEnvironmentConfig> = {}) => {
  const config = createDefaultConfig({
    ...environmentPresets.mobile(),
    ...options
  });
  
  const aiAgent = AIAgentEngine.getInstance(config);
  await aiAgent.initialize();
  
  return aiAgent;
};

/**
 * 테스트용 AI 에이전트 생성
 */
export const createTestAIAgent = async (options: Partial<AIAgentEnvironmentConfig> = {}) => {
  const config = createDefaultConfig({
    environment: 'node',
    platform: 'server',
    runtime: {
      enableLogging: false,
      logLevel: 'error',
      enableMetrics: false,
      enableCache: false,
      cacheSize: 10,
      timeout: 1000
    },
    storage: {
      type: 'memory',
      prefix: 'test',
      ttl: 1000
    },
    engine: {
      enableNPU: true,
      enableMCP: false,
      maxContextLength: 1024,
      confidenceThreshold: 0.5,
      fallbackMode: 'simple'
    },
    network: {
      enableOffline: true,
      retryAttempts: 1,
      retryDelay: 100,
      enableCORS: false
    },
    security: {
      enableEncryption: false,
      enableSanitization: true,
      allowedOrigins: ['*'],
      rateLimiting: {
        enabled: false,
        maxRequests: 100,
        windowMs: 60000
      }
    },
    plugins: {
      enabled: [],
      config: {}
    },
    ...options
  });
  
  const aiAgent = AIAgentEngine.getInstance(config);
  await aiAgent.initialize();
  
  return aiAgent;
};

/**
 * 유틸리티 함수들
 */
export const isAIAgentSupported = (): boolean => {
  try {
    // 기본 JavaScript 기능 확인
    if (typeof Promise === 'undefined') return false;
    if (typeof Map === 'undefined') return false;
    if (typeof Set === 'undefined') return false;
    
    // 브라우저 환경에서 필요한 기능 확인
    if (typeof window !== 'undefined') {
      if (typeof localStorage === 'undefined') return false;
    }
    
    return true;
  } catch {
    return false;
  }
};

export const getAIAgentInfo = () => ({
  name: AI_AGENT_NAME,
  version: AI_AGENT_VERSION,
  environment: typeof window !== 'undefined' ? 'browser' : 'node',
  supported: isAIAgentSupported(),
  features: {
    npu: true,
    mcp: true,
    plugins: true,
    adapters: true,
    offline: true
  }
});

// 기본 인스턴스 (호환성을 위해)
export { aiAgentEngine } from './core/AIAgentEngine'; 