/**
 * 다차원 AI 라우팅 타입 정의
 *
 * 복잡도, 토큰 가용성, 기능 요구사항 등 다양한 조건을 고려한 스마트 라우팅
 *
 * v5.84.0: GroqModel 타입 inline 이동 (groq-ai-manager.ts 의존성 제거)
 */

import type { QueryIntent } from '../rag/rag-types';

// ============================================================================
// 1. AI 모델 타입
// ============================================================================

/** Groq 모델 타입 (Cloud Run에서 사용) */
export type GroqModel =
  | 'llama-3.1-8b-instant'
  | 'llama-3.3-70b-versatile'
  | 'qwen-qwq-32b';

/** Mistral 모델 타입 (Cloud Run에서 사용) */
export type MistralModel = 'mistral-small-latest' | 'mistral-medium-latest';

export type AIModel = GroqModel | MistralModel;

export interface ModelCapabilities {
  /** 모델 ID */
  id: AIModel;
  /** 제공자 */
  provider: 'groq' | 'mistral';
  /** 최대 컨텍스트 토큰 */
  maxContext: number;
  /** 분당 요청 제한 */
  rpm: number;
  /** 일일 요청 제한 */
  rpd: number;
  /** 분당 토큰 제한 */
  tpm: number;
  /** Tool 사용 지원 여부 */
  supportsTools: boolean;
  /** 이미지 입력 지원 */
  supportsVision: boolean;
  /** Reasoning 모드 지원 */
  supportsReasoning: boolean;
  /** 상대적 품질 점수 (1-10) */
  qualityScore: number;
  /** 상대적 속도 점수 (1-10, 높을수록 빠름) */
  speedScore: number;
  /** 비용 점수 (1-10, 높을수록 저렴) */
  costScore: number;
}

// ============================================================================
// 2. Rate Limit 상태
// ============================================================================

export interface RateLimitStatus {
  /** 분당 남은 요청 수 */
  remainingRPM: number;
  /** 일일 남은 요청 수 */
  remainingRPD: number;
  /** 분당 남은 토큰 수 */
  remainingTPM: number;
  /** 사용 가능 여부 */
  isAvailable: boolean;
  /** 다음 리셋 시간 (ms) */
  nextResetMs?: number;
}

export interface AIProviderStatus {
  groq: {
    '8b': RateLimitStatus;
    '70b': RateLimitStatus;
    '32b': RateLimitStatus;
  };
  mistral: {
    small: RateLimitStatus;
    medium: RateLimitStatus;
  };
}

// ============================================================================
// 3. 쿼리 분석 결과
// ============================================================================

export interface QueryAnalysis {
  /** 원본 쿼리 */
  query: string;
  /** 추정 입력 토큰 수 */
  estimatedTokens: number;
  /** 복잡도 점수 (1-5) */
  complexity: number;
  /** 의도 */
  intent: QueryIntent | 'coding';
  /** 이미지 포함 여부 */
  hasImages: boolean;
  /** Thinking 모드 요청 */
  thinkingRequested: boolean;
  /** 컨텍스트 크기 (이전 메시지 포함) */
  contextSize: number;
  /** 추정 응답 토큰 */
  estimatedResponseTokens: number;
}

// ============================================================================
// 4. 기능 요구사항
// ============================================================================

export interface FeatureRequirements {
  /** RAG 검색 필요 여부 */
  needsRAG: boolean;
  /** RAG 검색 예상 결과 수 */
  ragMaxResults?: number;
  /** ML 분석 필요 여부 (이상탐지, 예측) */
  needsML: boolean;
  /** NLP 처리 필요 여부 (한국어 분석) */
  needsNLP: boolean;
  /** GCP Cloud Run 호출 필요 여부 */
  needsGCPProcessor: boolean;
  /** 서버 메트릭 조회 필요 */
  needsServerMetrics: boolean;
  /** Tool 호출 필요 여부 */
  needsTools: boolean;
  /** 이미지 분석 필요 */
  needsVision: boolean;
  /** 심층 추론 필요 */
  needsReasoning: boolean;
}

// ============================================================================
// 5. 라우팅 결정
// ============================================================================

