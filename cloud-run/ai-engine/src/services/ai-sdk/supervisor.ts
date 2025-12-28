/**
 * AI SDK Supervisor
 *
 * Dual-mode supervisor implementation:
 * 1. Single-agent mode: Simple generateText with multi-step tool calling
 * 2. Multi-agent mode: Orchestrated agent handoffs using @ai-sdk-tools/agents
 *
 * Architecture:
 * - Single-agent: One LLM with all tools (simple queries)
 * - Multi-agent: Orchestrator → NLQ/Analyst/Reporter/Advisor (complex queries)
 *
 * @version 2.0.0
 * @updated 2025-12-28
 */

import { generateText, stepCountIs, type ModelMessage } from 'ai';
import { getSupervisorModel, logProviderStatus } from './model-provider';
import { allTools, toolDescriptions, type ToolName } from '../../tools-ai-sdk';
import { executeMultiAgent, type MultiAgentRequest, type MultiAgentResponse } from './agents';

// ============================================================================
// 1. Types
// ============================================================================

export type SupervisorMode = 'single' | 'multi' | 'auto';

export interface SupervisorRequest {
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  sessionId: string;
  enableTracing?: boolean;
  /**
   * Execution mode:
   * - 'single': Use single-agent with multi-step tool calling (default)
   * - 'multi': Use multi-agent orchestration with handoffs
   * - 'auto': Automatically select based on query complexity
   */
  mode?: SupervisorMode;
}

export interface SupervisorResponse {
  success: boolean;
  response: string;
  toolsCalled: string[];
  toolResults: Record<string, unknown>[];
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  metadata: {
    provider: string;
    modelId: string;
    stepsExecuted: number;
    durationMs: number;
    mode?: SupervisorMode;
    handoffs?: Array<{ from: string; to: string; reason?: string }>;
    finalAgent?: string;
  };
}

export interface SupervisorError {
  success: false;
  error: string;
  code: string;
}

// ============================================================================
// 2. System Prompt
// ============================================================================

const SYSTEM_PROMPT = `당신은 서버 모니터링 AI 어시스턴트입니다. 사용자의 질문에 정확하고 간결하게 답변하세요.

## 사용 가능한 도구

### 서버 메트릭 조회
- getServerMetrics: 서버 상태 조회 (CPU, 메모리, 디스크)
- getServerMetricsAdvanced: 고급 메트릭 조회 (시간범위, 필터, 집계)
- filterServers: 조건에 맞는 서버 필터링 (예: CPU 80% 이상)

### 장애 분석 (RCA)
- buildIncidentTimeline: 장애 타임라인 구성
- correlateMetrics: 메트릭 간 상관관계 분석
- findRootCause: 근본 원인 분석

### 이상 탐지 & 예측
- detectAnomalies: 이상치 탐지 (6시간 이동평균 + 2σ)
- predictTrends: 트렌드 예측 (선형 회귀 기반)
- analyzePattern: 패턴 분석

### 지식베이스 & 권장 조치 (GraphRAG)
- searchKnowledgeBase: 과거 장애 이력 및 해결 방법 검색 (Vector + Graph)
- recommendCommands: 문제 해결을 위한 CLI 명령어 추천

## 응답 지침

1. 도구 결과를 바탕으로 정확한 정보를 제공하세요
2. 한국어로 응답하세요
3. 숫자는 소수점 1자리까지만 표시하세요
4. 서버 이름과 ID를 함께 언급하세요
5. 이상 상태가 감지되면 권장 조치를 제안하세요
6. 장애 해결 문의 시 searchKnowledgeBase로 유사 사례를 검색하세요

## 예시 질문과 도구 매핑

- "CPU 80% 이상인 서버 알려줘" → filterServers(field: "cpu", operator: ">", value: 80)
- "서버 상태 요약해줘" → getServerMetrics()
- "메모리 추세 분석해줘" → predictTrends(metricType: "memory")
- "장애 원인 분석해줘" → findRootCause() + buildIncidentTimeline()
- "메모리 부족 해결 방법" → searchKnowledgeBase(query: "메모리 부족")
- "디스크 정리 명령어" → recommendCommands(keywords: ["디스크", "정리"])
`;

