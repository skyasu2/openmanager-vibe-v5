/**
 * OpenManager AI Agent Module
 * 
 * 🧠 NPU 기반 경량 AI 추론 엔진
 * - LLM 비용 없는 실시간 AI 추론
 * - MCP(Model Context Protocol) 기반 의도 분류
 * - 도메인 특화 서버 모니터링 AI
 * - 확장 가능한 플러그인 아키텍처
 */

// Core Engine
export { 
  AIAgentEngine, 
  aiAgentEngine,
  type AIAgentConfig,
  type AIAgentRequest,
  type AIAgentResponse 
} from './core/AIAgentEngine';

// Processors
export { 
  IntentClassifier,
  type Intent,
  type ClassificationContext 
} from './processors/IntentClassifier';

export { 
  ResponseGenerator,
  type ResponseRequest,
  type GeneratedResponse 
} from './processors/ResponseGenerator';

export { 
  ContextManager,
  type SessionContext,
  type ConversationEntry,
  type ServerContext,
  type AlertEntry,
  type UserPreferences 
} from './processors/ContextManager';

export { 
  ActionExecutor,
  type Action,
  type ActionType,
  type ActionResult 
} from './processors/ActionExecutor';

// Utility functions
export const createAIAgentInstance = async (config?: any) => {
  const { AIAgentEngine } = await import('./core/AIAgentEngine');
  return AIAgentEngine.getInstance(config);
};

export const getDefaultConfig = () => ({
  enableMCP: true,
  enableNPU: true,
  maxContextLength: 4096,
  responseTimeout: 5000,
  debugMode: process.env.NODE_ENV === 'development'
});

// Version info
export const AI_AGENT_VERSION = '1.0.0';
export const AI_AGENT_BUILD = Date.now(); 