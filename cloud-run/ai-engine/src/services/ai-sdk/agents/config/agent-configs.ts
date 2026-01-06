/**
 * Agent Configurations (SSOT)
 *
 * Single Source of Truth for all agent configurations.
 * This file centralizes agent settings to eliminate DRY violations.
 *
 * Architecture:
 * - Instructions: Imported from ./instructions/
 * - Tools: Imported from ../../../../tools-ai-sdk
 * - Models: Configured via getModel functions with fallback chains
 *
 * @version 1.0.0
 * @created 2026-01-06
 */

import type { LanguageModel, Tool } from 'ai';

// Tool type from AI SDK
type ToolsMap = Record<string, Tool>;

// Instructions
import {
  NLQ_INSTRUCTIONS,
  ANALYST_INSTRUCTIONS,
  REPORTER_INSTRUCTIONS,
  ADVISOR_INSTRUCTIONS,
  SUMMARIZER_INSTRUCTIONS,
} from './instructions';

// Model providers
import {
  getCerebrasModel,
  getGroqModel,
  getMistralModel,
  getOpenRouterModel,
  checkProviderStatus,
} from '../../model-provider';

// Tools (AI SDK tools)
import {
  // Server metrics tools
  getServerMetrics,
  getServerMetricsAdvanced,
  filterServers,
  // Analysis tools
  detectAnomalies,
  predictTrends,
  analyzePattern,
  correlateMetrics,
  findRootCause,
  // Reporting tools
  buildIncidentTimeline,
  // RAG tools
  searchKnowledgeBase,
  recommendCommands,
  // Web search
  searchWeb,
} from '../../../../tools-ai-sdk';

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Model result from getModel function
 */
export interface ModelResult {
  model: LanguageModel;
  provider: string;
  modelId: string;
}

/**
 * Agent configuration interface
 */
export interface AgentConfig {
  /** Agent display name */
  name: string;
  /** Description for orchestrator routing decisions */
  description: string;
  /** Function to get model with fallback chain */
  getModel: () => ModelResult | null;
  /** Agent instructions (system prompt) */
  instructions: string;
  /** Available tools for the agent */
  tools: ToolsMap;
  /** Patterns for automatic routing */
  matchPatterns: (string | RegExp)[];
}

// ============================================================================
// Model Selection Functions
// ============================================================================

/**
 * Get NLQ model: Cerebras → Groq fallback
 */
function getNlqModel(): ModelResult | null {
  const status = checkProviderStatus();

  // Primary: Cerebras (24M tokens/day free tier)
  if (status.cerebras) {
    try {
      return {
        model: getCerebrasModel('llama-3.3-70b'),
        provider: 'cerebras',
        modelId: 'llama-3.3-70b',
      };
    } catch {
      console.warn('⚠️ [NLQ Agent] Cerebras unavailable, falling back to Groq');
    }
  }

  // Fallback: Groq
  if (status.groq) {
    return {
      model: getGroqModel('llama-3.3-70b-versatile'),
      provider: 'groq',
      modelId: 'llama-3.3-70b-versatile',
    };
  }

  console.warn('⚠️ [NLQ Agent] No model available');
  return null;
}

/**
 * Get Analyst model: Groq → Cerebras fallback
 */
function getAnalystModel(): ModelResult | null {
  const status = checkProviderStatus();

  // Primary: Groq (good Korean generation quality)
  if (status.groq) {
    try {
      return {
        model: getGroqModel('llama-3.3-70b-versatile'),
        provider: 'groq',
        modelId: 'llama-3.3-70b-versatile',
      };
    } catch {
      console.warn('⚠️ [Analyst Agent] Groq unavailable, falling back to Cerebras');
    }
  }

  // Fallback: Cerebras
  if (status.cerebras) {
    return {
      model: getCerebrasModel('llama-3.3-70b'),
      provider: 'cerebras',
      modelId: 'llama-3.3-70b',
    };
  }

  console.warn('⚠️ [Analyst Agent] No model available');
  return null;
}

/**
 * Get Reporter model: Groq → Cerebras fallback
 */