// ============================================================================
// 3. Supervisor Implementation
// ============================================================================

// Retry configuration
const RETRY_CONFIG = {
  maxRetries: 2,
  retryableErrors: ['RATE_LIMIT', 'TIMEOUT', 'MODEL_ERROR'],
  retryDelayMs: 1000,
};

// ============================================================================
// 3.5. Mode Selection Logic
// ============================================================================

/**
 * Determine execution mode based on query complexity
 * Complex queries benefit from multi-agent orchestration
 */
function selectExecutionMode(query: string): SupervisorMode {
  const q = query.toLowerCase();

  // Multi-agent indicators (complex queries requiring specialized agents)
  const multiAgentPatterns = [
    // Report generation
    /보고서|리포트|report|인시던트|incident/i,
    // Deep analysis
    /분석.*원인|근본.*원인|rca|root.*cause/i,
    // Troubleshooting with knowledge search
    /해결.*방법|과거.*사례|유사.*장애|어떻게.*해결/i,
    // Trend prediction
    /예측|트렌드|향후|언제.*될|고갈/i,
    // Correlation analysis
    /상관관계|연관.*분석|correlat/i,
  ];

  // Check for complex patterns
  for (const pattern of multiAgentPatterns) {
    if (pattern.test(q)) {
      return 'multi';
    }
  }

  // Simple queries use single-agent for lower latency
  return 'single';
}

/**
 * Execute supervisor with AI SDK
 * Supports both single-agent and multi-agent modes
 */
export async function executeSupervisor(
  request: SupervisorRequest
): Promise<SupervisorResponse | SupervisorError> {
  const startTime = Date.now();

  // Determine execution mode
  let mode = request.mode || 'auto';
  if (mode === 'auto') {
    const lastUserMessage = request.messages.filter((m) => m.role === 'user').pop();
    mode = lastUserMessage ? selectExecutionMode(lastUserMessage.content) : 'single';
  }

  console.log(`🎯 [Supervisor] Mode: ${mode}`);

  // Execute based on mode
  if (mode === 'multi') {
    return executeMultiAgentMode(request, startTime);
  }

  return executeSingleAgentMode(request, startTime);
}

/**
 * Execute multi-agent mode with orchestrator
 */
async function executeMultiAgentMode(
  request: SupervisorRequest,
  startTime: number
): Promise<SupervisorResponse | SupervisorError> {
  try {
    const multiAgentRequest: MultiAgentRequest = {
      messages: request.messages,
      sessionId: request.sessionId,
      enableTracing: request.enableTracing,
    };

    const result = await executeMultiAgent(multiAgentRequest);

    if (!result.success) {
      return result as SupervisorError;
    }

    const multiResult = result as MultiAgentResponse;

    return {
      success: true,
      response: multiResult.response,
      toolsCalled: multiResult.toolsCalled,
      toolResults: [], // Multi-agent doesn't expose individual tool results
      usage: multiResult.usage,
      metadata: {
        provider: multiResult.metadata.provider,
        modelId: multiResult.metadata.modelId,
        stepsExecuted: multiResult.metadata.totalRounds,
        durationMs: multiResult.metadata.durationMs,
        mode: 'multi',
        handoffs: multiResult.handoffs,
        finalAgent: multiResult.finalAgent,
      },
    };
  } catch (error) {
    const durationMs = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);

    console.error(`❌ [Supervisor] Multi-agent error after ${durationMs}ms:`, errorMessage);

    // Fallback to single-agent mode on error
    console.log(`🔄 [Supervisor] Falling back to single-agent mode`);
    return executeSingleAgentMode(request, startTime);
  }
}

