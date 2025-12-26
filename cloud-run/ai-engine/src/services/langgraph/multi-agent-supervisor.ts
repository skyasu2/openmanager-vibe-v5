/**
 * Multi-Agent Supervisor using @langchain/langgraph-supervisor
 * Cloud Run Standalone Implementation
 */

import { AIMessage, BaseMessage, HumanMessage, SystemMessage } from '@langchain/core/messages';
import { createReactAgent } from '@langchain/langgraph/prebuilt';
import { createSupervisor } from '@langchain/langgraph-supervisor';
import {
  analyzePatternTool,
  detectAnomaliesTool,
  predictTrendsTool,
} from '../../agents/analyst-agent';
// Import tools from Agents
import {
  getServerMetricsTool,
  getServerLogsTool,
  getServerMetricsAdvancedTool,
} from '../../agents/nlq-agent';
// NLQ SubGraph for complex queries (Phase 2)
import { executeNlqSubGraph } from './nlq-subgraph';
import {
  recommendCommandsTool,
  searchKnowledgeBaseTool,
} from '../../agents/reporter-agent';
// Verifier Agent for post-processing validation
import { comprehensiveVerifyTool } from '../../agents/verifier-agent';
import type { VerificationResult } from '../../lib/state-definition';

import {
  createSessionConfig,
  getAutoCheckpointer,
} from '../../lib/checkpointer';
// Context Compression Integration (Phase 3)
import {
  needsCompression,
  getCompressionStats,
  getSummarizer,
  isCompressionDisabled,
} from '../../lib/context-compression';
import { RateLimitError } from '../../lib/errors';
import { approvalStore } from '../approval/approval-store';
import {
  getAnalystModel,
  getNLQModel,
  getReporterModel,
  getSupervisorModel,
  createMistralModel,
  MISTRAL_MODELS,
} from '../../lib/model-config';
// LangFuse Integration (Phase 2)
import { createSessionHandler } from '../../lib/langfuse-handler';

// ============================================================================
// 0. Groq Message Compatibility Helper
// ============================================================================

/**
 * Creates a stateModifier function that:
 * 1. Adds a system prompt
 * 2. Filters out tool-call messages that Groq cannot process
 * 3. Ensures all message content is string-based
 *
 * This is necessary because the Supervisor generates tool-call messages
 * with array-based content that Groq's API rejects.
 */
function createGroqCompatibleStateModifier(systemPrompt: string) {
  return (state: { messages: BaseMessage[] }): BaseMessage[] => {
    const filteredMessages: BaseMessage[] = [];

    // Add system prompt first
    filteredMessages.push(new SystemMessage(systemPrompt));

    // Filter and transform messages for Groq compatibility
    for (const msg of state.messages) {
      // Skip tool-call messages (they have complex content structures)
      // Also skip internal handoff messages from supervisor
      const content = msg.content;

      // Check if content is a string (Groq-compatible)
      if (typeof content === 'string') {
        // Skip internal supervisor handoff messages
        if (content.includes('Successfully transferred') ||
            content.includes('Transferring back to')) {
          continue;
        }
        filteredMessages.push(msg);
      }
      // If content is an array, try to extract text parts only
      else if (Array.isArray(content)) {
        const textParts = content
          .filter((part): part is { type: 'text'; text: string } =>
            typeof part === 'object' && part !== null && part.type === 'text'
          )
          .map(part => part.text)
          .join('\n');

        if (textParts.length > 0) {
          // Create a new message with string content
          if (msg._getType() === 'human') {
            filteredMessages.push(new HumanMessage(textParts));
          } else if (msg._getType() === 'ai') {
            filteredMessages.push(new AIMessage(textParts));
          }
        }
      }
    }

    return filteredMessages;
  };
}

// ============================================================================
// 1. Worker Agent Creation
// ============================================================================

/**
 * Create NLQ Agent - Server metrics queries
 * Phase 2 Enhancement: Added getServerMetricsAdvancedTool for complex queries
 */
