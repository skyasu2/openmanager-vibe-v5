/**
 * AI SDK Supervisor
 *
 * Router Agent pattern implementation using Vercel AI SDK.
 * Replaces LangGraph multi-agent supervisor with simpler multi-step tool calling.
 *
 * Key differences from LangGraph:
 * - LangGraph: Multi-turn tool calling for agent handoffs (broken with Cerebras)
 * - AI SDK: Single generateText call with maxSteps for multi-step tool execution
 *
 * @version 1.0.0
 * @updated 2025-12-28
 */

import { generateText, stepCountIs, type ModelMessage } from 'ai';
import { getSupervisorModel, logProviderStatus } from './model-provider';
import { allTools, toolDescriptions, type ToolName } from '../../tools-ai-sdk';

// ============================================================================
// 1. Types
// ============================================================================

export interface SupervisorRequest {
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  sessionId: string;
  enableTracing?: boolean;
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

## 응답 지침

1. 도구 결과를 바탕으로 정확한 정보를 제공하세요
2. 한국어로 응답하세요
3. 숫자는 소수점 1자리까지만 표시하세요
4. 서버 이름과 ID를 함께 언급하세요
5. 이상 상태가 감지되면 권장 조치를 제안하세요

## 예시 질문과 도구 매핑

- "CPU 80% 이상인 서버 알려줘" → filterServers(field: "cpu", operator: ">", value: 80)
- "서버 상태 요약해줘" → getServerMetrics()
- "메모리 추세 분석해줘" → predictTrends(metricType: "memory")
- "장애 원인 분석해줘" → findRootCause() + buildIncidentTimeline()
`;

// ============================================================================
// 3. Supervisor Implementation
// ============================================================================

/**
 * Execute supervisor with AI SDK
 */
export async function executeSupervisor(
  request: SupervisorRequest
): Promise<SupervisorResponse | SupervisorError> {
  const startTime = Date.now();

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

type IntentCategory = 'metrics' | 'rca' | 'analyst' | 'general';

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