/**
 * Execute single-agent mode with multi-step tool calling
 * Includes retry logic for transient errors
 */
async function executeSingleAgentMode(
  request: SupervisorRequest,
  startTime: number
): Promise<SupervisorResponse | SupervisorError> {
  let lastError: SupervisorError | null = null;

  for (let attempt = 0; attempt <= RETRY_CONFIG.maxRetries; attempt++) {
    if (attempt > 0) {
      console.log(`🔄 [Supervisor] Retry attempt ${attempt}/${RETRY_CONFIG.maxRetries}`);
      await new Promise((r) => setTimeout(r, RETRY_CONFIG.retryDelayMs * attempt));
    }

    const result = await executeSupervisorAttempt(request, startTime);

    if (result.success) {
      // Add mode to metadata
      (result as SupervisorResponse).metadata.mode = 'single';
      return result;
    }

    lastError = result as SupervisorError;

    // Check if error is retryable
    if (!RETRY_CONFIG.retryableErrors.includes(lastError.code)) {
      console.log(`❌ [Supervisor] Non-retryable error: ${lastError.code}`);
      return lastError;
    }
  }

  // All retries exhausted
  return lastError || { success: false, error: 'Unknown error', code: 'UNKNOWN_ERROR' };
}

/**
 * Single attempt of supervisor execution
 */
async function executeSupervisorAttempt(
  request: SupervisorRequest,
  startTime: number
): Promise<SupervisorResponse | SupervisorError> {
  try {
    // Log provider status on first call
    logProviderStatus();

    // Get model with fallback chain
    const { model, provider, modelId } = getSupervisorModel();

    console.log(`🤖 [Supervisor] Using ${provider}/${modelId}`);

    // Convert messages to ModelMessage format (AI SDK 6)
    const modelMessages: ModelMessage[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...request.messages.map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    ];

    // Execute with multi-step tool calling
    const result = await generateText({
      model,
      messages: modelMessages,
      tools: allTools,
      stopWhen: stepCountIs(5), // Allow up to 5 tool calls
      temperature: 0.2,
      maxOutputTokens: 2048,
    });

    // Extract tool call information
    const toolsCalled: string[] = [];
    const toolResults: Record<string, unknown>[] = [];

    for (const step of result.steps) {
      for (const toolCall of step.toolCalls) {
        toolsCalled.push(toolCall.toolName);
      }
      // toolResults는 step.toolResults에서 추출
      if (step.toolResults) {
        for (const tr of step.toolResults) {
          // AI SDK v4에서 toolResult는 { toolCallId, toolName, result } 구조
          if ('result' in tr) {
            toolResults.push(tr.result as Record<string, unknown>);
          }
        }
      }
    }

    const durationMs = Date.now() - startTime;

    console.log(
      `✅ [Supervisor] Completed in ${durationMs}ms, tools: [${toolsCalled.join(', ')}]`
    );

    return {
      success: true,
      response: result.text,
      toolsCalled,
      toolResults,
      usage: {
        promptTokens: result.usage?.inputTokens ?? 0,
        completionTokens: result.usage?.outputTokens ?? 0,
        totalTokens: result.usage?.totalTokens ?? 0,
      },
      metadata: {
        provider,
        modelId,
        stepsExecuted: result.steps.length,
        durationMs,
      },
    };
  } catch (error) {
    const durationMs = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);

    console.error(`❌ [Supervisor] Error after ${durationMs}ms:`, errorMessage);

    // Classify error
    let code = 'UNKNOWN_ERROR';
    if (errorMessage.includes('API key')) {
      code = 'AUTH_ERROR';
    } else if (errorMessage.includes('rate limit')) {
      code = 'RATE_LIMIT';
    } else if (errorMessage.includes('timeout')) {
      code = 'TIMEOUT';
    } else if (errorMessage.includes('model')) {
      code = 'MODEL_ERROR';
    }

    return {
      success: false,
      error: errorMessage,
      code,
    };
  }
}

