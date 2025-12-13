/**
 * LangGraph StateGraph State Definition
 * 멀티에이전트 시스템의 공유 상태 정의
 */

import type { BaseMessage } from '@langchain/core/messages';
import { Annotation, messagesStateReducer } from '@langchain/langgraph';

// ============================================================================
// 1. Agent Types
// ============================================================================

export type AgentType = 'nlq' | 'analyst' | 'reporter' | 'reply' | null;
export type TaskType = 'monitoring' | 'incident_ops' | 'analysis' | 'general';

// ============================================================================
// 2. Circuit Breaker State (Model Health Tracking)
// ============================================================================

export interface ModelHealthState {
  failures: number;
  lastFailure: number | null;
  isOpen: boolean;
  halfOpenAttempts: number;
}

export interface CircuitBreakerState {
  models: Record<string, ModelHealthState>;
  threshold: number;
  resetTimeMs: number;
}

// ============================================================================
// 3. Tool Results Interface
// ============================================================================

export interface ToolResult {
  toolName: string;
  success: boolean;
  data: unknown;
  error?: string;
  executedAt: string;
}

// ============================================================================
// 4. Router Decision Interface
// ============================================================================

export interface RouterDecision {
  targetAgent: AgentType;
  confidence: number;
  reasoning: string;
  directReply?: string;
  suggestedModel?: string;
}

// ============================================================================
// 5. Main AgentState Definition (LangGraph Annotation)
// ============================================================================

/**
 * LangGraph StateGraph의 핵심 상태 정의
 *
 * @property messages - 대화 히스토리 (reducer로 누적)
 * @property targetAgent - Supervisor가 선택한 Worker Agent
 * @property taskType - 작업 유형 (monitoring, incident_ops, analysis, general)
 * @property routerDecision - Supervisor의 라우팅 결정 상세
 * @property toolResults - Worker Agent의 도구 실행 결과
 * @property modelHealth - Circuit Breaker 상태
 * @property sessionId - 세션 식별자 (Checkpointer thread_id)
 * @property iteration - 현재 반복 횟수 (무한 루프 방지)
 * @property finalResponse - 최종 응답 (END 조건)
 */
export const AgentState = Annotation.Root({
  // 대화 히스토리 (누적)
  messages: Annotation<BaseMessage[]>({
    reducer: messagesStateReducer,
    default: () => [],
  }),

  // Supervisor 라우팅 결과
  targetAgent: Annotation<AgentType>({
    reducer: (_, next) => next,
    default: () => null,
  }),

  taskType: Annotation<TaskType>({
    reducer: (_, next) => next,
    default: () => 'general',
  }),

  routerDecision: Annotation<RouterDecision | null>({
    reducer: (_, next) => next,
    default: () => null,
  }),

  // Worker Agent 결과
  toolResults: Annotation<ToolResult[]>({
    reducer: (current, update) => [...current, ...update],
    default: () => [],
  }),

  // Circuit Breaker 상태
  modelHealth: Annotation<CircuitBreakerState>({
    reducer: (current, update) => ({
      ...current,
      ...update,
      models: { ...current.models, ...update.models },
    }),
    default: () => ({
      models: {},
      threshold: 3,
      resetTimeMs: 60000, // 1분
    }),
  }),

  // 세션 메타데이터
  sessionId: Annotation<string>({
    reducer: (_, next) => next,
    default: () => '',
  }),

  iteration: Annotation<number>({
    reducer: (_, next) => next,
    default: () => 0,
  }),

  // 최종 응답 (END 조건)
  finalResponse: Annotation<string | null>({
    reducer: (_, next) => next,
    default: () => null,
  }),
});

// Type inference helper
export type AgentStateType = typeof AgentState.State;

// ============================================================================
// 6. Constants
// ============================================================================

export const MAX_ITERATIONS = 5; // 무한 루프 방지
export const SUPERVISOR_NODE = 'supervisor';
export const NLQ_NODE = 'nlq_agent';
export const ANALYST_NODE = 'analyst_agent';
export const REPORTER_NODE = 'reporter_agent';
export const END_NODE = '__end__';

// ============================================================================
// 7. Utility Functions
// ============================================================================

/**
 * Circuit Breaker 상태 확인
 */
export function isModelHealthy(
  state: CircuitBreakerState,
  modelId: string
): boolean {
  const health = state.models[modelId];
  if (!health) return true;

  if (health.isOpen) {
    // Reset time 경과 확인
    if (
      health.lastFailure &&
      Date.now() - health.lastFailure > state.resetTimeMs
    ) {
      return true; // Half-open 상태로 전환 가능
    }
    return false;
  }

  return true;
}

/**
 * 모델 실패 기록
 */
export function recordFailure(
  state: CircuitBreakerState,
  modelId: string
): CircuitBreakerState {
  const current = state.models[modelId] || {
    failures: 0,
    lastFailure: null,
    isOpen: false,
    halfOpenAttempts: 0,
  };

  const newFailures = current.failures + 1;
  const shouldOpen = newFailures >= state.threshold;

  return {
    ...state,
    models: {
      ...state.models,
      [modelId]: {
        failures: newFailures,
        lastFailure: Date.now(),
        isOpen: shouldOpen,
        halfOpenAttempts: current.halfOpenAttempts,
      },
    },
  };
}

/**
 * 모델 성공 시 상태 리셋
 */
export function recordSuccess(
  state: CircuitBreakerState,
  modelId: string
): CircuitBreakerState {
  return {
    ...state,
    models: {
      ...state.models,
      [modelId]: {
        failures: 0,
        lastFailure: null,
        isOpen: false,
        halfOpenAttempts: 0,
      },
    },
  };
}
