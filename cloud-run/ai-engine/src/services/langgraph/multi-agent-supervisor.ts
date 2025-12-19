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
    stateModifier: `당신은 OpenManager VIBE의 NLQ Agent입니다.
사용자의 자연어 질문을 서버 메트릭 조회 또는 로그 분석으로 변환합니다.

가능한 작업:
- 서버 상태 조회 (CPU, Memory, Disk)
- 서버 로그 및 에러 이력 조회 (DB 검색)
- 전체 서버 요약

질문이 "로그 보여줘" 또는 "에러 확인해줘"와 관련되면 'getServerLogs' 도구를 사용하세요.
상태나 메트릭 관련이면 'getServerMetrics' 도구를 사용하세요.
조회 결과를 한국어로 친절하게 설명해주세요.`,
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
    stateModifier: `당신은 OpenManager VIBE의 Analyst Agent입니다.
서버 시스템 패턴을 분석하고 인사이트를 제공합니다.

가능한 작업:
- 이상 탐지 (detectAnomalies): 통계적 이상치 감지
- 트렌드 예측 (predictTrends): 선형 회귀 기반 예측
- 패턴 분석 (analyzePattern): 질문 의도 파악

분석 결과를 바탕으로:
1. 현재 상태 요약
2. 발견된 패턴/이상에 대한 상세 설명
3. 잠재적 문제점 또는 주의사항
4. 권장 조치사항

한국어로 전문적이지만 이해하기 쉽게 설명해주세요.`,
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
    stateModifier: `당신은 OpenManager VIBE의 Reporter Agent입니다.
장애 분석 및 인시던트 리포트를 생성합니다.

가능한 작업:
- 지식베이스 검색 (searchKnowledgeBase): RAG 기반 과거 장애 이력 검색
- 명령어 추천 (recommendCommands): CLI 명령어 추천

인시던트 리포트 형식:
### 📋 인시던트 요약
[문제 상황 요약]

### 🔍 원인 분석
[가능한 원인들]

### 💡 권장 조치
[단계별 해결 방안]

### ⌨️ 추천 명령어
[실행 가능한 명령어들]

한국어로 작성하고, 전문적이면서도 이해하기 쉽게 설명해주세요.`,
  });
}

// ============================================================================
// 2. Supervisor Creation
// ============================================================================

const SUPERVISOR_PROMPT = `당신은 OpenManager VIBE의 Multi-Agent Supervisor입니다.
사용자 요청을 분석하고 적절한 에이전트에게 작업을 위임합니다.

## 에이전트 목록
1. **nlq_agent**: 서버 상태/메트릭 조회 (CPU, Memory, Disk)
   - 예: "서버 상태", "CPU 사용률", "메모리 확인"

2. **analyst_agent**: 패턴 분석, 이상 탐지, 트렌드 예측
   - 예: "이상 감지", "트렌드 분석", "패턴 확인", "종합 분석"

3. **reporter_agent**: 인시던트 리포트, 장애 분석, RAG 검색
   - 예: "장애 분석", "원인 파악", "해결 방법", "과거 이력"

## 라우팅 규칙
- 단순 조회 → nlq_agent
- 분석/예측 → analyst_agent
- 장애/리포트 → reporter_agent
- 인사말/일반 대화 → 직접 응답

적절한 에이전트를 선택하여 작업을 위임하세요.`;

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