function createNLQAgent() {
  const systemPrompt = `NLQ Agent - 서버 메트릭/로그 조회 전문

## 도구 사용 규칙
1. **전체 서버 조회**: "서버 상태", "전체 현황" 등 → serverId 생략 (필수!)
2. **특정 서버 조회**: "WEB-01 상태" 등 → serverId 지정
3. 로그/에러 조회 → getServerLogs
4. 상태/메트릭 조회 → getServerMetrics
5. **고급 쿼리** (시간 범위/필터/집계) → getServerMetricsAdvanced
   - "지난 6시간 CPU 평균" → timeRange="last6h", aggregation="avg"
   - "CPU 80% 이상 서버들" → filters=[{field:"cpu", operator:">", value:80}]
   - "메모리 TOP 5" → sortBy="memory", limit=5
6. 시스템 용어/개념 확인 → searchKnowledgeBase (RAG)

## 전체 서버 응답 형식 (serverId 없이 조회 시)
📊 **전체 서버 현황** (총 N대)
- ✅ 정상: N대
- ⚠️ 주의: N대 (서버명 나열)
- 🔴 위험: N대 (서버명 나열)

**주요 이상 서버:**
• [서버명] CPU X% / Memory X% / Disk X% - 상태

## 고급 쿼리 응답 형식
📈 **[쿼리 설명]** (시간 범위/조건)
- 서버1: 메트릭값
- 서버2: 메트릭값
[요약: N대 중 N대 매칭]

## 특정 서버 응답 형식
• [서버명] CPU: X% | Memory: X% | Disk: X%
• 상태: 정상/주의/위험
• 특이사항: (있으면 1줄)

⚠️ 중요: 특정 서버를 명시하지 않으면 반드시 serverId를 생략하여 전체 조회!`;

  return createReactAgent({
    llm: getNLQModel(),
    tools: [
      getServerMetricsTool,
      getServerLogsTool,
      getServerMetricsAdvancedTool, // Phase 2: 고급 쿼리 도구
      searchKnowledgeBaseTool,
    ],
    name: 'nlq_agent',
    stateModifier: createGroqCompatibleStateModifier(systemPrompt),
  });
}

/**
 * Execute NLQ SubGraph directly for complex queries
 * Alternative execution path when Supervisor detects complex NLQ query
 * @param query - Natural language query
 * @returns Formatted response from NLQ SubGraph
 */
export async function executeComplexNlqQuery(query: string): Promise<{
  success: boolean;
  response: string;
  metadata: {
    intent: string;
    timeRange?: string;
    aggregation?: string;
    filterCount: number;
  };
}> {
  const result = await executeNlqSubGraph(query);
  return {
    success: result.success,
    response: result.response,
    metadata: {
      intent: result.intent,
      timeRange: result.params?.timeRange,
      aggregation: result.params?.aggregation,
      filterCount: result.params?.filters?.length || 0,
    },
  };
}

/**
 * Create Analyst Agent - Pattern analysis & anomaly detection
 */
function createAnalystAgent() {
  const systemPrompt = `Analyst Agent - 패턴 분석/이상 탐지 전문

## 도구
- detectAnomalies: 이상치 감지
- predictTrends: 트렌드 예측
- analyzePattern: 패턴 분석
- searchKnowledgeBase: 과거 사례 및 해결 가이드 검색 (RAG)

## 응답 형식 (필수)
**현황**: (1줄 요약)
**패턴**: (발견된 패턴 해석)
**조치**: (필요시 권장사항)

⚠️ 통계 수치만 나열 금지. 의미 해석 중심으로 3섹션 이내.`;

  return createReactAgent({
    llm: getAnalystModel(),
    tools: [detectAnomaliesTool, predictTrendsTool, analyzePatternTool, searchKnowledgeBaseTool],
    name: 'analyst_agent',
    stateModifier: createGroqCompatibleStateModifier(systemPrompt),
  });
}

/**
 * Create Reporter Agent - Incident reports & RAG
 */