function getReporterModel(): ModelResult | null {
  const status = checkProviderStatus();

  // Primary: Groq
  if (status.groq) {
    try {
      return {
        model: getGroqModel('llama-3.3-70b-versatile'),
        provider: 'groq',
        modelId: 'llama-3.3-70b-versatile',
      };
    } catch {
      console.warn('⚠️ [Reporter Agent] Groq unavailable, falling back to Cerebras');
    }
  }

  // Fallback: Cerebras
  if (status.cerebras) {
    return {
      model: getCerebrasModel('llama-3.3-70b'),
      provider: 'cerebras',
      modelId: 'llama-3.3-70b',
    };
  }

  console.warn('⚠️ [Reporter Agent] No model available');
  return null;
}

/**
 * Get Advisor model: Mistral only (RAG + reasoning)
 */
function getAdvisorModel(): ModelResult | null {
  const status = checkProviderStatus();

  if (status.mistral) {
    try {
      return {
        model: getMistralModel('mistral-small-2506'),
        provider: 'mistral',
        modelId: 'mistral-small-2506',
      };
    } catch {
      console.warn('⚠️ [Advisor Agent] Mistral unavailable');
    }
  }

  console.warn('⚠️ [Advisor Agent] No model available');
  return null;
}

/**
 * Get Summarizer model: OpenRouter → Cerebras → Groq fallback
 */
function getSummarizerModel(): ModelResult | null {
  const status = checkProviderStatus();

  // Primary: OpenRouter (free tier)
  if (status.openrouter) {
    try {
      return {
        model: getOpenRouterModel('nvidia/llama-3.1-nemotron-70b-instruct:free'),
        provider: 'openrouter',
        modelId: 'nvidia/llama-3.1-nemotron-70b-instruct:free',
      };
    } catch {
      console.warn('⚠️ [Summarizer Agent] OpenRouter unavailable, falling back');
    }
  }

  // Fallback 1: Cerebras
  if (status.cerebras) {
    try {
      return {
        model: getCerebrasModel('llama-3.3-70b'),
        provider: 'cerebras',
        modelId: 'llama-3.3-70b',
      };
    } catch {
      console.warn('⚠️ [Summarizer Agent] Cerebras unavailable');
    }
  }

  // Fallback 2: Groq
  if (status.groq) {
    return {
      model: getGroqModel('llama-3.3-70b-versatile'),
      provider: 'groq',
      modelId: 'llama-3.3-70b-versatile',
    };
  }

  console.warn('⚠️ [Summarizer Agent] No model available');
  return null;
}

// ============================================================================
// Agent Configurations (SSOT)
// ============================================================================