export type RoutingLevel =
  | 1
  | 2
  | 3
  | 4
  | 5
  | 'thinking'
  | 'multimodal'
  | 'fast';

export interface RoutingDecision {
  /** 주 모델 ID */
  primaryModel: AIModel;
  /** 폴백 모델 ID (없을 수 있음) */
  fallbackModel: AIModel | null;
  /** 라우팅 레벨 */
  level: RoutingLevel;
  /** 제공자 */
  provider: 'groq' | 'mistral';

  /** 기능 활성화 */
  features: {
    useTools: boolean;
    useRAG: boolean;
    useML: boolean;
    useNLP: boolean;
    useGCP: boolean;
  };

  /** 토큰 설정 */
  tokens: {
    maxOutputTokens: number;
    temperature: number;
    /** RAG 컨텍스트 토큰 예산 */
    ragContextBudget: number;
  };

  /** 결정 근거 */
  reasoning: string[];

  /** 예상 성능 */
  expectedPerformance: {
    /** 예상 응답 시간 (ms) */
    latencyMs: number;
    /** 예상 품질 점수 (1-10) */
    qualityScore: number;
  };
}

// ============================================================================
// 6. 라우팅 컨텍스트 (엔진 입력)
// ============================================================================

export interface RoutingContext {
  /** 쿼리 분석 결과 */
  queryAnalysis: QueryAnalysis;
  /** AI 제공자 상태 */
  providerStatus: AIProviderStatus;
  /** 기능 요구사항 */
  featureRequirements: FeatureRequirements;
  /** 사용자 선호도 (선택) */
  preferences?: RoutingPreferences;
}

export interface RoutingPreferences {
  /** 속도 우선 vs 품질 우선 (0-1, 0=속도, 1=품질) */
  qualityVsSpeed: number;
  /** 비용 민감도 (0-1, 높을수록 저비용 선호) */
  costSensitivity: number;
  /** 특정 모델 강제 사용 */
  forceModel?: AIModel;
  /** 특정 제공자 선호 */
  preferredProvider?: 'groq' | 'mistral';
}

// ============================================================================
// 7. 모델 정의 상수
// ============================================================================

export const MODEL_CAPABILITIES: Record<AIModel, ModelCapabilities> = {
  // Groq Models
  'llama-3.1-8b-instant': {
    id: 'llama-3.1-8b-instant',
    provider: 'groq',
    maxContext: 8192,
    rpm: 30,
    rpd: 14400,
    tpm: 6000,
    supportsTools: true,
    supportsVision: false,
    supportsReasoning: false,
    qualityScore: 6,
    speedScore: 10,
    costScore: 10,
  },
  'llama-3.3-70b-versatile': {
    id: 'llama-3.3-70b-versatile',
    provider: 'groq',
    maxContext: 32768,
    rpm: 30,
    rpd: 1000,
    tpm: 12000,
    supportsTools: true,
    supportsVision: false,
    supportsReasoning: false,
    qualityScore: 8,
    speedScore: 7,
    costScore: 8,
  },
  'qwen-qwq-32b': {
    id: 'qwen-qwq-32b',
    provider: 'groq',
    maxContext: 32768,
    rpm: 30,
    rpd: 1000,
    tpm: 6000,
    supportsTools: true,
    supportsVision: false,
    supportsReasoning: true,
    qualityScore: 8,
    speedScore: 6,
    costScore: 8,
  },
  // Mistral Models (Cloud Run)
  'mistral-small-latest': {
    id: 'mistral-small-latest',
    provider: 'mistral',
    maxContext: 32768, // 32K tokens
    rpm: 60,
    rpd: 2000,
    tpm: 500000,
    supportsTools: true,
    supportsVision: false,
    supportsReasoning: false,
    qualityScore: 8,
    speedScore: 9,
    costScore: 9,
  },
  'mistral-medium-latest': {
    id: 'mistral-medium-latest',
    provider: 'mistral',
    maxContext: 32768, // 32K tokens
    rpm: 60,
    rpd: 2000,
    tpm: 500000,
    supportsTools: true,
    supportsVision: false,
    supportsReasoning: true,
    qualityScore: 9,
    speedScore: 7,
    costScore: 7,
  },
};