function createReporterAgent() {
  const systemPrompt = `Reporter Agent - 인시던트 리포트 전문

## 도구
- searchKnowledgeBase: RAG 검색
- recommendCommands: CLI 명령어

## 응답 형식 (엄격 준수)
### 📋 요약
(1-2줄 핵심만)

### 🔍 원인
- (원인 1줄씩, 최대 3개)

### 💡 조치
1. (단계별, 최대 3단계)

### ⌨️ 명령어
\`command\` - 설명

⚠️ 서론/인사말 금지. 템플릿 형식만 출력.`;

  return createReactAgent({
    llm: getReporterModel(),
    tools: [searchKnowledgeBaseTool, recommendCommandsTool],
    name: 'reporter_agent',
    stateModifier: createGroqCompatibleStateModifier(systemPrompt),
  });
}

// ============================================================================
// 2. Supervisor Creation
// ============================================================================

const SUPERVISOR_PROMPT = `당신은 OpenManager VIBE의 Multi-Agent Supervisor입니다.

## 에이전트 라우팅
- **nlq_agent**: 서버 상태/메트릭 조회 (CPU, Memory, Disk)
- **analyst_agent**: 패턴 분석, 이상 탐지, 트렌드 예측
- **reporter_agent**: 인시던트 리포트, 장애 분석, RAG 검색

## 라우팅 규칙
- "서버 상태", "전체 현황", "서버 확인" → nlq_agent (전체 서버 조회 필요)
- "WEB-01 상태" 등 특정 서버 언급 → nlq_agent (해당 서버만 조회)
- 분석/예측/트렌드 → analyst_agent
- 장애/리포트/원인 → reporter_agent
- 인사말 → 직접 응답 (1문장)

## 응답 지침
- 에이전트 결과를 그대로 전달 (재가공 금지)
- 불필요한 인사말/서론 금지
- 핵심만 간결하게`;

/**
 * Create Multi-Agent Supervisor Workflow
 */
interface SupervisorOptions {
  useFallbackModel?: boolean;
}

export async function createMultiAgentSupervisor(options: SupervisorOptions = {}) {
  const { useFallbackModel = false } = options;
  const checkpointer = await getAutoCheckpointer();

  // Create worker agents
  const nlqAgent = createNLQAgent();
  const analystAgent = createAnalystAgent();
  const reporterAgent = createReporterAgent();

  // Select model: Groq (primary) or Mistral (fallback)
  const supervisorModel = useFallbackModel
    ? createMistralModel(MISTRAL_MODELS.SMALL, { temperature: 0.1, maxOutputTokens: 512 })
    : getSupervisorModel();

  if (useFallbackModel) {
    console.log('🔄 [Supervisor] Using Mistral fallback model due to Groq rate limit');
  }

  // Create supervisor with automatic handoffs
  const workflow = createSupervisor({
    agents: [nlqAgent, analystAgent, reporterAgent],
    llm: supervisorModel,
    prompt: SUPERVISOR_PROMPT,
    outputMode: 'full_history',
  });

  // Compile with checkpointer for session persistence
  return workflow.compile({
    checkpointer,
  });
}

// ============================================================================
// 3. Verifier Integration (Post-Processing)
// ============================================================================

interface VerificationOptions {
  enableVerification?: boolean;
  context?: string;
}

/**
 * Verify agent response using Verifier Agent
 * Post-processing validation for quality assurance
 */
