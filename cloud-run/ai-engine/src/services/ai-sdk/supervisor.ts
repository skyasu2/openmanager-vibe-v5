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

import {
  generateText,
  streamText,
  stepCountIs,
  hasToolCall,
  createUIMessageStream,
  createUIMessageStreamResponse,
  generateId, // 🎯 P2-2: Cryptographically secure ID generation
  type ModelMessage,
} from 'ai';
import {
  getSupervisorModel,
  getSupervisorModelWithQuota,
  recordModelUsage,
  logProviderStatus,
  type ProviderName,
} from './model-provider';
import {
  TIMEOUT_CONFIG,
  getHardTimeout,
  getWarningThreshold,
  logTimeoutWarning,
  logTimeoutError,
} from '../../config/timeout-config';
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

## 보고서 작성 품질 규칙

### 근본 원인 분석 필수 규칙
- **"원인 불명" 금지**: 반드시 가설이라도 제시하고 신뢰도(%) 명시
- **메트릭 직접 인용**: "CPU 85%는 정상 범위(40-60%)의 170% 수준"
- **상관관계 분석**: "CPU 급증과 동시에 메모리 20% 증가 → 프로세스 폭주 가능성"
- **시간 추이 언급**: "지난 6시간간 68% → 94%로 지속 상승"

### 재발 방지 제안 규칙
- **서버 타입별 맞춤 제안**:
  - DB 서버: VACUUM ANALYZE, 커넥션 풀링, 슬로우 쿼리 점검
  - WAS 서버: JVM 힙 점검, GC 튜닝, 스레드 덤프
  - Cache 서버: 메모리 정책, TTL 검토, eviction 모니터링