// ============================================================================
// 8. Intent → Feature 매핑
// ============================================================================

export const INTENT_FEATURE_MAP: Record<
  QueryIntent | 'coding',
  Partial<FeatureRequirements>
> = {
  monitoring: {
    needsRAG: true,
    ragMaxResults: 3,
    needsServerMetrics: true,
    needsML: false,
    needsTools: true,
  },
  analysis: {
    needsRAG: true,
    ragMaxResults: 5,
    needsML: true,
    needsNLP: true,
    needsGCPProcessor: true,
    needsTools: true,
  },
  guide: {
    needsRAG: true,
    ragMaxResults: 8,
    needsML: false,
    needsTools: false,
  },
  general: {
    needsRAG: false,
    needsML: false,
    needsTools: false,
  },
  coding: {
    needsRAG: true,
    ragMaxResults: 5,
    needsML: false,
    needsTools: true,
    needsReasoning: true,
  },
};

// ============================================================================
// 9. 복잡도 → 토큰 매핑
// ============================================================================

export const COMPLEXITY_TOKEN_MAP: Record<
  1 | 2 | 3 | 4 | 5,
  { maxOutput: number; temperature: number; ragBudget: number }
> = {
  1: { maxOutput: 1024, temperature: 0.3, ragBudget: 0 },
  2: { maxOutput: 2048, temperature: 0.4, ragBudget: 1000 },
  3: { maxOutput: 2048, temperature: 0.5, ragBudget: 2000 },
  4: { maxOutput: 4096, temperature: 0.6, ragBudget: 3000 },
  5: { maxOutput: 8192, temperature: 0.7, ragBudget: 4000 },
};

// ============================================================================
// 10. RouteLLM-style 스코어링 시스템 (Best Practice #1)
// ============================================================================

/**
 * 라우팅 스코어 - 다차원 평가
 * @see https://github.com/lm-sys/RouteLLM
 */
export interface RouteScore {
  /** 품질 점수 (1-10) */
  quality: number;
  /** 비용 점수 (1-10, 높을수록 저렴) */
  cost: number;
  /** 지연 점수 (1-10, 높을수록 빠름) */
  latency: number;
  /** 기능 적합성 점수 (1-10) */
  capability: number;
  /** 가용성 점수 (1-10) */
  availability: number;
  /** 총합 점수 (가중 평균) */
  total: number;
}

/**
 * 스코어 가중치 설정
 */
export interface ScoreWeights {
  quality: number;
  cost: number;
  latency: number;
  capability: number;
  availability: number;
}

/**
 * 기본 스코어 가중치 (균형 모드)
 */
export const DEFAULT_SCORE_WEIGHTS: ScoreWeights = {
  quality: 0.3,
  cost: 0.2,
  latency: 0.2,
  capability: 0.2,
  availability: 0.1,
};

// ============================================================================
// 11. Task-Based 모델 전문화 (Best Practice #2)
// ============================================================================

/**
 * 태스크 타입 - 모델 전문화 기준
 */
export type TaskType =
  | 'coding'
  | 'reasoning'
  | 'creative'
  | 'factual'
  | 'multimodal'
  | 'realtime'
  | 'general';

/**
 * 모델 전문화 매핑
 * @see OpenRouter Auto Router, RouteLLM research
 */
export const MODEL_SPECIALIZATION: Record<TaskType, AIModel[]> = {
  // 코딩: 추론 능력 중요
  coding: ['qwen-qwq-32b', 'mistral-medium-latest', 'llama-3.3-70b-versatile'],
  // 추론: Reasoning 모델 우선
  reasoning: [
    'mistral-medium-latest',
    'qwen-qwq-32b',
    'llama-3.3-70b-versatile',
  ],
  // 창작: 고품질 모델
  creative: [
    'mistral-medium-latest',
    'llama-3.3-70b-versatile',
    'mistral-small-latest',
  ],
  // 사실 정보: 빠른 응답
  factual: [
    'llama-3.1-8b-instant',
    'mistral-small-latest',
    'llama-3.3-70b-versatile',
  ],
  // 멀티모달: Vision 지원 (Mistral은 Vision 미지원이므로 Groq 우선)
  multimodal: ['llama-3.3-70b-versatile', 'mistral-medium-latest'],
  // 실시간: 최저 지연
  realtime: ['llama-3.1-8b-instant', 'mistral-small-latest'],
  // 일반: 균형
  general: [
    'mistral-small-latest',
    'llama-3.1-8b-instant',
    'llama-3.3-70b-versatile',
  ],
};