async function verifyAgentResponse(
  response: string,
  options: VerificationOptions = {}
): Promise<{
  response: string;
  verification: VerificationResult | null;
}> {
  const { enableVerification = true, context } = options;

  if (!enableVerification) {
    return { response, verification: null };
  }

  try {
    const startTime = Date.now();
    const result = await comprehensiveVerifyTool.invoke({
      response,
      context,
    });

    const verification: VerificationResult = {
      isValid: result.isValid,
      confidence: result.confidence,
      originalResponse: result.originalResponse,
      validatedResponse: result.validatedResponse,
      issues: result.issues || [],
      metadata: {
        verifiedAt: new Date().toISOString(),
        rulesApplied: result.metadata?.rulesApplied || [],
        corrections: result.metadata?.corrections || [],
        processingTimeMs: Date.now() - startTime,
      },
    };

    console.log(
      `✅ [Verifier] Response verified. Confidence: ${(verification.confidence * 100).toFixed(1)}%, Issues: ${verification.issues.length}`
    );

    // Return validated response if corrections were made
    return {
      response: verification.validatedResponse || response,
      verification,
    };
  } catch (error) {
    console.warn('⚠️ [Verifier] Verification failed, using original response:', error);
    return { response, verification: null };
  }
}

// ============================================================================
// 4. Context Compression Helper
// ============================================================================

/**
 * Compress conversation history if needed
 * Pre-processing step before supervisor invocation
 *
 * @param messages - Current conversation messages
 * @returns Compressed messages or original if compression not needed
 */
async function compressIfNeeded(
  messages: BaseMessage[]
): Promise<{ messages: BaseMessage[]; wasCompressed: boolean; compressionInfo?: { originalCount: number; newCount: number; ratio: number } }> {
  // Check if compression is globally disabled via environment variable
  if (isCompressionDisabled()) {
    return { messages, wasCompressed: false };
  }

  // Check if compression is needed (threshold: 85% context usage, configurable via COMPRESSION_THRESHOLD)
  if (!needsCompression(messages)) {
    return { messages, wasCompressed: false };
  }

  console.log('[Compression] Context compression triggered', {
    messageCount: messages.length,
  });

  try {
    const summarizer = getSummarizer();
    const result = await summarizer.summarize(messages);

    if (!result.wasCompressed) {
      return { messages, wasCompressed: false };
    }

    // Build new message array: [summary, ...recentMessages]
    const compressedMessages: BaseMessage[] = [
      result.summaryMessage,
      ...result.compressedBuffer.recentMessages,
    ];

    console.log('[Compression] Completed', {
      originalCount: messages.length,
      newCount: compressedMessages.length,
      compressionRatio: result.compressedBuffer.metadata.compressionRatio,
      processingTimeMs: result.processingTimeMs,
    });

    return {
      messages: compressedMessages,
      wasCompressed: true,
      compressionInfo: {
        originalCount: messages.length,
        newCount: compressedMessages.length,
        ratio: result.compressedBuffer.metadata.compressionRatio,
      },
    };
  } catch (error) {
    console.warn('[Compression] Failed, using original messages:', error);
    return { messages, wasCompressed: false };
  }
}

// ============================================================================
// 5. Execution Functions
// ============================================================================

export interface SupervisorExecutionOptions {
  sessionId?: string;
  enableVerification?: boolean;
  verificationContext?: string;
  /** Enable context compression for long conversations (default: true) */
  enableCompression?: boolean;
  /** Enable LangFuse tracing for observability (default: true) */
  enableTracing?: boolean;
  /** User ID for LangFuse tracing */
  userId?: string;
}

/**
 * Execute supervisor workflow (single response)
 * Uses Mistral AI for Supervisor with automatic rate limit handling
 * v5.85.0: Added Verifier Agent post-processing for quality assurance
 * v5.86.0: Added Context Compression for long conversations
 * v5.87.0: Added LangFuse tracing for observability
 * v5.88.0: Migrated from Gemini to Mistral AI
 */
