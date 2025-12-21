/**
 * Multi-Agent Supervisor using @langchain/langgraph-supervisor
 * Cloud Run Standalone Implementation
 */

import { HumanMessage } from '@langchain/core/messages';
import { createReactAgent } from '@langchain/langgraph/prebuilt';
import { createSupervisor } from '@langchain/langgraph-supervisor';
import {
  analyzePatternTool,
  detectAnomaliesTool,
  predictTrendsTool,
} from '../../agents/analyst-agent';
// Import tools from Agents
import { getServerMetricsTool, getServerLogsTool } from '../../agents/nlq-agent';
import {
  recommendCommandsTool,
  searchKnowledgeBaseTool,
} from '../../agents/reporter-agent';

import {
  createSessionConfig,
  getAutoCheckpointer,
} from '../../lib/checkpointer';
import { RateLimitError } from '../../lib/errors';
import { approvalStore } from '../approval/approval-store';
import {
  getAnalystModel,
  getGeminiKeyStatus,
  getNLQModel,
  getReporterModel,
  getSupervisorModel,
  markGeminiKeyExhausted,
} from '../../lib/model-config';

// ============================================================================
// 1. Worker Agent Creation
// ============================================================================

/**
 * Create NLQ Agent - Server metrics queries
 */
function createNLQAgent() {
  return createReactAgent({
    llm: getNLQModel(),
    tools: [getServerMetricsTool, getServerLogsTool],
    name: 'nlq_agent',
    stateModifier: `NLQ Agent - 서버 메트릭/로그 조회 전문

## 도구 선택
- 로그/에러 → getServerLogs
- 상태/메트릭 → getServerMetrics

## 응답 형식 (필수)
• [서버명] CPU: X% | Memory: X% | Disk: X%
• 상태: 정상/주의/위험
• 특이사항: (있으면 1줄)

⚠️ 숫자 나열 금지. 3줄 이내 요약만.`,
  });
}

/**
 * Create Analyst Agent - Pattern analysis & anomaly detection
 */
function createAnalystAgent() {
  return createReactAgent({
    llm: getAnalystModel(),
    tools: [detectAnomaliesTool, predictTrendsTool, analyzePatternTool],
    name: 'analyst_agent',
    stateModifier: `Analyst Agent - 패턴 분석/이상 탐지 전문

## 도구
- detectAnomalies: 이상치 감지
- predictTrends: 트렌드 예측
- analyzePattern: 패턴 분석

## 응답 형식 (필수)
**현황**: (1줄 요약)
**패턴**: (발견된 패턴 해석)
**조치**: (필요시 권장사항)

⚠️ 통계 수치만 나열 금지. 의미 해석 중심으로 3섹션 이내.`,
  });
}

/**
 * Create Reporter Agent - Incident reports & RAG
 */