// ============================================================================
// 12. Circuit Breaker 패턴 (Best Practice #3)
// ============================================================================

/**
 * Circuit Breaker 상태
 */
export type CircuitState = 'closed' | 'open' | 'half-open';

/**
 * 모델 헬스 상태
 */
export interface ModelHealth {
  /** 모델 ID */
  model: AIModel;
  /** Circuit 상태 */
  circuitState: CircuitState;
  /** 연속 실패 횟수 */
  consecutiveFailures: number;
  /** 마지막 실패 시간 */
  lastFailureTime: number | null;
  /** 마지막 성공 시간 */
  lastSuccessTime: number | null;
  /** 평균 응답 시간 (ms) */
  avgLatencyMs: number;
  /** 최근 10회 성공률 */
  recentSuccessRate: number;
}

/**
 * Circuit Breaker 설정
 */
export interface CircuitBreakerConfig {
  /** Circuit Open 임계 실패 횟수 */
  failureThreshold: number;
  /** Half-Open 전환 대기 시간 (ms) */
  recoveryTimeMs: number;
  /** Half-Open 테스트 요청 수 */
  testRequestCount: number;
}

/**
 * 기본 Circuit Breaker 설정
 */
export const DEFAULT_CIRCUIT_BREAKER_CONFIG: CircuitBreakerConfig = {
  failureThreshold: 3,
  recoveryTimeMs: 30000, // 30초
  testRequestCount: 1,
};

// ============================================================================
// 13. Load Balancing (Best Practice #4)
// ============================================================================

/**
 * 로드 밸런싱 전략
 */
export type LoadBalanceStrategy =
  | 'round-robin'
  | 'least-loaded'
  | 'weighted-random'
  | 'adaptive'
  | 'agentic-router'
  | 'agentic-direct-reply';

/**
 * 모델 로드 상태
 */
export interface ModelLoadState {
  /** 모델 ID */
  model: AIModel;
  /** 현재 진행 중인 요청 수 */
  activeRequests: number;
  /** 분당 사용 토큰 */
  tokensUsedLastMinute: number;
  /** 남은 Rate Limit 비율 (0-1) */
  remainingCapacity: number;
  /** 예상 대기 시간 (ms) */
  estimatedWaitMs: number;
}

/**
 * 로드 밸런서 상태
 */
export interface LoadBalancerState {
  /** 전략 */
  strategy: LoadBalanceStrategy;
  /** 모델별 로드 상태 */
  modelLoads: Map<AIModel, ModelLoadState>;
  /** 마지막 선택 모델 (round-robin용) */
  lastSelectedModel: AIModel | null;
  /** 가중치 (weighted-random용) */
  weights: Map<AIModel, number>;
}

// ============================================================================
// 14. 향상된 라우팅 결정 (확장)
// ============================================================================

/**
 * 향상된 라우팅 결정 (스코어 포함)
 */
export interface EnhancedRoutingDecision extends RoutingDecision {
  /** 라우팅 스코어 */
  score?: RouteScore;
  /** 후보별 스코어 (순위 포함, 스코어 내림차순 정렬) */
  candidateScores: Array<{
    model: AIModel;
    score: RouteScore;
    rank: number;
  }>;
  /** 폴백 체인 (우선순위 순) */
  fallbackChain: AIModel[];
  /** 태스크 타입 */
  taskType: TaskType;
  /** Circuit Breaker 상태 요약 */
  circuitBreakerState: {
    openCircuits: AIModel[];
    halfOpenCircuits: AIModel[];
  };
  /** 선택 방법 (Load Balancing 전략) */
  selectionMethod: LoadBalanceStrategy;
}