export async function executeSupervisor(
  query: string,
  options: SupervisorExecutionOptions = {}
): Promise<{
  response: string;
  sessionId: string;
  verification?: VerificationResult | null;
  compressionApplied?: boolean;
}> {
  const sessionId = options.sessionId || `session_${Date.now()}`;
  const {
    enableVerification = true,
    verificationContext,
    enableCompression = true,
    enableTracing = true,
    userId,
  } = options;
  const MAX_RETRIES = 3; // Retry on transient errors
  let compressionApplied = false;

  // === LangFuse Tracing (v5.87.0) ===
  // Note: LangFuse integration is initialized for session-level observability
  // The handler is passed to LangGraph config for automatic tracing
  const langfuseHandler = enableTracing
    ? await createSessionHandler({
        sessionId,
        userId,
        metadata: {
          query: query.slice(0, 100), // Truncate for metadata
          enableVerification,
          enableCompression,
        },
      })
    : null;

  // Create config with optional LangFuse callbacks
  const config = createSessionConfig(
    sessionId,
    undefined,
    langfuseHandler ? [langfuseHandler] : undefined
  );

  if (langfuseHandler) {
    console.log(`📊 [LangFuse] Tracing initialized for session: ${sessionId}`);
  }

  let useFallbackModel = false;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      // Create fresh supervisor (Groq primary, Mistral fallback on rate limit)
      const app = await createMultiAgentSupervisor({ useFallbackModel });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await app.invoke(
        {
          messages: [new HumanMessage(query)],
        },
        config as any // Type assertion for LangGraph config with LangFuse callbacks
      );

      // Extract final response from messages
      const messages = result.messages || [];

      // === Context Compression (v5.86.0) ===
      // Check if compression is needed after accumulating messages
      if (enableCompression && messages.length > 0) {
        const compressionResult = await compressIfNeeded(messages);
        if (compressionResult.wasCompressed) {
          compressionApplied = true;
          console.log(`🗜️ [Supervisor] Context compressed: ${compressionResult.compressionInfo?.originalCount} → ${compressionResult.compressionInfo?.newCount} messages`);
        }
      }

      const lastMessage = messages[messages.length - 1];
      let response =
        typeof lastMessage?.content === 'string'
          ? lastMessage.content
          : '응답을 생성할 수 없습니다.';

      // === Verifier Agent Post-Processing ===
      let verification: VerificationResult | null = null;
      if (enableVerification && response && response !== '응답을 생성할 수 없습니다.') {
        const verifyResult = await verifyAgentResponse(response, {
          enableVerification: true,
          context: verificationContext || query,
        });
        response = verifyResult.response;
        verification = verifyResult.verification;
      }

      console.log(`✅ [Supervisor] Completed. Session: ${sessionId}, Compressed: ${compressionApplied}, Traced: ${!!langfuseHandler}`);

      // Flush LangFuse traces asynchronously (non-blocking)
      if (langfuseHandler?.flushAsync) {
        langfuseHandler.flushAsync().catch(err => console.warn('⚠️ [LangFuse] Flush failed:', err));
      }

      return { response, sessionId, verification, compressionApplied };
    } catch (error) {
      // Debug: Log caught error details
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`🔴 [Supervisor] Caught error on attempt ${attempt + 1}:`, {
        errorType: error?.constructor?.name,
        messagePreview: errorMessage.slice(0, 200),
      });

      // Check if this is a rate limit error
      const isRateLimit = RateLimitError.isRateLimitError(error);
      console.log(`🔍 [Supervisor] isRateLimitError check: ${isRateLimit}`);

      if (isRateLimit && attempt < MAX_RETRIES - 1) {
        // Switch to Mistral fallback model on rate limit
        if (!useFallbackModel) {
          console.warn(
            `⚠️ [Supervisor] Groq rate limit hit on attempt ${attempt + 1}/${MAX_RETRIES}, switching to Mistral fallback...`
          );
          useFallbackModel = true;
          // Minimal backoff before retry with fallback model
          await new Promise(resolve => setTimeout(resolve, 500));
          continue;
        }

        // If already using fallback and still hitting limits, apply backoff
        const backoffMs = Math.pow(2, attempt) * 1000;
        console.warn(
          `⚠️ [Supervisor] Rate limit hit on fallback model, attempt ${attempt + 1}/${MAX_RETRIES}, retrying in ${backoffMs}ms...`
        );
        await new Promise(resolve => setTimeout(resolve, backoffMs));
        continue;
      }

      // Re-throw if not a rate limit error or no more retries
      throw error;
    }
  }

  // Should not reach here, but TypeScript requires it
  throw new Error('Supervisor execution failed after max retries');
}

