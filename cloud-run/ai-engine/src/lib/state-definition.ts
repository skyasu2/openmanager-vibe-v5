/**
 * LangGraph StateGraph State Definition
 * 멀티에이전트 시스템의 공유 상태 정의
 */

import type { BaseMessage } from '@langchain/core/messages';
import { Annotation, messagesStateReducer } from '@langchain/langgraph';

// ============================================================================
// 1. Agent Types
// ============================================================================

export type AgentType = 'nlq' | 'analyst' | 'reporter' | 'verifier' | 'reply' | null;
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

// ============================================================================
// 1.1 Agent Result Types (Task 3: SharedContext)
// ============================================================================

export interface NLQResult {
  query: string;
  intent: 'metrics' | 'logs' | 'status' | 'unknown';
  servers: Array<{
    id: string;
    name: string;
    status: string;
    cpu?: number;
    memory?: number;
    disk?: number;
  }>;
  summary?: {
    total: number;
    alertCount: number;
  };
  timestamp: string;
}

export interface AnalystResult {
  analysisType: 'anomaly' | 'trend' | 'prediction';
  serverId?: string;
  metricType?: string;
  findings: Array<{
    type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    value?: number;
    threshold?: number;
  }>;
  predictions?: Array<{
    metric: string;
    trend: 'increasing' | 'decreasing' | 'stable';
    confidence: number;
    forecastValues?: number[];
  }>;
  timestamp: string;
}

export interface ReporterResult {
  reportType: 'summary' | 'detailed' | 'incident';
  title: string;
  content: string;
  sections?: Array<{
    heading: string;
    body: string;
  }>;
  recommendations?: string[];
  timestamp: string;
}

export interface SharedContext {
  nlqResults: NLQResult | null;
  analystResults: AnalystResult | null;
  reporterResults: ReporterResult | null;
  verifierResults: VerificationResult | null;
  lastUpdatedBy: AgentType;
  lastUpdatedAt: string;
}

// ============================================================================
// 2. Verifier Agent Types (Task 1: Verifier Agent 구현)
// ============================================================================

export interface VerificationIssue {
  type: 'metric_range' | 'missing_field' | 'format_error' | 'hallucination';
  severity: 'low' | 'medium' | 'high';
  field?: string;
  originalValue?: unknown;
  correctedValue?: unknown;
  message: string;
}

export interface VerificationCorrection {
  field: string;
  original: unknown;
  corrected: unknown;
  reason: string;
}

export interface VerificationResult {
  isValid: boolean;
  confidence: number;
  originalResponse: string;
  validatedResponse: string;
  issues: VerificationIssue[];
  metadata: {
    verifiedAt: string;
    rulesApplied: string[];
    corrections: VerificationCorrection[];
    processingTimeMs: number;
  };
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

// ============================================================================
// 2.1 Context Compression Types (Phase 2)
// ============================================================================

export interface CompressionMetadata {
  lastCompressedAt: string | null;
  totalCompressedMessages: number;
  compressionRatio: number;
  summaryTokenCount: number;
  originalTokenCount: number;
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
    reducer: (_: AgentType, next: AgentType) => next,
    default: () => null,
  }),

  taskType: Annotation<TaskType>({
    reducer: (_: TaskType, next: TaskType) => next,
    default: () => 'general',
  }),

  routerDecision: Annotation<RouterDecision | null>({
    reducer: (_: RouterDecision | null, next: RouterDecision | null) => next,
    default: () => null,
  }),

  toolResults: Annotation<ToolResult[]>({
    reducer: (current: ToolResult[], update: ToolResult[]) => [...current, ...update],
    default: () => [],
  }),

  modelHealth: Annotation<CircuitBreakerState>({
    reducer: (current: CircuitBreakerState, update: CircuitBreakerState) => ({
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
    reducer: (_: string, next: string) => next,
    default: () => '',
  }),

  iteration: Annotation<number>({
    reducer: (_: number, next: number) => next,
    default: () => 0,
  }),

  finalResponse: Annotation<string | null>({
    reducer: (_: string | null, next: string | null) => next,
    default: () => null,
  }),

  requiresApproval: Annotation<boolean>({
    reducer: (_: boolean, next: boolean) => next,
    default: () => false,
  }),

  approvalStatus: Annotation<ApprovalStatus>({
    reducer: (_: ApprovalStatus, next: ApprovalStatus) => next,
    default: () => 'none',
  }),

  pendingAction: Annotation<PendingAction | null>({
    reducer: (_: PendingAction | null, next: PendingAction | null) => next,
    default: () => null,
  }),

  agentResults: Annotation<AgentResult[]>({
    reducer: (current: AgentResult[], update: AgentResult[]) => [...current, ...update],
    default: () => [],
  }),

  returnToSupervisor: Annotation<boolean>({
    reducer: (_: boolean, next: boolean) => next,
    default: () => false,
  }),

  delegationRequest: Annotation<DelegationRequest | null>({
    reducer: (_: DelegationRequest | null, next: DelegationRequest | null) => next,
    default: () => null,
  }),

  parallelAgents: Annotation<AgentType[]>({
    reducer: (_: AgentType[], next: AgentType[]) => next,
    default: () => [],
  }),

  // Task 1: Verifier Agent 검증 결과
  verificationResult: Annotation<VerificationResult | null>({
    reducer: (_: VerificationResult | null, next: VerificationResult | null) => next,
    default: () => null,
  }),

  // Task 3: Agent 간 결과 공유 (SharedContext)
  sharedContext: Annotation<SharedContext>({
    reducer: (current: SharedContext, update: SharedContext) => ({
      ...current,
      ...update,
      lastUpdatedAt: new Date().toISOString(),
    }),
    default: () => ({
      nlqResults: null,
      analystResults: null,
      reporterResults: null,
      verifierResults: null,
      lastUpdatedBy: null,
      lastUpdatedAt: new Date().toISOString(),
    }),
  }),

  // Phase 2: Context Compression - 대화 요약
  conversationSummary: Annotation<string>({
    reducer: (_: string, next: string) => next,
    default: () => '',
  }),

  // Phase 2: Context Compression - 압축 메타데이터
  compressionMetadata: Annotation<CompressionMetadata>({
    reducer: (_: CompressionMetadata, next: CompressionMetadata) => next,
    default: () => ({
      lastCompressedAt: null,
      totalCompressedMessages: 0,
      compressionRatio: 0,
      summaryTokenCount: 0,
      originalTokenCount: 0,
    }),
  }),
});