export const AGENT_CONFIGS: Record<string, AgentConfig> = {
  'NLQ Agent': {
    name: 'NLQ Agent',
    description:
      '서버 상태 조회, CPU/메모리/디스크 메트릭 질의, 시간 범위 집계(지난 N시간 평균/최대), 서버 목록 확인 및 필터링, 웹 검색을 처리합니다.',
    getModel: getNlqModel,
    instructions: NLQ_INSTRUCTIONS,
    tools: {
      getServerMetrics,
      getServerMetricsAdvanced,
      filterServers,
      searchWeb,
    },
    matchPatterns: [
      // Korean keywords
      '서버',
      '상태',
      '목록',
      '조회',
      '알려',
      '보여',
      // Metric types
      'cpu',
      'CPU',
      '메모리',
      'memory',
      '디스크',
      'disk',
      '네트워크',
      'network',
      // Time range keywords
      '지난',
      '시간',
      '전체',
      // Query patterns
      /\d+%/i,
      /이상|이하|초과|미만/i,
      /몇\s*개|몇\s*대/i,
      /평균|합계|최대|최소/i,
      /높은|낮은|많은|적은/i,
      /지난\s*\d+\s*시간/i,
      // Web search triggers
      '검색',
      'search',
      '찾아',
      '뭐야',
      '뭔가요',
      '알려줘',
      /에러|error|오류/i,
      /해결|solution|fix/i,
      /방법|how to/i,
    ],
  },

  'Analyst Agent': {
    name: 'Analyst Agent',
    description:
      '이상 탐지, 트렌드 예측, 패턴 분석, 근본 원인 분석(RCA), 상관관계 분석을 수행합니다. "왜?", "이상 있어?", "예측해줘" 질문에 적합합니다.',
    getModel: getAnalystModel,
    instructions: ANALYST_INSTRUCTIONS,
    tools: {
      getServerMetrics,
      getServerMetricsAdvanced,
      detectAnomalies,
      predictTrends,
      analyzePattern,
      correlateMetrics,
      findRootCause,
    },
    matchPatterns: [
      // Anomaly keywords
      '이상',
      '비정상',
      'anomaly',
      '스파이크',
      'spike',
      // Prediction keywords
      '예측',
      '트렌드',
      '추세',
      '향후',
      'predict',
      // Analysis keywords
      '분석',
      '패턴',
      '원인',
      '왜',
      // Patterns
      /이상\s*(있|징후|탐지)/i,
      /언제.*될|고갈/i,
    ],
  },

  'Reporter Agent': {
    name: 'Reporter Agent',
    description:
      '장애 보고서 생성, 인시던트 타임라인 구성, 영향도 분석 보고서를 작성합니다. "보고서 만들어줘", "장애 정리" 요청에 적합합니다.',
    getModel: getReporterModel,
    instructions: REPORTER_INSTRUCTIONS,
    tools: {
      getServerMetrics,
      getServerMetricsAdvanced,
      filterServers,
      searchKnowledgeBase,
      buildIncidentTimeline,
      findRootCause,
      correlateMetrics,
    },
    matchPatterns: [
      // Report keywords
      '보고서',
      '리포트',
      'report',
      // Incident keywords
      '장애',
      '인시던트',
      'incident',
      '사고',
      // Timeline keywords
      '타임라인',
      'timeline',
      '시간순',
      // Summary keywords
      '정리',
      // Patterns
      /보고서.*만들|생성/i,
      /장애.*정리|요약/i,
    ],
  },

  'Advisor Agent': {
    name: 'Advisor Agent',
    description:
      '문제 해결 방법, CLI 명령어 추천, 과거 장애 사례 검색, 트러블슈팅 가이드를 제공합니다. "어떻게 해결?", "명령어 알려줘" 질문에 적합합니다.',
    getModel: getAdvisorModel,
    instructions: ADVISOR_INSTRUCTIONS,
    tools: {
      searchKnowledgeBase,
      recommendCommands,
    },
    matchPatterns: [
      // Solution keywords
      '해결',
      '방법',
      '어떻게',
      '조치',
      // Command keywords
      '명령어',
      'command',
      '실행',
      'cli',
      // Guide keywords
      '가이드',
      '도움',
      '추천',
      '안내',
      // History keywords
      '과거',
      '사례',
      '이력',
      '비슷한',
      '유사',
      // Patterns
      /어떻게.*해결|해결.*방법/i,
      /명령어.*알려|추천.*명령/i,
      /\?$/,
    ],
  },

  'Summarizer Agent': {
    name: 'Summarizer Agent',
    description:
      '빠른 상태 요약, 핵심 정보 추출, 간결한 현황 설명을 제공합니다. "요약해줘", "간단히 알려줘" 요청에 적합합니다.',
    getModel: getSummarizerModel,
    instructions: SUMMARIZER_INSTRUCTIONS,
    tools: {
      getServerMetrics,
      getServerMetricsAdvanced,
    },
    matchPatterns: [
      // Summary keywords
      '요약',
      '간단히',
      '핵심',
      '줄여서',
      '짧게',
      'TL;DR',
      'tldr',
      'summary',
      // Quick keywords
      '빠르게',
      '간략히',
      '한마디로',
      '결론',
      // Patterns
      /요약.*해|간단.*알려/i,
      /핵심.*뭐|결론.*뭐/i,
      /줄여.*말해|짧게.*설명/i,
    ],
  },
};

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get all agent names
 */
export function getAgentNames(): string[] {
  return Object.keys(AGENT_CONFIGS);
}

/**
 * Get agent config by name
 */
export function getAgentConfig(name: string): AgentConfig | undefined {
  return AGENT_CONFIGS[name];
}

/**
 * Check if agent is available (has valid model)
 */
export function isAgentAvailable(name: string): boolean {
  const config = AGENT_CONFIGS[name];
  if (!config) return false;
  return config.getModel() !== null;
}

/**
 * Get all available agents
 */
export function getAvailableAgents(): string[] {
  return Object.keys(AGENT_CONFIGS).filter(isAgentAvailable);
}