/**
 * Stream supervisor workflow (Alternative Implementation)
 * Uses app.stream() for native LangGraph streaming
 *
 * @note CURRENTLY UNUSED - Kept for future reference/optimization
 *
 * This function was replaced by `createSupervisorStreamResponse` which uses
 * `executeSupervisor()` + simulated SSE streaming for better Groq compatibility.
 * Native LangGraph streaming (streamEvents) doesn't emit text tokens properly for Groq models.
 *
 * Consider reactivating if:
 * 1. Switching to a model with native streaming support (e.g., Mistral, OpenAI)
 * 2. LangGraph improves Groq streaming support
 *
 * @see createSupervisorStreamResponse - Currently active implementation
 */
export async function* streamSupervisor(
  query: string,
  options: SupervisorExecutionOptions = {}
): AsyncGenerator<{
  type: 'token' | 'agent_start' | 'agent_end' | 'final' | 'error';
  content: string;
  metadata?: Record<string, unknown>;
}> {
  const app = await createMultiAgentSupervisor();
  const sessionId = options.sessionId || `session_${Date.now()}`;
  const config = createSessionConfig(sessionId);

  try {
    // Use default stream() instead of streamEvents for Groq compatibility
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const stream = await app.stream(
      { messages: [new HumanMessage(query)] },
      config as any // Type assertion for LangGraph config
    );

    let finalContent = '';
    let lastAgentName = '';

    for await (const chunk of stream) {
      // Chunk has agent name as key: { supervisor: {...}, test_agent: {...} }
      for (const [agentName, agentOutput] of Object.entries(chunk)) {
        // Emit agent start
        if (agentName !== lastAgentName) {
          if (lastAgentName) {
            yield {
              type: 'agent_end',
              content: lastAgentName,
              metadata: {},
            };
          }
          yield {
            type: 'agent_start',
            content: agentName,
            metadata: {},
          };
          lastAgentName = agentName;
        }

        // Extract AI message content from agent output
        const output = agentOutput as {
          messages?: Array<{ content?: string; _getType?: () => string }>;
        };
        if (output?.messages) {
          for (const msg of output.messages) {
            // Check if it's an AI message with content
            const msgType = msg._getType?.();
            if (
              msgType === 'ai' &&
              msg.content &&
              typeof msg.content === 'string' &&
              msg.content.length > 0
            ) {
              // Skip system messages like "Successfully transferred..."
              if (
                !msg.content.includes('Successfully transferred') &&
                !msg.content.includes('Transferring back to')
              ) {
                finalContent = msg.content; // Keep the last meaningful AI response
                yield {
                  type: 'token',
                  content: msg.content,
                  metadata: { agent: agentName },
                };
              }
            }
          }
        }
      }
    }

    // Emit final agent end
    if (lastAgentName) {
      yield {
        type: 'agent_end',
        content: lastAgentName,
        metadata: {},
      };
    }

    // Final response
    yield {
      type: 'final',
      content: finalContent,
      metadata: { sessionId },
    };
  } catch (error) {
    yield {
      type: 'error',
      content: error instanceof Error ? error.message : String(error),
      metadata: { sessionId },
    };
  }
}

/**
 * Detect if response requires human approval
 * Returns approval metadata if needed
 */
function detectApprovalRequired(
  response: string,
  query: string
): {
  required: boolean;
  actionType?: 'incident_report' | 'system_command';
  description?: string;
} {
  // Check for command recommendations in response
  const hasCommands =
    response.includes('⌨️') ||
    response.includes('추천 명령어') ||
    response.includes('command') ||
    /`[a-z]+\s+[a-z]+`/i.test(response);

  // Check for incident report
  const isIncident =
    query.includes('장애') ||
    query.includes('인시던트') ||
    response.includes('📋 인시던트');

  if (isIncident) {
    return {
      required: true,
      actionType: 'incident_report',
      description: '인시던트 리포트가 생성되었습니다. 검토 후 승인해주세요.',
    };
  }

  if (hasCommands) {
    return {
      required: true,
      actionType: 'system_command',
      description: '시스템 명령어가 추천되었습니다. 실행 전 검토해주세요.',
    };
  }

  return { required: false };
}

