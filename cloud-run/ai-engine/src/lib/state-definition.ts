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
  | 'parallel_analysis';

export interface ToolResult {
  toolName: string;
  success: boolean;
  data: unknown;
  error?: string;
  executedAt: string;
}

export interface AgentResult {
  agentId: AgentType;
  response: string;
  toolResults: ToolResult[];
  confidence?: number;
  executedAt: string;
  metadata?: Record<string, unknown>;
}

export interface DelegationRequest {
  fromAgent: AgentType;
  toAgent?: AgentType;
  reason: string;
  context?: Record<string, unknown>;
  priority?: 'low' | 'normal' | 'high';
}

export type ApprovalStatus = 'none' | 'pending' | 'approved' | 'rejected';

export interface PendingAction {
  actionType: 'incident_report' | 'system_command' | 'critical_alert';
  description: string;
  payload: Record<string, unknown>;
  requestedAt: string;
  requestedBy: AgentType;
}

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

export interface RouterDecision {
  targetAgent: AgentType;
  confidence: number;
  reasoning: string;
  directReply?: string;
  suggestedModel?: string;
}

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

  agentResults: Annotation<AgentResult[]>({
    reducer: (current, update) => [...current, ...update],
    default: () => [],
  }),

  returnToSupervisor: Annotation<boolean>({
    reducer: (_, next) => next,
    default: () => false,
  }),

  delegationRequest: Annotation<DelegationRequest | null>({
    reducer: (_, next) => next,
    default: () => null,
  }),

  parallelAgents: Annotation<AgentType[]>({
    reducer: (_, next) => next,
    default: () => [],
  }),
});

export type AgentStateType = typeof AgentState.State;

export const MAX_ITERATIONS = 5;
export const SUPERVISOR_NODE = 'supervisor';
export const NLQ_NODE = 'nlq_agent';
export const ANALYST_NODE = 'analyst_agent';
export const REPORTER_NODE = 'reporter_agent';
export const END_NODE = '__end__';

export function isModelHealthy(
  state: CircuitBreakerState,
  modelId: string
): boolean {
  const health = state.models[modelId];
  if (!health) return true;

  if (health.isOpen) {
    if (
      health.lastFailure &&
      Date.now() - health.lastFailure > state.resetTimeMs
    ) {
      return true;
    }
    return false;
  }

  return true;
}

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