export type AgentStateType = typeof AgentState.State;

export const MAX_ITERATIONS = 5;
export const SUPERVISOR_NODE = 'supervisor';
export const NLQ_NODE = 'nlq_agent';
export const ANALYST_NODE = 'analyst_agent';
export const REPORTER_NODE = 'reporter_agent';
export const VERIFIER_NODE = 'verifier_agent';
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

// ============================================================================
// 4. SharedContext Helper Functions (Task 3)
// ============================================================================

/**
 * Update NLQ results in shared context
 */
export function updateNLQContext(
  context: SharedContext,
  result: NLQResult
): SharedContext {
  return {
    ...context,
    nlqResults: result,
    lastUpdatedBy: 'nlq',
    lastUpdatedAt: new Date().toISOString(),
  };
}

/**
 * Update Analyst results in shared context
 */
export function updateAnalystContext(
  context: SharedContext,
  result: AnalystResult
): SharedContext {
  return {
    ...context,
    analystResults: result,
    lastUpdatedBy: 'analyst',
    lastUpdatedAt: new Date().toISOString(),
  };
}

/**
 * Update Reporter results in shared context
 */
export function updateReporterContext(
  context: SharedContext,
  result: ReporterResult
): SharedContext {
  return {
    ...context,
    reporterResults: result,
    lastUpdatedBy: 'reporter',
    lastUpdatedAt: new Date().toISOString(),
  };
}

/**
 * Update Verifier results in shared context
 */
export function updateVerifierContext(
  context: SharedContext,
  result: VerificationResult
): SharedContext {
  return {
    ...context,
    verifierResults: result,
    lastUpdatedBy: 'verifier',
    lastUpdatedAt: new Date().toISOString(),
  };
}

/**
 * Create initial shared context
 */
export function createInitialSharedContext(): SharedContext {
  return {
    nlqResults: null,
    analystResults: null,
    reporterResults: null,
    verifierResults: null,
    lastUpdatedBy: null,
    lastUpdatedAt: new Date().toISOString(),
  };
}

/**
 * Get available context from previous agents
 */
export function getAvailableContext(context: SharedContext): {
  hasNLQ: boolean;
  hasAnalyst: boolean;
  hasReporter: boolean;
  hasVerifier: boolean;
  summary: string;
} {
  const hasNLQ = context.nlqResults !== null;
  const hasAnalyst = context.analystResults !== null;
  const hasReporter = context.reporterResults !== null;
  const hasVerifier = context.verifierResults !== null;

  const available: string[] = [];
  if (hasNLQ) available.push('NLQ');
  if (hasAnalyst) available.push('Analyst');
  if (hasReporter) available.push('Reporter');
  if (hasVerifier) available.push('Verifier');

  return {
    hasNLQ,
    hasAnalyst,
    hasReporter,
    hasVerifier,
    summary: available.length > 0
      ? `Available context: ${available.join(', ')}`
      : 'No prior context available',
  };
}