// ============================================================================
// 4. Streaming Supervisor (for future use)
// ============================================================================

/**
 * Execute supervisor with streaming response
 * TODO: Implement when needed for real-time UI updates
 */
export async function* executeSupervisorStream(
  request: SupervisorRequest
): AsyncGenerator<{
  type: 'tool_call' | 'tool_result' | 'text' | 'done';
  data: unknown;
}> {
  // Placeholder for streaming implementation
  const result = await executeSupervisor(request);

  if (!result.success) {
    yield { type: 'done', data: { error: (result as SupervisorError).error } };
    return;
  }

  const successResult = result as SupervisorResponse;

  // Emit tool calls
  for (const toolName of successResult.toolsCalled) {
    yield { type: 'tool_call', data: { name: toolName } };
  }

  // Emit tool results
  for (const toolResult of successResult.toolResults) {
    yield { type: 'tool_result', data: toolResult };
  }

  // Emit final text
  yield { type: 'text', data: successResult.response };
  yield { type: 'done', data: successResult.metadata };
}

// ============================================================================
// 5. Intent Classification (Optional Enhancement)
// ============================================================================

type IntentCategory = 'metrics' | 'rca' | 'analyst' | 'reporter' | 'general';

interface ClassifiedIntent {
  category: IntentCategory;
  suggestedTools: ToolName[];
  confidence: number;
}

/**
 * Classify user intent (rule-based, for optimization)
 * This can reduce token usage by pre-filtering tools
 */
export function classifyIntent(query: string): ClassifiedIntent {
  const q = query.toLowerCase();

  // Reporter/RAG queries - knowledge base search, troubleshooting, commands
  if (/해결.*방법|방법|조치|명령어|command|이력|과거.*사례|문제.*해결|가이드/i.test(q)) {
    return {
      category: 'reporter',
      suggestedTools: ['searchKnowledgeBase', 'recommendCommands'],
      confidence: 0.9,
    };
  }

  // Metrics queries
  if (/cpu|메모리|memory|디스크|disk|서버.*상태|상태.*요약/i.test(q)) {
    if (/\d+%.*이상|>\s*\d+|초과|높은/i.test(q)) {
      return {
        category: 'metrics',
        suggestedTools: ['filterServers'],
        confidence: 0.9,
      };
    }
    return {
      category: 'metrics',
      suggestedTools: ['getServerMetrics', 'getServerMetricsAdvanced'],
      confidence: 0.85,
    };
  }

  // RCA queries
  if (/장애|원인|root.*cause|rca|타임라인|상관관계/i.test(q)) {
    return {
      category: 'rca',
      suggestedTools: ['findRootCause', 'buildIncidentTimeline', 'correlateMetrics'],
      confidence: 0.9,
    };
  }

  // Analyst queries
  if (/이상|anomaly|트렌드|trend|예측|predict|패턴/i.test(q)) {
    return {
      category: 'analyst',
      suggestedTools: ['detectAnomalies', 'predictTrends', 'analyzePattern'],
      confidence: 0.85,
    };
  }

  // General - let LLM decide
  return {
    category: 'general',
    suggestedTools: ['getServerMetrics'],
    confidence: 0.5,
  };
}

// ============================================================================
// 6. Health Check
// ============================================================================

export interface SupervisorHealth {
  status: 'ok' | 'degraded' | 'error';
  provider: string;
  modelId: string;
  toolsAvailable: number;
}

/**
 * Check supervisor health
 */
export async function checkSupervisorHealth(): Promise<SupervisorHealth> {
  try {
    const { provider, modelId } = getSupervisorModel();
    const toolCount = Object.keys(allTools).length;

    return {
      status: 'ok',
      provider,
      modelId,
      toolsAvailable: toolCount,
    };
  } catch (error) {
    return {
      status: 'error',
      provider: 'none',
      modelId: 'none',
      toolsAvailable: 0,
    };
  }
}
