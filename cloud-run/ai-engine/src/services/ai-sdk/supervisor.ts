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

import { generateText, streamText, stepCountIs, type ModelMessage } from 'ai';
import { getSupervisorModel, logProviderStatus, type ProviderName } from './model-provider';
import { allTools, toolDescriptions, type ToolName } from '../../tools-ai-sdk';
import { executeMultiAgent, executeMultiAgentStream, type MultiAgentRequest, type MultiAgentResponse } from './agents';
import {
  createSupervisorTrace,
  logGeneration,
  logToolCall,
  finalizeTrace,
  type TraceMetadata,
} from '../observability/langfuse';
import { getCircuitBreaker, CircuitOpenError } from '../resilience/circuit-breaker';

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

const SYSTEM_PROMPT = `당신은 서버 모니터링 AI 어시스턴트입니다.

## 핵심 원칙: 요약 우선 (Summary First)

**항상 핵심 결론을 먼저 1-2문장으로 답하세요.**
- 전체 목록을 나열하지 마세요
- 가장 중요한 정보만 추출하세요
- 사용자가 "자세히", "목록", "전부", "모두"를 요청하면 상세 제공

### 좋은 응답 예시
❌ 나쁨: "서버 15대의 상태입니다. 서버1: CPU 35%... 서버2: CPU 40%... (전체 나열)"
✅ 좋음: "이상 서버 8대 발견 (경고 7대, 임계 1대). 가장 심각: backup-server-01 (디스크 91%)"

### 상세 요청 감지
- "자세히 알려줘" → 전체 목록 제공
- "어떤 서버야?" → 해당 서버들 나열
- "왜?" → 원인 상세 설명

## 사용 가능한 도구

### 서버 메트릭 조회
- getServerMetrics: 서버 **현재** 상태 조회 (CPU, 메모리, 디스크)
- getServerMetricsAdvanced: **시간 범위 집계** (지난 1/6/24시간 평균/최대/최소)
  - serverId 생략 시 전체 서버 조회, globalSummary에 전체 평균 포함
  - 예: { timeRange: "last6h", metric: "cpu", aggregation: "avg" }
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

1. **요약 우선**: 핵심 결론 1-2문장 먼저
2. **핵심만 추출**: 가장 심각한 1-3개만 언급
3. **수치는 간결하게**: "CPU 85.3%" → "CPU 85%"
4. **한국어로 응답 / Respond in Korean** (한자 절대 금지 / No Chinese characters, 기술용어는 영어 허용 / Technical terms in English OK)
5. **이상 감지 시 권장 조치 제안**
6. **장애 문의 시 searchKnowledgeBase 활용**

## globalSummary 응답 규칙
getServerMetricsAdvanced 결과에 globalSummary가 있으면 **반드시 해당 값을 인용**:
- cpu_avg → "전체 서버 CPU 평균"
- cpu_max → "전체 서버 CPU 최대값"
- cpu_min → "전체 서버 CPU 최소값"

예: globalSummary.cpu_avg = 34 → "지난 6시간 전체 서버 CPU 평균은 34%입니다."

## 예시 질문과 도구 매핑

- "CPU 80% 이상인 서버 알려줘" → filterServers(field: "cpu", operator: ">", value: 80)
- "서버 상태 요약해줘" → getServerMetrics()
- "지난 6시간 CPU 평균 알려줘" → getServerMetricsAdvanced(timeRange: "last6h", metric: "cpu", aggregation: "avg")
  → 응답의 globalSummary.cpu_avg 값이 전체 서버 평균
- "최근 1시간 메모리 최대값" → getServerMetricsAdvanced(timeRange: "last1h", metric: "memory", aggregation: "max")
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
 *
 * @updated 2026-01-09: Enhanced patterns for better Korean NLP coverage
 */
function selectExecutionMode(query: string): SupervisorMode {
  const q = query.toLowerCase();

  // Domain context keywords for gating broad patterns (Korean + English + typos)
  // Korean typos: 서버→서벼/썹, 메모리→메머리/멤, 시스템→시스탬
  // English typos: server→servr/sever, memory→memroy/memeory
  const infraContext =
    /서버|서벼|썹|인프라|시스템|시스탬|모니터링|cpu|씨피유|메모리|메머리|멤|디스크|트래픽|네트워크|server|servr|sever|memory|memroy|disk|traffic|network|latency|response|load/i;
  const hasInfraContext = infraContext.test(q);

  // Multi-agent indicators (complex queries requiring specialized agents)
  const multiAgentPatterns = [
    // 1. Report generation (보고서/리포트) - always multi-agent
    /보고서|리포트|report|인시던트|incident|장애.*보고|일일.*리포트/i,

    // 2. Root cause analysis (원인 분석) - with infra context
    /분석.*원인|원인.*분석|근본.*원인|rca|root.*cause/i,

    // 3. Troubleshooting (문제 해결) - always multi-agent
    /해결.*방법|과거.*사례|유사.*장애|어떻게.*해결|조치.*방법|대응.*방안/i,
    /how.*to.*(fix|resolve|solve)|troubleshoot|trubleshoot/i,

    // 4. Capacity planning (용량 계획) - always multi-agent
    /용량.*계획|capacity|언제.*부족|얼마나.*남|증설.*필요/i,

    // 5. Summary requests → NLQ Agent (merged from Summarizer Agent)
    // Includes typos: 서버→서벼/썹, 요약→요먁, server→servr/sever, summary→sumary/summry
    /(서버|서벼|썹|상태|현황|모니터링|인프라).*(요약|요먁|간단히|핵심|tl;?dr)/i,
    /(요약|요먁|간단히|핵심|tl;?dr).*(서버|서벼|썹|상태|현황|알려|해줘)/i,
    /(server|servr|sever|status|monitoring).*(summary|sumary|summry|summarize|brief|overview)/i,
    /(summary|sumary|summry|summarize|overview).*(server|servr|sever|status|all)/i,

    // 6. Complex multi-server analysis (다중 서버 분석)
    /전체.*(서버|서벼|썹).*분석|모든.*(서버|서벼|썹).*상태|(서버|서벼|썹).*전반|종합.*분석/i,
    /all.*(server|servr|sever)s?.*status|overall.*status|system.*overview/i,
  ];

  // Patterns that require infrastructure context to avoid false positives
  const contextGatedPatterns = [
    // "왜/Why" questions - only with infra/metric terms
    /왜.*(느려|높아|이상|스파이크|지연|오류|급증)/i,
    /why.*(high|slow|spik|error|increas|drop|fail)/i,
    /what.*caused|reason.*for/i,

    // Trend & prediction - requires infra context
    /예측|트렌드|추세|추이|변화.*패턴/i,
    /predict|forecast|trend.*analysis/i,

    // Comparison - requires infra context
    /어제.*대비|지난.*주.*대비|전월.*대비|작년.*비교/i,
    /compared.*to.*(yesterday|last|previous)/i,

    // Correlation analysis - requires infra context
    /상관관계|연관.*분석|correlat|같이.*올라|함께.*증가/i,

    // Anomaly deep dive
    /이상.*원인|비정상.*이유|스파이크.*원인|급증.*이유/i,
  ];

  // Check for always-multi patterns (no context required)
  for (const pattern of multiAgentPatterns) {
    if (pattern.test(q)) {
      return 'multi';
    }
  }

  // Check for context-gated patterns (require infra context to avoid false positives)
  if (hasInfraContext) {
    for (const pattern of contextGatedPatterns) {
      if (pattern.test(q)) {
        return 'multi';
      }
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
 * Includes retry logic for transient errors with provider rotation
 */
async function executeSingleAgentMode(
  request: SupervisorRequest,
  startTime: number
): Promise<SupervisorResponse | SupervisorError> {
  let lastError: SupervisorError | null = null;
  const failedProviders: ProviderName[] = [];

  for (let attempt = 0; attempt <= RETRY_CONFIG.maxRetries; attempt++) {
    if (attempt > 0) {
      console.log(`🔄 [Supervisor] Retry attempt ${attempt}/${RETRY_CONFIG.maxRetries}, excluding: [${failedProviders.join(', ')}]`);
      await new Promise((r) => setTimeout(r, RETRY_CONFIG.retryDelayMs * attempt));
    }

    const result = await executeSupervisorAttempt(request, startTime, failedProviders);

    if (result.success) {
      // Add mode to metadata
      (result as SupervisorResponse).metadata.mode = 'single';
      return result;
    }

    lastError = result as SupervisorError;

    // Track failed provider for next retry (extract from error metadata if available)
    const failedProvider = (lastError as unknown as { provider?: ProviderName }).provider;
    if (failedProvider && !failedProviders.includes(failedProvider)) {
      failedProviders.push(failedProvider);
      console.log(`📍 [Supervisor] Marking ${failedProvider} as failed for retry`);
    }

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
 * Enhanced with Langfuse tracing, per-provider Circuit Breaker, and prepareStep optimization
 *
 * @param excludeProviders - Providers to skip (failed in previous attempts)
 */
async function executeSupervisorAttempt(
  request: SupervisorRequest,
  startTime: number,
  excludeProviders: ProviderName[] = []
): Promise<SupervisorResponse | (SupervisorError & { provider?: ProviderName })> {
  // Create Langfuse trace
  const lastUserMessage = request.messages.filter((m) => m.role === 'user').pop();
  const trace = createSupervisorTrace({
    sessionId: request.sessionId,
    mode: 'single',
    query: lastUserMessage?.content || '',
  });

  // Get model with fallback chain (excluding failed providers)
  let provider: ProviderName;
  let modelId: string;
  let model;

  try {
    const modelResult = getSupervisorModel(excludeProviders);
    model = modelResult.model;
    provider = modelResult.provider;
    modelId = modelResult.modelId;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('❌ [Supervisor] No available providers:', errorMessage);
    return {
      success: false,
      error: errorMessage,
      code: 'NO_PROVIDER',
    };
  }

  // Get provider-specific circuit breaker (not generic 'supervisor')
  const circuitBreaker = getCircuitBreaker(`supervisor-${provider}`);

  // Check circuit breaker for this specific provider
  if (!circuitBreaker.isAllowed()) {
    console.log(`⚡ [Supervisor] Circuit OPEN for ${provider}, will try next provider on retry`);
    return {
      success: false,
      error: `Provider ${provider} circuit breaker is OPEN`,
      code: 'CIRCUIT_OPEN',
      provider, // Include provider for retry exclusion
    };
  }

  try {
    // Execute with provider-specific circuit breaker
    return await circuitBreaker.execute(async () => {
      // Log provider status on first call
      logProviderStatus();

      console.log(`🤖 [Supervisor] Using ${provider}/${modelId}`);

      // Classify intent for tool optimization
      const intent = classifyIntent(lastUserMessage?.content || '');

      // Convert messages to ModelMessage format (AI SDK 6)
      const modelMessages: ModelMessage[] = [
        { role: 'system', content: SYSTEM_PROMPT },
        ...request.messages.map((m) => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        })),
      ];

      // Execute with multi-step tool calling and prepareStep optimization
      // Reduced step count and tokens for faster responses (Vercel 60s limit)
      const result = await generateText({
        model,
        messages: modelMessages,
        tools: allTools,
        stopWhen: stepCountIs(3), // Reduced from 5 to 3 for faster responses
        temperature: 0.2,
        maxOutputTokens: 1536, // Reduced from 2048 for faster responses
        // Note: prepareStep optimization moved to intent classification
        // AI SDK v6 uses different approach - tools are filtered upfront
      });

      // Extract tool call information with Langfuse logging
      const toolsCalled: string[] = [];
      const toolResults: Record<string, unknown>[] = [];

      for (const step of result.steps) {
        for (const toolCall of step.toolCalls) {
          toolsCalled.push(toolCall.toolName);
        }
        // toolResults는 step.toolResults에서 추출
        if (step.toolResults) {
          for (const tr of step.toolResults) {
            if ('result' in tr) {
              toolResults.push(tr.result as Record<string, unknown>);
              // Log tool call to Langfuse
              logToolCall(trace, tr.toolName, {}, tr.result, 0);
            }
          }
        }
      }

      const durationMs = Date.now() - startTime;

      // Log generation to Langfuse
      logGeneration(trace, {
        model: modelId,
        provider,
        input: lastUserMessage?.content || '',
        output: result.text,
        usage: {
          inputTokens: result.usage?.inputTokens ?? 0,
          outputTokens: result.usage?.outputTokens ?? 0,
          totalTokens: result.usage?.totalTokens ?? 0,
        },
        duration: durationMs,
        metadata: { intent: intent.category, intentConfidence: intent.confidence },
      });

      // Finalize trace
      finalizeTrace(trace, result.text, true, {
        toolsCalled,
        stepsExecuted: result.steps.length,
        durationMs,
        intent: intent.category,
      });

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
    });
  } catch (error) {
    const durationMs = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);

    console.error(`❌ [Supervisor] Error after ${durationMs}ms:`, errorMessage);

    // Finalize trace with error
    finalizeTrace(trace, errorMessage, false, { durationMs });

    // Classify error
    let code = 'UNKNOWN_ERROR';
    if (error instanceof CircuitOpenError) {
      code = 'CIRCUIT_OPEN';
    } else if (errorMessage.includes('API key')) {
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
      provider, // Include provider for retry exclusion
    };
  }
}

// ============================================================================
// 4. Streaming Supervisor (Real-time Implementation)
// ============================================================================

export type StreamEventType =
  | 'tool_call'
  | 'tool_result'
  | 'text_delta'
  | 'step_finish'
  | 'handoff'       // NEW: 에이전트 핸드오프 이벤트
  | 'agent_status'  // NEW: 에이전트 상태 변경
  | 'done'
  | 'error';

export interface StreamEvent {
  type: StreamEventType;
  data: unknown;
}

/**
 * Execute supervisor with real-time streaming response
 * Uses AI SDK streamText for token-by-token streaming
 *
 * @example
 * for await (const event of executeSupervisorStream(request)) {
 *   if (event.type === 'text_delta') {
 *     process.stdout.write(event.data as string);
 *   }
 * }
 */
export async function* executeSupervisorStream(
  request: SupervisorRequest
): AsyncGenerator<StreamEvent> {
  const startTime = Date.now();

  // Determine execution mode
  let mode = request.mode || 'auto';
  if (mode === 'auto') {
    const lastUserMessage = request.messages.filter((m) => m.role === 'user').pop();
    mode = lastUserMessage ? selectExecutionMode(lastUserMessage.content) : 'single';
  }

  console.log(`🎯 [SupervisorStream] Mode: ${mode}`);

  // Multi-agent mode with real streaming
  if (mode === 'multi') {
    // Use real streaming from orchestrator
    yield* executeMultiAgentStream({
      messages: request.messages,
      sessionId: request.sessionId,
      enableTracing: request.enableTracing,
    });
    return;
  }

  // Single-agent streaming mode
  yield* streamSingleAgent(request, startTime);
}

/**
 * Stream single-agent mode with real streamText
 * Uses provider-specific circuit breaker for isolation
 */
async function* streamSingleAgent(
  request: SupervisorRequest,
  startTime: number
): AsyncGenerator<StreamEvent> {
  // Get model first to determine provider
  let provider: ProviderName;
  let modelId: string;
  let model;

  try {
    logProviderStatus();
    const modelResult = getSupervisorModel();
    model = modelResult.model;
    provider = modelResult.provider;
    modelId = modelResult.modelId;
  } catch (error) {
    yield {
      type: 'error',
      data: { code: 'NO_PROVIDER', message: error instanceof Error ? error.message : String(error) },
    };
    return;
  }

  // Get provider-specific circuit breaker
  const circuitBreaker = getCircuitBreaker(`stream-${provider}`);

  // Check circuit breaker for this specific provider
  if (!circuitBreaker.isAllowed()) {
    yield {
      type: 'error',
      data: { code: 'CIRCUIT_OPEN', message: `Provider ${provider} circuit breaker is OPEN` },
    };
    return;
  }

  try {

    console.log(`🤖 [SupervisorStream] Using ${provider}/${modelId}`);

    // Create Langfuse trace
    const lastUserMessage = request.messages.filter((m) => m.role === 'user').pop();
    const trace = createSupervisorTrace({
      sessionId: request.sessionId,
      mode: 'single',
      query: lastUserMessage?.content || '',
    });

    // Convert messages to ModelMessage format
    const modelMessages: ModelMessage[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...request.messages.map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    ];

    const toolsCalled: string[] = [];
    let fullText = '';

    // Execute streamText with multi-step tool calling
    // Reduced step count and tokens for faster responses (Vercel 60s limit)
    const result = streamText({
      model,
      messages: modelMessages,
      tools: allTools,
      stopWhen: stepCountIs(3), // Reduced from 5 to 3 for faster responses
      temperature: 0.2,
      maxOutputTokens: 1536, // Reduced from 2048 for faster responses
    });

    // Stream text deltas
    for await (const textPart of result.textStream) {
      fullText += textPart;
      yield { type: 'text_delta', data: textPart };
    }

    // Await promises for final data
    const [steps, usage] = await Promise.all([result.steps, result.usage]);

    // Emit step finish events and collect tool calls
    for (const step of steps) {
      for (const toolCall of step.toolCalls) {
        const toolName = toolCall.toolName;
        toolsCalled.push(toolName);
        yield { type: 'tool_call', data: { name: toolName } };
      }
      if (step.toolResults) {
        for (const tr of step.toolResults) {
          if ('result' in tr) {
            yield { type: 'tool_result', data: { toolName: tr.toolName, result: tr.result } };
            // Log tool call to Langfuse
            logToolCall(trace, tr.toolName, {}, tr.result, 0);
          }
        }
      }
    }

    const durationMs = Date.now() - startTime;

    // Log generation to Langfuse
    logGeneration(trace, {
      model: modelId,
      provider,
      input: lastUserMessage?.content || '',
      output: fullText,
      usage: {
        inputTokens: usage?.inputTokens ?? 0,
        outputTokens: usage?.outputTokens ?? 0,
        totalTokens: usage?.totalTokens ?? 0,
      },
      duration: durationMs,
    });

    // Finalize trace
    finalizeTrace(trace, fullText, true, {
      toolsCalled,
      stepsExecuted: steps.length,
      durationMs,
    });

    console.log(
      `✅ [SupervisorStream] Completed in ${durationMs}ms, tools: [${toolsCalled.join(', ')}]`
    );

    // Emit done event
    yield {
      type: 'done',
      data: {
        success: true,
        toolsCalled,
        usage: {
          promptTokens: usage?.inputTokens ?? 0,
          completionTokens: usage?.outputTokens ?? 0,
          totalTokens: usage?.totalTokens ?? 0,
        },
        metadata: {
          provider,
          modelId,
          stepsExecuted: steps.length,
          durationMs,
          mode: 'single',
        },
      },
    };
  } catch (error) {
    const durationMs = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);

    console.error(`❌ [SupervisorStream] Error after ${durationMs}ms:`, errorMessage);

    yield {
      type: 'error',
      data: {
        code: error instanceof CircuitOpenError ? 'CIRCUIT_OPEN' : 'STREAM_ERROR',
        message: errorMessage,
      },
    };
  }
}

/**
 * Fallback: Convert non-streaming result to stream events
 */
async function* streamFromNonStreaming(
  request: SupervisorRequest,
  startTime: number
): AsyncGenerator<StreamEvent> {
  const result = await executeSupervisor(request);

  if (!result.success) {
    yield {
      type: 'error',
      data: { code: (result as SupervisorError).code, message: (result as SupervisorError).error },
    };
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

  // Emit text as chunks (simulate streaming)
  const text = successResult.response;
  const chunkSize = 20; // Characters per chunk
  for (let i = 0; i < text.length; i += chunkSize) {
    yield { type: 'text_delta', data: text.slice(i, i + chunkSize) };
  }

  // Emit done event
  yield { type: 'done', data: successResult };
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

  // Server group/type queries (DB, 로드밸런서, 웹, 캐시 등)
  if (/(db|database|데이터베이스|디비)\s*(서버|현황|상태|목록)/i.test(q) ||
      /(lb|loadbalancer|로드\s*밸런서|로드밸런서)\s*(서버|현황|상태|목록)?/i.test(q) ||
      /(web|웹)\s*(서버|현황|상태|목록)/i.test(q) ||
      /(cache|캐시|redis|레디스)\s*(서버|현황|상태|목록)/i.test(q) ||
      /(storage|스토리지|저장소)\s*(서버|현황|상태|목록)/i.test(q) ||
      /(api|app|application|애플리케이션|앱)\s*(서버|현황|상태|목록)/i.test(q)) {
    return {
      category: 'metrics',
      suggestedTools: ['getServerByGroup'],
      confidence: 0.95,
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
