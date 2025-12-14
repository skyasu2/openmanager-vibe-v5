/**
 * LangGraph StateGraph State Definition
 * 멀티에이전트 시스템의 공유 상태 정의 (Cloud Run Standalone)
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
  | 'parallel_analysis';

// ============================================================================
// 2. Human-in-the-Loop Types
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
// 2.5. Agent-to-Agent (A2A) Delegation Types
// ============================================================================

/**
 * Return-to-Supervisor & Command Pattern 지원
 * Agent가 Supervisor에게 다른 Agent로 위임을 요청할 수 있음
 */
export interface DelegationRequest {
  /** 위임을 요청한 Agent */
  fromAgent: AgentType;
  /** 위임 대상 Agent (null이면 Supervisor가 결정) */
  toAgent: AgentType | null;
  /** 위임 사유 */
  reason: string;
  /** 추가 컨텍스트 (이전 분석 결과 등) */
  context: Record<string, unknown>;
  /** 요청 시간 */
  requestedAt: string;
}

// ============================================================================
// 3. Circuit Breaker State
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
// 4. Tool Results Interface
// ============================================================================

export interface ToolResult {
  toolName: string;
  success: boolean;
  data: unknown;
  error?: string;
  executedAt: string;
}

// ============================================================================
// 5. Router Decision Interface
// ============================================================================

export interface RouterDecision {
  targetAgent: AgentType;
  confidence: number;
  reasoning: string;
  directReply?: string;
  suggestedModel?: string;
}

// ============================================================================
// 6. Main AgentState Definition
// ============================================================================

export const AgentState = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: messagesStateReducer,
    default: () => [],
  }),

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

  toolResults: Annotation<ToolResult[]>({
    reducer: (current, update) => [...current, ...update],
    default: () => [],
  }),

  modelHealth: Annotation<CircuitBreakerState>({
    reducer: (current, update) => ({
      ...current,
      ...update,
      models: { ...current.models, ...update.models },
    }),
    default: () => ({
      models: {},
      threshold: 3,
      resetTimeMs: 60000,
    }),
  }),

  sessionId: Annotation<string>({
    reducer: (_, next) => next,
    default: () => '',
  }),

  iteration: Annotation<number>({
    reducer: (_, next) => next,
    default: () => 0,
  }),

  finalResponse: Annotation<string | null>({
    reducer: (_, next) => next,
    default: () => null,
  }),

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

  // A2A Delegation (Return-to-Supervisor & Command Pattern)
  delegationRequest: Annotation<DelegationRequest | null>({
    reducer: (_, next) => next,
    default: () => null,
  }),

  /** Supervisor 복귀 요청 플래그 */
  returnToSupervisor: Annotation<boolean>({
    reducer: (_, next) => next,
    default: () => false,
  }),

  /** 현재 처리 중인 Agent (Supervisor 판단용) */
  currentAgent: Annotation<AgentType>({
    reducer: (_, next) => next,
    default: () => null,
  }),
});

export type AgentStateType = typeof AgentState.State;

// ============================================================================
// 7. Constants
// ============================================================================

export const MAX_ITERATIONS = 5;
export const SUPERVISOR_NODE = 'supervisor';
export const NLQ_NODE = 'nlq_agent';
export const ANALYST_NODE = 'analyst_agent';
export const REPORTER_NODE = 'reporter_agent';
export const END_NODE = '__end__';
