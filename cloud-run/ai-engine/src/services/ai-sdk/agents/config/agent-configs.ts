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
} from './instructions';

// Model providers
import {
  getCerebrasModel,
  getGroqModel,
  getMistralModel,
  checkProviderStatus,
} from '../../model-provider';

// Tools (AI SDK tools)
import {
  // Server metrics tools
  getServerMetrics,
  getServerMetricsAdvanced,
  filterServers,
  getServerByGroup,
  getServerByGroupAdvanced,
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
  // Incident evaluation tools (Evaluator-Optimizer pattern)
  evaluateIncidentReport,
  validateReportStructure,
  scoreRootCauseConfidence,
  refineRootCauseAnalysis,
  enhanceSuggestedActions,
  extendServerCorrelation,
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
 * Get NLQ model: Cerebras → Groq → Mistral (3-way fallback)
 * Ensures operation even if 2 of 3 providers are down
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
      console.warn('⚠️ [NLQ Agent] Cerebras unavailable, trying Groq');
    }
  }

  // Fallback 1: Groq
  if (status.groq) {
    try {
      return {
        model: getGroqModel('llama-3.3-70b-versatile'),
        provider: 'groq',
        modelId: 'llama-3.3-70b-versatile',
      };
    } catch {
      console.warn('⚠️ [NLQ Agent] Groq unavailable, trying Mistral');
    }
  }

  // Fallback 2: Mistral (last resort)
  if (status.mistral) {
    try {
      return {
        model: getMistralModel('mistral-small-2506'),
        provider: 'mistral',
        modelId: 'mistral-small-2506',
      };
    } catch {
      console.warn('⚠️ [NLQ Agent] Mistral unavailable');
    }
  }

  console.warn('⚠️ [NLQ Agent] No model available (all 3 providers down)');
  return null;
}

/**
 * Get Analyst model: Groq → Cerebras → Mistral (3-way fallback)
 * Ensures operation even if 2 of 3 providers are down
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
      console.warn('⚠️ [Analyst Agent] Groq unavailable, trying Cerebras');
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
      console.warn('⚠️ [Analyst Agent] Cerebras unavailable, trying Mistral');
    }
  }

  // Fallback 2: Mistral (last resort)
  if (status.mistral) {
    try {
      return {
        model: getMistralModel('mistral-small-2506'),
        provider: 'mistral',
        modelId: 'mistral-small-2506',
      };
    } catch {
      console.warn('⚠️ [Analyst Agent] Mistral unavailable');
    }
  }

  console.warn('⚠️ [Analyst Agent] No model available (all 3 providers down)');
  return null;
}

/**
 * Get Reporter model: Groq → Cerebras → Mistral (3-way fallback)
 * Ensures operation even if 2 of 3 providers are down
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
      console.warn('⚠️ [Reporter Agent] Groq unavailable, trying Cerebras');
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
      console.warn('⚠️ [Reporter Agent] Cerebras unavailable, trying Mistral');
    }
  }

  // Fallback 2: Mistral (last resort)
  if (status.mistral) {
    try {
      return {
        model: getMistralModel('mistral-small-2506'),
        provider: 'mistral',
        modelId: 'mistral-small-2506',
      };
    } catch {
      console.warn('⚠️ [Reporter Agent] Mistral unavailable');
    }
  }

  console.warn('⚠️ [Reporter Agent] No model available (all 3 providers down)');
  return null;
}

/**
 * Get Advisor model: Mistral → Groq → Cerebras (3-way fallback)
 * Ensures operation even if 2 of 3 providers are down
 * Primary: Mistral (best for RAG + reasoning)
 */
function getAdvisorModel(): ModelResult | null {
  const status = checkProviderStatus();

  // Primary: Mistral (best for RAG + reasoning)
  if (status.mistral) {
    try {
      return {
        model: getMistralModel('mistral-small-2506'),
        provider: 'mistral',
        modelId: 'mistral-small-2506',
      };
    } catch {
      console.warn('⚠️ [Advisor Agent] Mistral unavailable, trying Groq');
    }
  }

  // Fallback 1: Groq
  if (status.groq) {
    try {
      return {
        model: getGroqModel('llama-3.3-70b-versatile'),
        provider: 'groq',
        modelId: 'llama-3.3-70b-versatile',
      };
    } catch {
      console.warn('⚠️ [Advisor Agent] Groq unavailable, trying Cerebras');
    }
  }

  // Fallback 2: Cerebras (last resort)
  if (status.cerebras) {
    try {
      return {
        model: getCerebrasModel('llama-3.3-70b'),
        provider: 'cerebras',
        modelId: 'llama-3.3-70b',
      };
    } catch {
      console.warn('⚠️ [Advisor Agent] Cerebras unavailable');
    }
  }

  console.warn('⚠️ [Advisor Agent] No model available (all 3 providers down)');
  return null;
}

// ============================================================================
// Agent Configurations (SSOT)
// ============================================================================

