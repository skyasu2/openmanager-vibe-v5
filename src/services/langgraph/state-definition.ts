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
export type TaskType =
  | 'monitoring'
  | 'incident_ops'
  | 'analysis'
  | 'general'
  | 'parallel_analysis'; // 병렬 분석 (analyst + nlq 동시 실행)

// ============================================================================
// 1.2. Tool Results Interface (A2A에서 참조하므로 먼저 정의)
// ============================================================================

export interface ToolResult {
  toolName: string;
  success: boolean;
  data: unknown;
  error?: string;
  executedAt: string;
}

// ============================================================================
// 1.3. A2A (Agent-to-Agent) Communication Types
// ============================================================================

/**
 * Agent 실행 결과 (Context Propagation용)
 * 다른 에이전트가 참조할 수 있는 이전 에이전트의 출력
 */
export interface AgentResult {
  agentId: AgentType;
  response: string;
  toolResults: ToolResult[];
  confidence?: number;
  executedAt: string;
  metadata?: Record<string, unknown>;
}

/**
 * A2A Delegation Request
 * Agent가 다른 Agent에게 작업을 위임하거나 Supervisor에게 재라우팅 요청
 */
export interface DelegationRequest {
  fromAgent: AgentType;
  toAgent?: AgentType; // null이면 Supervisor가 결정
  reason: string;
  context?: Record<string, unknown>;
  priority?: 'low' | 'normal' | 'high';
}

// ============================================================================
// 1.5. Human-in-the-Loop Types
// ============================================================================

export type ApprovalStatus = 'none' | 'pending' | 'approved' | 'rejected';

export interface PendingAction {
  actionType: 'incident_report' | 'system_command' | 'critical_alert';
  description: string;
  payload: Record<string, unknown>;
  requestedAt: string;
  requestedBy: AgentType;
}

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
// 3. Router Decision Interface
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

  // Human-in-the-Loop 승인 절차
  requiresApproval: Annotation<boolean>({
    reducer: (_, next) => next,
    default: () => false,
  }),

  approvalStatus: Annotation<ApprovalStatus>({
    reducer: (_, next) => next,
    default: () => 'none',
  }),

  pendingAction: Annotation<PendingAction | null>({
    reducer: (_, next) => next,
    default: () => null,
  }),

  // ============================================================================
  // A2A (Agent-to-Agent) Communication Fields
  // ============================================================================

  /**
   * 이전 에이전트들의 실행 결과 (누적)
   * 다른 에이전트가 컨텍스트로 활용 가능
   */
  agentResults: Annotation<AgentResult[]>({
    reducer: (current, update) => [...current, ...update],
    default: () => [],
  }),

  /**
   * Return-to-Supervisor 플래그
   * 에이전트가 다른 에이전트의 도움이 필요할 때 설정
   */
  returnToSupervisor: Annotation<boolean>({
    reducer: (_, next) => next,
    default: () => false,
  }),

  /**
   * Delegation Request
   * 에이전트 간 작업 위임 요청
   */
  delegationRequest: Annotation<DelegationRequest | null>({
    reducer: (_, next) => next,
    default: () => null,
  }),

  /**
   * Dynamic Parallel Execution
   * Supervisor가 지정한 병렬 실행 대상 에이전트 목록
   */
  parallelAgents: Annotation<AgentType[]>({
    reducer: (_, next) => next,
    default: () => [],
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