- **구체적 명령어 포함**: \`top -o %CPU\`, \`free -m\`, \`jmap -heap <PID>\`
- **임계값 조정 제안**: "CPU 경보 80% → 75% 하향 권장"

### 보고서 신뢰도 기준
- 메트릭 3개 이상 인용 시: 신뢰도 +10%
- 시간 추이 분석 포함 시: 신뢰도 +15%
- CLI 명령어 2개 이상 제안 시: 신뢰도 +10%
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

    // 🎯 P1-1: Record token usage for quota tracking (multi-agent mode)
    // Fix: Gemini review identified missing recordModelUsage in multi-agent path
    if (multiResult.usage.totalTokens > 0) {
      await recordModelUsage(
        multiResult.metadata.provider as import('./model-provider').ProviderName,
        multiResult.usage.totalTokens,
        'multi-agent'
      );
    }

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

      const queryText = lastUserMessage?.content || '';
      const intentCategory = getIntentCategory(queryText);

      // Convert messages to ModelMessage format (AI SDK 6)
      const modelMessages: ModelMessage[] = [
        { role: 'system', content: SYSTEM_PROMPT },
        ...request.messages.map((m) => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        })),
      ];

      // Execute with multi-step tool calling
      // AI SDK v6 Best Practice:
      // - prepareStep: Runtime tool filtering based on query intent
      // - hasToolCall('finalAnswer'): Graceful loop termination
      // - stepCountIs(3): Safety limit
      const result = await generateText({
        model,
        messages: modelMessages,
        tools: allTools,
        prepareStep: createPrepareStep(queryText),
        stopWhen: [hasToolCall('finalAnswer'), stepCountIs(3)],
        temperature: 0.4,
        maxOutputTokens: 1536,
      });

      // Extract tool call information with Langfuse logging
      const toolsCalled: string[] = [];
      const toolResults: Record<string, unknown>[] = [];

      // AI SDK v6 Best Practice: Extract finalAnswer response if called
      let finalAnswerResult: { answer: string } | null = null;

      for (const step of result.steps) {
        for (const toolCall of step.toolCalls) {
          toolsCalled.push(toolCall.toolName);
        }
        // toolResults는 step.toolResults에서 추출
        // AI SDK v6 호환: 여러 toolResult 구조 대응
        if (step.toolResults) {
          for (const tr of step.toolResults) {
            if ('result' in tr) {
              toolResults.push(tr.result as Record<string, unknown>);
              // Log tool call to Langfuse
              logToolCall(trace, tr.toolName, {}, tr.result, 0);
            }

            // Check for finalAnswer tool result (AI SDK v6 Best Practice)
            // Case 1: result 프로퍼티에 answer가 있는 경우
            // Case 2: toolResult 자체에 answer가 있는 경우
            if (tr.toolName === 'finalAnswer') {
              if ('result' in tr && tr.result && typeof tr.result === 'object') {
                const result = tr.result as Record<string, unknown>;
                if ('answer' in result && typeof result.answer === 'string') {
                  finalAnswerResult = { answer: result.answer };
                }
              } else if ('answer' in tr && typeof (tr as Record<string, unknown>).answer === 'string') {
                finalAnswerResult = { answer: (tr as Record<string, unknown>).answer as string };
              }
            }
          }
        }
      }

      // Use finalAnswer if called, otherwise fall back to result.text
      const response = finalAnswerResult?.answer ?? result.text;

      const durationMs = Date.now() - startTime;

      // Log generation to Langfuse
      logGeneration(trace, {
        model: modelId,
        provider,
        input: lastUserMessage?.content || '',
        output: response,
        usage: {
          inputTokens: result.usage?.inputTokens ?? 0,
          outputTokens: result.usage?.outputTokens ?? 0,
          totalTokens: result.usage?.totalTokens ?? 0,
        },
        duration: durationMs,
        metadata: { intent: intentCategory, usedFinalAnswer: !!finalAnswerResult, usedPrepareStep: true },
      });

      // Finalize trace
      finalizeTrace(trace, response, true, {
        toolsCalled,
        stepsExecuted: result.steps.length,
        durationMs,
        intent: intentCategory,
      });

      console.log(
        `✅ [Supervisor] Completed in ${durationMs}ms, tools: [${toolsCalled.join(', ')}]${finalAnswerResult ? ' (via finalAnswer)' : ''}`
      );

      // 🎯 P1-1: Record token usage for quota tracking (pre-emptive fallback)
      const totalTokens = result.usage?.totalTokens ?? 0;
      if (totalTokens > 0) {
        await recordModelUsage(provider, totalTokens, 'supervisor');
      }

      return {
        success: true,
        response,
        toolsCalled,
        toolResults,
        usage: {
          promptTokens: result.usage?.inputTokens ?? 0,
          completionTokens: result.usage?.outputTokens ?? 0,
          totalTokens,
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
  | 'warning'       // NEW: 처리 지연 경고 (25초 초과 시)
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
    const queryText = lastUserMessage?.content || '';
    const trace = createSupervisorTrace({
      sessionId: request.sessionId,
      mode: 'single',
      query: queryText,
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

    // 🎯 P2 Fix: Track stream errors for warning emission
    let streamError: Error | null = null;

    // 🎯 P0 Fix: AbortController for proper stream cancellation on timeout
    const abortController = new AbortController();

    // Execute streamText with multi-step tool calling
    // AI SDK v6 Best Practice:
    // - prepareStep: Runtime tool filtering based on query intent
    // - hasToolCall('finalAnswer'): Graceful loop termination
    // - stepCountIs(3): Safety limit
    // - abortSignal: Proper cancellation support
    const result = streamText({
      model,
      messages: modelMessages,
      tools: allTools,
      prepareStep: createPrepareStep(queryText),
      stopWhen: [hasToolCall('finalAnswer'), stepCountIs(3)],
      temperature: 0.4,
      maxOutputTokens: 1536,
      abortSignal: abortController.signal,
      // 🎯 Phase 3: AI SDK v6 권장 - onError 콜백 추가
      // 스트림 에러 발생 시 로깅 및 추적 (Cloud Run에서 디버깅용)
      onError: ({ error }) => {
        // Ignore abort errors - they're expected on timeout
        if (error instanceof Error && error.name === 'AbortError') return;
        console.error('❌ [SingleAgent] streamText error:', {
          error: error instanceof Error ? error.message : String(error),
          model: modelId,
          provider,
          query: queryText.substring(0, 100),
        });
        // 🎯 P2 Fix: Track error for later warning emission
        streamError = error instanceof Error ? error : new Error(String(error));
      },
    });

    // 🎯 P2-1: Centralized timeout configuration
    // Uses TIMEOUT_CONFIG.supervisor for consistent timeout management
    const SINGLE_AGENT_HARD_TIMEOUT = TIMEOUT_CONFIG.supervisor.hard;
    const TIMEOUT_WARNING_THRESHOLD = TIMEOUT_CONFIG.supervisor.warning;
    let warningEmitted = false;

    // Stream text deltas with hard timeout check
    for await (const textPart of result.textStream) {
      const elapsed = Date.now() - startTime;

      // ⚠️ AI SDK v6 Best Practice: Emit warning before hard timeout
      // Gives user time to understand response may be incomplete
      if (!warningEmitted && elapsed >= TIMEOUT_WARNING_THRESHOLD) {
        warningEmitted = true;
        console.warn(`⚠️ [SingleAgent] Approaching timeout at ${elapsed}ms`);
        yield {
          type: 'warning',
          data: {
            code: 'SLOW_PROCESSING',
            message: '응답 생성이 지연되고 있습니다. 곧 완료됩니다.',
            elapsed,
            threshold: TIMEOUT_WARNING_THRESHOLD,
          },
        };
      }

      // 🔥 Hard timeout: Graceful degradation with partial response
      if (elapsed >= SINGLE_AGENT_HARD_TIMEOUT) {
        console.error(
          `🛑 [SingleAgent] Hard timeout reached at ${elapsed}ms (limit: ${SINGLE_AGENT_HARD_TIMEOUT}ms)`
        );

        // 🎯 AI SDK v6 Best Practice: Graceful timeout with partial response summary
        // Emit what we have so far before error, improving UX
        if (fullText.length > 0) {
          yield {
            type: 'text_delta',
            data: '\n\n---\n⏱️ *응답 시간 초과로 여기까지만 전달됩니다.*',
          };
        }

        yield {
          type: 'error',
          data: {
            code: 'HARD_TIMEOUT',
            error: `처리 시간이 ${SINGLE_AGENT_HARD_TIMEOUT / 1000}초를 초과했습니다.`,
            elapsed,
            // Provide more context for debugging/retry
            partialResponseLength: fullText.length,
            suggestion: fullText.length > 0
              ? '부분 응답이 제공되었습니다. 추가 정보가 필요하면 질문을 더 구체적으로 해주세요.'
              : '쿼리를 간단하게 나눠서 다시 시도해주세요.',
          },
        };

        // 🎯 P0 Fix: Abort stream to prevent resource leak
        // AbortController properly signals streamText to stop underlying fetch/processing
        abortController.abort();

        return;
      }

      fullText += textPart;
      yield { type: 'text_delta', data: textPart };
    }

    // 🎯 P2 Fix: Emit warning if stream error occurred but stream completed
    if (streamError !== null) {
      yield {
        type: 'warning',
        data: {
          code: 'STREAM_ERROR_OCCURRED',
          message: (streamError as Error).message,
        },
      };
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

    // 🎯 CODEX Review R3 Fix: streamError 발생 시 tracing에도 success=false 반영
    const capturedError = streamError as Error | null;
    const streamSucceeded = capturedError === null;
    finalizeTrace(trace, fullText, streamSucceeded, {
      toolsCalled,
      stepsExecuted: steps.length,
      durationMs,
      ...(capturedError && { error: capturedError.message }),
    });

    console.log(
      `✅ [SupervisorStream] Completed in ${durationMs}ms, tools: [${toolsCalled.join(', ')}]`
    );

    // 🎯 P1-1: Record token usage for quota tracking (pre-emptive fallback)
    const totalTokensUsed = usage?.totalTokens ?? 0;
    if (totalTokensUsed > 0) {
      await recordModelUsage(provider, totalTokensUsed, 'supervisor-stream');
    }

    // 🎯 CODEX Review Fix: streamError 발생 시 success=false 반영
    yield {
      type: 'done',
      data: {
        success: capturedError === null,
        toolsCalled,
        usage: {
          promptTokens: usage?.inputTokens ?? 0,
          completionTokens: usage?.outputTokens ?? 0,
          totalTokens: totalTokensUsed,
        },
        metadata: {
          provider,
          modelId,
          stepsExecuted: steps.length,
          durationMs,
          mode: 'single',
        },
        // Include warning info if stream error occurred
        ...(capturedError && {
          warning: {
            code: 'STREAM_ERROR_OCCURRED',
            message: capturedError.message,
          },
        }),
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

// ============================================================================
// 5. prepareStep for Runtime Tool Filtering (AI SDK v6 Best Practice)
// ============================================================================

// ============================================================================
// 🎯 SSOT: Unified Routing Patterns (AI SDK v6 Best Practice)
// Single source of truth for both intent classification and tool filtering
// Compiled once at module load for ~3x perf improvement
// ============================================================================

/**
 * Intent categories for query classification
 * Used for logging, tracing, and tool filtering
 */
type IntentCategory = 'anomaly' | 'prediction' | 'rca' | 'advisor' | 'serverGroup' | 'metrics' | 'general';

/**
 * Pre-compiled regex patterns for routing
 * Order: specific to general (AI SDK v6 Best Practice)
 */
const TOOL_ROUTING_PATTERNS = {
  /** 이상 탐지: 급증/급감/스파이크/anomaly 등 (Analyst) */
  anomaly: /이상|급증|급감|스파이크|anomal|탐지|감지|비정상/i,
  /** 예측/트렌드 분석 (Analyst) */
  prediction: /예측|트렌드|추이|전망|forecast|추세/i,
  /** RCA: 근본 원인 분석, 장애, 인시던트 */
  rca: /장애|rca|타임라인|상관관계|원인|왜|근본|incident/i,
  /** Advisor: 해결 방법, 명령어, 과거 사례 */
  advisor: /해결|방법|명령어|가이드|이력|과거|사례|검색/i,
  /** Server Group: DB/Web/Cache/LB 등 */
  serverGroup: /(db|web|cache|lb|api|storage|로드\s*밸런서|캐시|스토리지)\s*(서버)?/i,
  /** Metrics: 기본 서버/CPU/메모리 상태 (NLQ) */
  metrics: /cpu|메모리|디스크|서버|상태|memory|disk/i,
} as const;

/**
 * Classify query intent using unified patterns (SSOT)
 * AI SDK v6 Best Practice: Same patterns used for both logging and tool filtering
 *
 * @param query User's query text
 * @returns Intent category for logging and tracing
 */
function getIntentCategory(query: string): IntentCategory {
  const q = query.toLowerCase();

  // Order: specific to general (matches createPrepareStep order)
  if (TOOL_ROUTING_PATTERNS.anomaly.test(q)) return 'anomaly';
  if (TOOL_ROUTING_PATTERNS.prediction.test(q)) return 'prediction';
  if (TOOL_ROUTING_PATTERNS.rca.test(q)) return 'rca';
  if (TOOL_ROUTING_PATTERNS.advisor.test(q)) return 'advisor';
  if (TOOL_ROUTING_PATTERNS.serverGroup.test(q)) return 'serverGroup';
  if (TOOL_ROUTING_PATTERNS.metrics.test(q)) return 'metrics';
  return 'general';
}

/**
 * Create prepareStep function for runtime tool filtering
 * AI SDK v6 Best Practice: Filter tools dynamically based on query intent
 *
 * Benefits:
 * - Reduces token usage by limiting tool descriptions sent to LLM
 * - First step uses filtered tools, subsequent steps allow all tools
 * - More flexible than static pre-filtering
 *
 * @param query User's query text
 * @returns PrepareStep function for generateText/streamText
 */
function createPrepareStep(query: string) {
  const q = query.toLowerCase();

  return async ({ stepNumber }: { stepNumber: number }) => {
    // After first step, allow all tools for flexibility
    if (stepNumber > 0) return {};

    // AI SDK v6 Best Practice: Order patterns from specific to general
    // 우선순위: 명시적 이상탐지 → 예측/트렌드 → RCA → Reporter → Server Group → Default

    // 1. 명시적 이상탐지 요청 (최우선 - Analyst)
    if (TOOL_ROUTING_PATTERNS.anomaly.test(q)) {
      return {
        activeTools: ['detectAnomalies', 'predictTrends', 'analyzePattern', 'getServerMetrics', 'finalAnswer'] as ToolName[]
      };
    }

    // 2. 예측/트렌드 분석 요청 (Analyst)
    if (TOOL_ROUTING_PATTERNS.prediction.test(q)) {
      return {
        activeTools: ['predictTrends', 'analyzePattern', 'detectAnomalies', 'correlateMetrics', 'finalAnswer'] as ToolName[]
      };
    }

    // 3. RCA: 근본 원인 분석 (장애, 원인, 왜 등)
    if (TOOL_ROUTING_PATTERNS.rca.test(q)) {
      return {
        activeTools: ['findRootCause', 'buildIncidentTimeline', 'correlateMetrics', 'getServerMetrics', 'detectAnomalies', 'finalAnswer'] as ToolName[]
      };
    }

    // 4. Reporter/Advisor: RAG + commands
    if (TOOL_ROUTING_PATTERNS.advisor.test(q)) {
      return {
        activeTools: ['searchKnowledgeBase', 'recommendCommands', 'searchWeb', 'finalAnswer'] as ToolName[]
      };
    }

    // 5. Server group queries
    if (TOOL_ROUTING_PATTERNS.serverGroup.test(q)) {
      return {
        activeTools: ['getServerByGroup', 'getServerByGroupAdvanced', 'filterServers', 'finalAnswer'] as ToolName[]
      };
    }

    // 6. Default: NLQ metrics tools
    return {
      activeTools: ['getServerMetrics', 'getServerMetricsAdvanced', 'filterServers', 'getServerByGroup', 'finalAnswer'] as ToolName[]
    };
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

// ============================================================================
// 7. AI SDK Native UIMessageStream (Best Practice)
// ============================================================================

/**
 * Create AI SDK Native UIMessageStream Response
 *
 * Uses AI SDK v6 `createUIMessageStream` for native streaming that works
 * directly with `useChat` on the frontend without custom transport.
 *
 * Benefits:
 * - Native AI SDK protocol (text, data, source, tool-call events)
 * - Direct integration with useChat (no TextStreamChatTransport needed)
 * - Structured data events (handoffs, tool calls, metadata)
 * - Better error handling and retry support
 *
 * @param request - Supervisor request with messages and session info
 * @returns Response object with UIMessageStream
 */
export function createSupervisorStreamResponse(
  request: SupervisorRequest
): Response {
  console.log(`🌊 [UIMessageStream] Creating native stream for session: ${request.sessionId}`);

  const stream = createUIMessageStream({
    execute: async ({ writer }) => {
      const startTime = Date.now();
      // 🎯 P2-2 Fix: Cryptographically secure nonce using AI SDK generateId()
      // Replaces Math.random() for collision-free message IDs
      const nonce = generateId();

      // AI SDK v6 Best Practice: Use consistent message ID for all text deltas within same message block
      // CODEX Review: Different IDs per delta causes client rendering issues
      // Multi-agent: Increment sequence on handoff to create separate message blocks
      let messageSeq = 0;
      let currentMessageId = `assistant-${request.sessionId}-${startTime}-${nonce}-${messageSeq}`;

      // 🛡️ UIMessageStream Protocol: Track text-start/text-end lifecycle
      // text-start MUST precede text-delta, text-end MUST follow text-start
      let textPartStarted = false;

      try {
        // Emit start event with session info
        // Use 'data-start' type for custom data (AI SDK requires 'data-${string}' pattern)
        writer.write({
          type: 'data-start',
          data: {
            sessionId: request.sessionId,
            timestamp: new Date().toISOString(),
          },
        });

        // Determine execution mode
        let mode: SupervisorMode = request.mode || 'auto';
        if (mode === 'auto') {
          const lastUserMessage = request.messages.filter((m) => m.role === 'user').pop();
          mode = lastUserMessage ? selectExecutionMode(lastUserMessage.content) : 'single';
        }

        writer.write({
          type: 'data-mode',
          data: { mode },
        });

        // Execute and stream
        for await (const event of executeSupervisorStream({ ...request, mode })) {
          switch (event.type) {
            case 'text_delta':
              // 🛡️ UIMessageStream Protocol: text-start MUST precede text-delta
              if (!textPartStarted) {
                writer.write({
                  type: 'text-start',
                  id: currentMessageId,
                });
                textPartStarted = true;
              }

              // Native text streaming with consistent message ID within same block
              writer.write({
                type: 'text-delta',
                delta: event.data as string,
                id: currentMessageId, // Use same ID for all deltas to merge into single message
              });
              break;

            case 'handoff':
              // 🛡️ UIMessageStream Protocol: Close previous text part before handoff
              if (textPartStarted) {
                writer.write({
                  type: 'text-end',
                  id: currentMessageId,
                });
                textPartStarted = false;
              }

              // AI SDK v6 Best Practice: Create new message ID on handoff
              // This separates different agent responses into distinct UI messages
              messageSeq += 1;
              currentMessageId = `assistant-${request.sessionId}-${startTime}-${nonce}-${messageSeq}`;

              // Structured handoff event
              writer.write({
                type: 'data-handoff',
                data: event.data as object,
              });
              break;

            case 'tool_call':
              // Tool call notification
              writer.write({
                type: 'data-tool-call',
                data: event.data as object,
              });
              break;

            case 'tool_result':
              // Tool result (optional, can be verbose)
              writer.write({
                type: 'data-tool-result',
                data: event.data as object,
              });
              break;

            case 'warning':
              // Processing warning (e.g., slow processing)
              writer.write({
                type: 'data-warning',
                data: event.data as object,
              });
              break;

            case 'agent_status':
              // Agent status change
              writer.write({
                type: 'data-agent-status',
                data: event.data as object,
              });
              break;

            case 'done':
              // 🛡️ UIMessageStream Protocol: Close text part before done
              if (textPartStarted) {
                writer.write({
                  type: 'text-end',
                  id: currentMessageId,
                });
                textPartStarted = false;
              }

              // Completion metadata
              // AI SDK v6 Best Practice: Passthrough success status from upstream with type safety
              const doneData = event.data as Record<string, unknown>;
              // Type guard: only accept boolean success values, default to true otherwise
              const upstreamSuccess = doneData.success;
              const success = typeof upstreamSuccess === 'boolean' ? upstreamSuccess : true;

              writer.write({
                type: 'data-done',
                data: {
                  durationMs: Date.now() - startTime,
                  ...doneData,
                  success,
                },
              });
              break;

            case 'error':
              // 🛡️ UIMessageStream Protocol: Close text part before error
              if (textPartStarted) {
                writer.write({
                  type: 'text-end',
                  id: currentMessageId,
                });
                textPartStarted = false;
              }

              // Error event
              const errorData = event.data as Record<string, unknown>;
              writer.write({
                type: 'error',
                errorText: (errorData.error as string) ?? (errorData.message as string) ?? 'Unknown error',
              });
              break;

            default:
              // Pass through unknown events as data
              writer.write({
                type: `data-${event.type}` as `data-${string}`,
                data: typeof event.data === 'object' ? event.data as object : { value: event.data },
              });
          }
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`❌ [UIMessageStream] Error:`, errorMessage);

        // 🛡️ UIMessageStream Protocol: Close text part before error in catch
        if (textPartStarted) {
          writer.write({
            type: 'text-end',
            id: currentMessageId,
          });
        }

        writer.write({
          type: 'error',
          errorText: errorMessage,
        });
      }
    },
  });

  return createUIMessageStreamResponse({
    stream,
    headers: {
      'X-Session-Id': request.sessionId,
      'X-Stream-Protocol': 'ui-message-stream',
    },
  });
}
