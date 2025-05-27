/**
 * OpenManager AI Agent Module
 * 
 * 🧠 완전히 이식 가능한 AI 에이전트 엔진
 * - 어떤 환경에서든 독립적으로 동작
 * - 플러그인 기반 확장성
 * - 어댑터 패턴으로 환경 추상화
 * - 지능형 패턴 기반 경량 추론
 */

// Core Engine
export { AIAgentEngine, aiAgentEngine } from './core/AIAgentEngine';
export type { 
  AIAgentConfig, 
  AIAgentRequest, 
  AIAgentResponse 
} from './core/AIAgentEngine';

// Smart Mode Detection System
export { SmartModeDetector } from './core/SmartModeDetector';
export type { AIAgentMode, QueryAnalysis } from './core/SmartModeDetector';
export { EnhancedModeManager } from './core/EnhancedModeManager';
export type { ModeConfig } from './core/EnhancedModeManager';

// Mode Prompts
export { ModePrompts } from './prompts/ModePrompts';

// Core Components
export { ModeManager, createDefaultModeConfig } from './core/ModeManager';
export type { PowerMode } from './core/ModeManager';

export { ThinkingProcessor } from './core/ThinkingProcessor';
export type { ThinkingStep, ThinkingSession, ThinkingCallback } from './core/ThinkingProcessor';

export { AdminLogger } from './core/AdminLogger';
export type { 
  AIInteractionLog,
  ErrorLog,
  AdminStats
} from './core/AdminLogger';

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
export const createAIAgent = async (options: any = {}) => {
  try {
    // 환경별 기본 설정 생성
    const { createDefaultConfig, detectEnvironment } = await import('./config');
    const envConfig = options.environment 
      ? createDefaultConfig(options)
      : detectEnvironment();
    
    // AI 에이전트 엔진 설정 변환
    const agentConfig = {
      enableMCP: envConfig.engine.enableMCP,
      enableInference: envConfig.engine.enableInference,
      maxContextLength: envConfig.engine.maxContextLength,
      responseTimeout: envConfig.runtime.timeout,
      debugMode: envConfig.runtime.logLevel === 'debug',
      mode: 'basic' as const,
      enableThinking: true,
      enableAdminLogging: envConfig.runtime.enableLogging
    };
    
    // AI 에이전트 엔진 인스턴스 생성
    const { AIAgentEngine } = await import('./core/AIAgentEngine');
    const aiAgent = AIAgentEngine.getInstance(agentConfig);
    
    // 초기화
    await aiAgent.initialize();
    
    return aiAgent;
  } catch (error) {
    console.error('Failed to create AI Agent:', error);
    throw error;
  }
};

/**
 * 환경별 빠른 생성 함수들
 */
export const createBrowserAIAgent = async (options: any = {}) => {
  return createAIAgent({ environment: 'browser', platform: 'web', ...options });
};

export const createServerAIAgent = async (options: any = {}) => {
  return createAIAgent({ environment: 'node', platform: 'server', ...options });
};

export const createEdgeAIAgent = async (options: any = {}) => {
  return createAIAgent({ environment: 'edge', platform: 'server', ...options });
};

export const createMobileAIAgent = async (options: any = {}) => {
  return createAIAgent({ environment: 'browser', platform: 'mobile', ...options });
};

/**
 * 프로덕션 준비된 AI 에이전트 생성
 * 실제 환경에서 바로 사용 가능한 완전한 기능 제공
 */
export const createProductionAIAgent = async (options: any = {}) => {
  const productionConfig = {
    enableMCP: true,           // 완전한 MCP 프로토콜 지원
    enableInference: true,           // NPU 시뮬레이션 활성화
    maxContextLength: 4096,    // 충분한 컨텍스트 길이
    responseTimeout: 10000,    // 안정적인 타임아웃
    debugMode: false,          // 프로덕션 모드
    mode: 'advanced' as const,          // 고급 모드
    enableThinking: true,      // 완전한 사고 과정
    enableAdminLogging: true,  // 완전한 로깅
    ...options
  };
  
  const { AIAgentEngine } = await import('./core/AIAgentEngine');
  const aiAgent = AIAgentEngine.getInstance(productionConfig);
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
    inference: true,
    mcp: true,
    plugins: true,
    adapters: true,
    offline: true
  }
});

/**
 * 스마트 모드 감지 시스템 사용 예제
 * 
 * ```typescript
 * import { SmartModeDetector, EnhancedModeManager } from '@/modules/ai-agent';
 * 
 * const detector = new SmartModeDetector();
 * const manager = new EnhancedModeManager();
 * 
 * // 질문 분석 및 자동 모드 선택
 * const analysis = manager.analyzeAndSetMode("서버 장애 원인을 분석해서 보고서 작성해줘");
 * console.log(analysis.detectedMode); // 'advanced'
 * console.log(analysis.confidence); // 95
 * console.log(analysis.reasoning); // 'Advanced 모드 선택 이유: 장애/문제 해결이 필요한 상황, 상세한 분석 보고서가 요구됨'
 * 
 * // 모드별 설정 조회
 * const config = manager.getModeConfig();
 * console.log(config.maxProcessingTime); // 10000 (Advanced 모드)
 * console.log(config.enablePredictiveAnalysis); // true
 * ```
 */ 