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
import { getServerMetricsTool } from '../../agents/nlq-agent';
import {
  recommendCommandsTool,
  searchKnowledgeBaseTool,
} from '../../agents/reporter-agent';
import {
  createSessionConfig,
  getAutoCheckpointer,
} from '../../lib/checkpointer';
import {
  getAnalystModel,
  getNLQModel,
  getReporterModel,
  getSupervisorModel,
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
    tools: [getServerMetricsTool],
    name: 'nlq_agent',
    stateModifier: `당신은 OpenManager VIBE의 NLQ Agent입니다.
사용자의 자연어 질문을 서버 메트릭 조회로 변환합니다.

가능한 작업:
- 서버 상태 조회 (CPU, Memory, Disk)
- 특정 서버 메트릭 조회
- 전체 서버 요약

도구를 사용해서 데이터를 조회한 후, 결과를 한국어로 친절하게 설명해주세요.`,
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
 */
export async function executeSupervisor(
  query: string,
  options: SupervisorExecutionOptions = {}
): Promise<{
  response: string;
  sessionId: string;
}> {
  const app = await createMultiAgentSupervisor();
  const sessionId = options.sessionId || `session_${Date.now()}`;
  const config = createSessionConfig(sessionId);

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
}

/**
 * Stream supervisor workflow
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
    const stream = await app.streamEvents(
      {
        messages: [new HumanMessage(query)],
      },
      {
        version: 'v2',
        ...config,
      }
    );

    let finalContent = '';

    for await (const event of stream) {
      // LLM token streaming
      if (event.event === 'on_chat_model_stream') {
        const chunk = event.data?.chunk;
        if (chunk?.content && typeof chunk.content === 'string') {
          finalContent += chunk.content;
          yield {
            type: 'token',
            content: chunk.content,
            metadata: { node: event.name },
          };
        }
      }

      // Agent start
      if (event.event === 'on_chain_start' && event.tags?.includes('agent')) {
        yield {
          type: 'agent_start',
          content: event.name || 'unknown_agent',
          metadata: { tags: event.tags },
        };
      }

      // Agent end
      if (event.event === 'on_chain_end' && event.tags?.includes('agent')) {
        yield {
          type: 'agent_end',
          content: event.name || 'unknown_agent',
          metadata: { output: event.data?.output },
        };
      }
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
 * Create AI SDK compatible streaming response using toUIMessageStream
 * This integrates LangGraph with Vercel AI SDK v5
 */
export async function createSupervisorStreamResponse(
  query: string,
  sessionId?: string
): Promise<ReadableStream<Uint8Array>> {
  const encoder = new TextEncoder();

  return new ReadableStream({
    async start(controller) {
      try {
        const generator = streamSupervisor(query, { sessionId });

        for await (const chunk of generator) {
          if (chunk.type === 'token') {
            // AI SDK v5 Data Stream Protocol: text part
            // Format: '0:"text"\n'
            const dataStreamText = `0:${JSON.stringify(chunk.content)}\n`;
            controller.enqueue(encoder.encode(dataStreamText));
          } else if (chunk.type === 'final') {
            // AI SDK v5 Data Stream Protocol: finish message
            // Format: 'd:{"finishReason":"stop"}\n'
            const finishMessage = `d:${JSON.stringify({ finishReason: 'stop' })}\n`;
            controller.enqueue(encoder.encode(finishMessage));
            console.log('📤 Supervisor stream completed (AI SDK v5 Protocol)');
          } else if (chunk.type === 'error') {
            // AI SDK v5 Data Stream Protocol: error
            // Format: '3:"error message"\n'
            const errorMessage = `3:${JSON.stringify(chunk.content)}\n`;
            controller.enqueue(encoder.encode(errorMessage));
          }
        }

        controller.close();
      } catch (error) {
        console.error('❌ Supervisor streaming error:', error);
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        const errorStream = `3:${JSON.stringify(errorMessage)}\n`;
        controller.enqueue(encoder.encode(errorStream));
        controller.close();
      }
    },
  });
}