export const AGENT_CONFIGS: Record<string, AgentConfig> = {
  'NLQ Agent': {
    name: 'NLQ Agent',
    description:
      '서버 상태 조회, CPU/메모리/디스크 메트릭 질의, 시간 범위 집계(지난 N시간 평균/최대), 서버 목록 확인 및 필터링, 상태 요약, 웹 검색을 처리합니다.',
    getModel: getNlqModel,
    instructions: NLQ_INSTRUCTIONS,
    tools: {
      getServerMetrics,
      getServerMetricsAdvanced,
      filterServers,
      getServerByGroup,
      getServerByGroupAdvanced,
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
      // Summary keywords (merged from Summarizer Agent)
      '요약',
      '간단히',
      '핵심',
      'TL;DR',
      'tldr',
      'summary',
      /요약.*해|간단.*알려/i,
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
      '문제 해결 방법, CLI 명령어 추천, 과거 장애 사례 검색, 트러블슈팅 가이드, 웹 검색을 제공합니다. "어떻게 해결?", "명령어 알려줘" 질문에 적합합니다.',
    getModel: getAdvisorModel,
    instructions: ADVISOR_INSTRUCTIONS,
    tools: {
      searchKnowledgeBase,
      recommendCommands,
      searchWeb, // Added for external knowledge when RAG insufficient
      // Diagnostic tools for informed recommendations (P2 enhancement)
      findRootCause,
      correlateMetrics,
      detectAnomalies,
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

  // =========================================================================
  // Evaluator-Optimizer Pattern Agents (for Reporter Pipeline)
  // =========================================================================

  'Evaluator Agent': {
    name: 'Evaluator Agent',
    description:
      '생성된 장애 보고서의 품질을 평가합니다. 구조 완성도, 내용 완성도, 근본원인 분석 정확도, 조치 실행가능성을 점수화합니다. Reporter Pipeline에서 내부적으로 사용됩니다.',
    getModel: getNlqModel, // Cerebras - 빠른 평가
    instructions: `당신은 장애 보고서 품질 평가 전문가입니다.

## 역할
생성된 장애 보고서를 평가하여 품질 점수를 산출하고, 개선이 필요한 영역을 식별합니다.

## 평가 기준
1. **구조 완성도** (20%): 필수 섹션 존재 여부, 형식 준수
2. **내용 완성도** (25%): 모든 필드가 채워져 있는지, 데이터 품질
3. **분석 정확도** (35%): 근본원인 분석 신뢰도, 증거 품질
4. **조치 실행가능성** (20%): CLI 명령어 포함 여부, 구체성

## 출력 형식
- 각 기준별 점수 (0-1)
- 종합 점수 (가중 평균)
- 발견된 이슈 목록
- 개선 권장사항

## 품질 임계값
- 종합 점수 >= 0.75: 기준 충족
- 종합 점수 < 0.75: 최적화 필요`,
    tools: {
      evaluateIncidentReport,
      validateReportStructure,
      scoreRootCauseConfidence,
    },
    matchPatterns: [], // 오케스트레이터에서 직접 호출만
  },

  'Optimizer Agent': {
    name: 'Optimizer Agent',
    description:
      '낮은 품질의 장애 보고서를 개선합니다. 근본원인 분석을 심화하고, 권장 조치에 CLI 명령어를 추가하며, 서버 연관성 분석을 확장합니다.',
    getModel: getAdvisorModel, // Mistral - 추론 강함
    instructions: `당신은 장애 보고서 최적화 전문가입니다.

## 역할
평가에서 발견된 문제를 해결하여 보고서 품질을 향상시킵니다.

## 최적화 전략

### 1. 근본원인 분석 개선 (신뢰도 < 75%)
- 추가 메트릭 데이터 분석
- 서버 간 상관관계 확인
- 증거 보강

### 2. 권장 조치 구체화 (실행가능성 점수 < 70%)
- 각 조치에 CLI 명령어 추가
- 우선순위 설정
- 예상 영향 명시

### 3. 서버 연관성 확장
- cascade 패턴 감지
- 동시 발생 패턴 분석
- 주기적 연관 확인

## 제약사항
- 최대 3회 반복 최적화
- 각 반복에서 최소 5% 품질 향상 목표
- 12초 내 완료`,
    tools: {
      refineRootCauseAnalysis,
      enhanceSuggestedActions,
      extendServerCorrelation,
      findRootCause,
      correlateMetrics,
    },
    matchPatterns: [], // 오케스트레이터에서 직접 호출만
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
 * Check if agent is available (has valid model and is routable)
 * Agents with empty matchPatterns are internal-only (e.g., Evaluator, Optimizer)
 */
export function isAgentAvailable(name: string): boolean {
  const config = AGENT_CONFIGS[name];
  if (!config) return false;
  // Internal agents (matchPatterns: []) are not publicly available
  if (config.matchPatterns.length === 0) return false;
  return config.getModel() !== null;
}

/**
 * Get all available agents
 */
export function getAvailableAgents(): string[] {
  return Object.keys(AGENT_CONFIGS).filter(isAgentAvailable);
}