/**
 * Create AI SDK compatible streaming response
 * Uses invoke() for reliability with Groq, then simulates streaming
 * Includes SSE approval events for Human-in-the-Loop
 *
 * v5.84.0: Added keep-alive pings to prevent Vercel/Cloud Run timeout
 */
export async function createSupervisorStreamResponse(
  query: string,
  sessionId?: string
): Promise<ReadableStream<Uint8Array>> {
  const encoder = new TextEncoder();
  const effectiveSessionId = sessionId || `session_${Date.now()}`;

  return new ReadableStream({
    async start(controller) {
      let isClosed = false;
      let keepAliveInterval: ReturnType<typeof setInterval> | null = null;

      const safeEnqueue = (data: Uint8Array): boolean => {
        // Check both our flag AND controller's internal state
        if (isClosed) return false;

        try {
          // Double-check controller state before enqueue
          if (controller.desiredSize === null) {
            isClosed = true;
            return false;
          }
          controller.enqueue(data);
          return true;
        } catch {
          // Controller may have been closed externally (client disconnect)
          isClosed = true;
          return false;
        }
      };

      const safeClose = () => {
        // Clear keep-alive interval first
        if (keepAliveInterval) {
          clearInterval(keepAliveInterval);
          keepAliveInterval = null;
        }

        if (!isClosed) {
          isClosed = true;
          try {
            controller.close();
          } catch {
            // Controller may have been closed externally
          }
        }
      };

      // Start keep-alive ping (every 10 seconds)
      // Uses AI SDK annotation format '8:' for progress updates
      const startKeepAlive = () => {
        let pingCount = 0;
        keepAliveInterval = setInterval(() => {
          pingCount++;
          if (isClosed) {
            if (keepAliveInterval) clearInterval(keepAliveInterval);
            return;
          }

          // Send progress annotation (AI SDK v5 format)
          const progressMessages = [
            '🔄 AI 에이전트가 분석 중입니다...',
            '📊 서버 데이터를 처리하고 있습니다...',
            '🧠 패턴을 분석하고 있습니다...',
            '⏳ 잠시만 기다려주세요...',
          ];
          const message = progressMessages[pingCount % progressMessages.length];

          // Use annotation format for keep-alive (doesn't affect main response)
          const keepAliveMessage = `8:${JSON.stringify([
            { type: 'progress', message, timestamp: Date.now() },
          ])}\n`;

          if (!safeEnqueue(encoder.encode(keepAliveMessage))) {
            // Stream was closed, stop keep-alive
            if (keepAliveInterval) clearInterval(keepAliveInterval);
          }
        }, 10000); // 10 second interval
      };

      try {
        // 🚀 Anti-Timeout: Immediate First Byte (Vercel 504 방지)
        const thinkingMessage = `0:${JSON.stringify('🔍 분석을 시작합니다...\n\n')}\n`;
        if (!safeEnqueue(encoder.encode(thinkingMessage))) {
          console.log('⚠️ Stream closed before processing started');
          return;
        }

        // Start keep-alive pings
        startKeepAlive();

        // Use invoke() for more reliable Groq integration
        // v5.85.0: Verification enabled by default
        // v5.86.0: Context Compression enabled by default
        // v5.87.1: Smart verification - skip for simple queries to reduce latency
        const isSimpleQuery = query.length < 30 ||
          /^(안녕|반가워|고마워|도움|뭐해|테스트)/i.test(query);

        const { response, verification, compressionApplied } = await executeSupervisor(query, {
          sessionId: effectiveSessionId,
          enableVerification: !isSimpleQuery, // Skip verifier for simple queries (~10-20s savings)
          verificationContext: query,
          enableCompression: true,
        });

        // Stop keep-alive before sending response
        if (keepAliveInterval) {
          clearInterval(keepAliveInterval);
          keepAliveInterval = null;
        }

        // Check if stream was closed during supervisor execution
        if (isClosed) {
          console.log(
            '⚠️ Stream closed during supervisor execution, skipping response'
          );
          return;
        }

        if (response) {
          // AI SDK v5 Data Stream Protocol: text part
          // Format: '0:"text"\n'
          const dataStreamText = `0:${JSON.stringify(response)}\n`;
          if (!safeEnqueue(encoder.encode(dataStreamText))) {
            console.log('⚠️ Stream closed, could not send response');
            return;
          }

          // Check if response requires human approval
          const approval = detectApprovalRequired(response, query);

          if (approval.required && approval.actionType) {
            // Register in approval store (async but fire-and-forget is acceptable here)
            await approvalStore.registerPending({
              sessionId: effectiveSessionId,
              actionType: approval.actionType,
              description: approval.description || '',
              payload: { response, query },
              requestedAt: new Date(),
              requestedBy: 'reporter_agent',
            });

            // AI SDK v5 Data Stream Protocol: custom data event
            // Format: '2:[{...}]\n' for data array, or use 'data-*' pattern
            // Using '8:' prefix for custom annotation/metadata
            const approvalEvent = `8:${JSON.stringify([
              {
                type: 'approval_request',
                id: effectiveSessionId,
                actionType: approval.actionType,
                description: approval.description,
              },
            ])}\n`;
            safeEnqueue(encoder.encode(approvalEvent));

            console.log(
              `🔔 [Supervisor] Approval required: ${approval.actionType}`
            );
          }

          // v5.85.0: Emit verification result as annotation
          if (verification) {
            const verificationEvent = `8:${JSON.stringify([
              {
                type: 'verification',
                isValid: verification.isValid,
                confidence: verification.confidence,
                issueCount: verification.issues.length,
                processingTimeMs: verification.metadata.processingTimeMs,
              },
            ])}\n`;
            safeEnqueue(encoder.encode(verificationEvent));

            if (verification.issues.length > 0) {
              console.log(
                `🔍 [Verifier] Detected ${verification.issues.length} issue(s), confidence: ${(verification.confidence * 100).toFixed(1)}%`
              );
            }
          }

          // v5.86.0: Emit compression result as annotation
          if (compressionApplied) {
            const compressionEvent = `8:${JSON.stringify([
              {
                type: 'compression',
                applied: true,
                timestamp: Date.now(),
              },
            ])}\n`;
            safeEnqueue(encoder.encode(compressionEvent));
            console.log('🗜️ [Compression] Context was compressed for this session');
          }
        }

        // AI SDK v5 Data Stream Protocol: finish message
        const finishMessage = `d:${JSON.stringify({
          finishReason: 'stop',
          sessionId: effectiveSessionId,
          verified: verification?.isValid ?? true,
          confidence: verification?.confidence ?? 1.0,
        })}\n`;
        safeEnqueue(encoder.encode(finishMessage));
        console.log(
          `📤 Supervisor completed (AI SDK v5 Protocol, Verified: ${verification?.isValid ?? 'N/A'})`
        );

        safeClose();
      } catch (error) {
        // Stop keep-alive on error
        if (keepAliveInterval) {
          clearInterval(keepAliveInterval);
          keepAliveInterval = null;
        }

        // Only log if stream is still open (avoid noise from closed streams)
        if (!isClosed) {
          console.error('❌ Supervisor error:', error);
          const errorMessage =
            error instanceof Error ? error.message : 'Unknown error';
          const errorStream = `3:${JSON.stringify(errorMessage)}\n`;
          safeEnqueue(encoder.encode(errorStream));
        } else {
          console.log(
            '⚠️ Supervisor error occurred after stream closed:',
            error instanceof Error ? error.message : 'Unknown'
          );
        }
        safeClose();
      }
    },
  });
}