function createReporterAgent() {
  return createReactAgent({
    llm: getReporterModel(),
    tools: [searchKnowledgeBaseTool, recommendCommandsTool],
    name: 'reporter_agent',
    stateModifier: `Reporter Agent - 인시던트 리포트 전문

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

⚠️ 서론/인사말 금지. 템플릿 형식만 출력.`,
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
- 단순 조회 → nlq_agent
- 분석/예측 → analyst_agent
- 장애/리포트 → reporter_agent
- 인사말 → 직접 응답 (1문장)

## 응답 지침
- 에이전트 결과를 그대로 전달 (재가공 금지)
- 불필요한 인사말/서론 금지
- 핵심만 간결하게`;

/**
 * Create Multi-Agent Supervisor Workflow
 */
export async function createMultiAgentSupervisor() {
  const checkpointer = await getAutoCheckpointer();

  // Create worker agents
  const nlqAgent = createNLQAgent();
  const analystAgent = createAnalystAgent();
  const reporterAgent = createReporterAgent();

  // Create supervisor with automatic handoffs
  const workflow = createSupervisor({
    agents: [nlqAgent, analystAgent, reporterAgent],
    llm: getSupervisorModel(),
    prompt: SUPERVISOR_PROMPT,
    outputMode: 'full_history',
  });

  // Compile with checkpointer for session persistence
  return workflow.compile({
    checkpointer,
  });
}

// ============================================================================
// 3. Execution Functions
// ============================================================================

export interface SupervisorExecutionOptions {
  sessionId?: string;
}

/**
 * Execute supervisor workflow (single response)
 * Includes automatic Gemini API key failover on rate limit
 */
export async function executeSupervisor(
  query: string,
  options: SupervisorExecutionOptions = {}
): Promise<{
  response: string;
  sessionId: string;
}> {
  const sessionId = options.sessionId || `session_${Date.now()}`;
  const config = createSessionConfig(sessionId);
  const MAX_RETRIES = 2; // Primary key + secondary key

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      // Create fresh supervisor (uses current active Gemini key)
      const app = await createMultiAgentSupervisor();

      const result = await app.invoke(
        {
          messages: [new HumanMessage(query)],
        },
        config
      );

      // Extract final response from messages
      const messages = result.messages || [];
      const lastMessage = messages[messages.length - 1];
      const response =
        typeof lastMessage?.content === 'string'
          ? lastMessage.content
          : '응답을 생성할 수 없습니다.';

      console.log(`✅ [Supervisor] Completed. Session: ${sessionId}`);
      return { response, sessionId };
    } catch (error) {
      // Check if this is a rate limit error
      if (RateLimitError.isRateLimitError(error)) {
        const keyStatus = getGeminiKeyStatus();
        console.error(
          `⚠️ [Supervisor] Rate limit hit on attempt ${attempt + 1}/${MAX_RETRIES}`,
          { keyStatus }
        );

        // If we have more keys to try, mark current key as exhausted and retry
        if (attempt < MAX_RETRIES - 1 && keyStatus.totalKeys > 1) {
          markGeminiKeyExhausted();
          console.log('🔄 [Supervisor] Switching to secondary Gemini key...');
          continue; // Retry with secondary key
        }
      }

      // Re-throw if not a rate limit error or no more retries
      throw error;
    }
  }

  // Should not reach here, but TypeScript requires it
  throw new Error('All Gemini API keys exhausted');
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
 * 1. Switching to a model with native streaming support (e.g., Gemini, OpenAI)
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
    const stream = await app.stream(
      { messages: [new HumanMessage(query)] },
      config
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

      const safeEnqueue = (data: Uint8Array) => {
        if (!isClosed) {
          controller.enqueue(data);
        }
      };

      const safeClose = () => {
        if (!isClosed) {
          isClosed = true;
          controller.close();
        }
      };

      try {
        // 🚀 Anti-Timeout: Immediate First Byte (Vercel 504 방지)
        const thinkingMessage = `0:${JSON.stringify('🔍 분석을 시작합니다...\n\n')}\n`;
        safeEnqueue(encoder.encode(thinkingMessage));

        // Use invoke() for more reliable Groq integration
        const { response } = await executeSupervisor(query, {
          sessionId: effectiveSessionId,
        });

        if (response) {
          // AI SDK v5 Data Stream Protocol: text part
          // Format: '0:"text"\n'
          const dataStreamText = `0:${JSON.stringify(response)}\n`;
          safeEnqueue(encoder.encode(dataStreamText));

          // Check if response requires human approval
          const approval = detectApprovalRequired(response, query);

          if (approval.required && approval.actionType) {
            // Register in approval store
            approvalStore.registerPending({
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
        }

        // AI SDK v5 Data Stream Protocol: finish message
        const finishMessage = `d:${JSON.stringify({
          finishReason: 'stop',
          sessionId: effectiveSessionId,
        })}\n`;
        safeEnqueue(encoder.encode(finishMessage));
        console.log('📤 Supervisor completed (AI SDK v5 Protocol)');

        safeClose();
      } catch (error) {
        console.error('❌ Supervisor error:', error);
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        const errorStream = `3:${JSON.stringify(errorMessage)}\n`;
        safeEnqueue(encoder.encode(errorStream));
        safeClose();
      }
    },
  });
}
