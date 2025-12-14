/**
 * LangGraph Multi-Agent Graph Builder
 * Supervisor-Worker 패턴의 StateGraph 조립
 */
import { END, START, StateGraph } from '@langchain/langgraph';
import { analystAgentNode } from './agents/analyst-agent';
import { nlqAgentNode } from './agents/nlq-agent';
import { reporterAgentNode } from './agents/reporter-agent';
import { routeFromSupervisor, supervisorNode } from './agents/supervisor';
import { createSessionConfig, getAutoCheckpointer } from './checkpointer';
import {
  AgentState,
  type AgentStateType,
  ANALYST_NODE,
  NLQ_NODE,
  REPORTER_NODE,
  SUPERVISOR_NODE,
} from './state-definition';

// ============================================================================
// Human-in-the-Loop Constants
// ============================================================================

const APPROVAL_NODE = 'approval_check';
const PARALLEL_ANALYSIS_NODE = 'parallel_analysis';

/**
 * 승인 대기 노드
 * LangGraph interrupt를 사용하여 외부 승인을 기다림
 */
async function approvalNode(
  state: AgentStateType
): Promise<Partial<AgentStateType>> {
  // 이미 승인/거부된 경우 처리
  if (state.approvalStatus === 'approved') {
    const report = state.pendingAction?.payload?.report as string;
    return {
      finalResponse: report || '승인된 리포트가 없습니다.',
      approvalStatus: 'approved',
      pendingAction: null,
    };
  }

  if (state.approvalStatus === 'rejected') {
    return {
      finalResponse:
        '❌ 관리자가 요청을 거부했습니다. 다른 접근 방법을 시도해주세요.',
      approvalStatus: 'rejected',
      pendingAction: null,
    };
  }

  // 승인 대기 상태 유지 (interrupt point)
  console.log('⏸️ [Approval] Waiting for human approval...');
  console.log(`   Action: ${state.pendingAction?.actionType}`);
  console.log(`   Description: ${state.pendingAction?.description}`);

  // 승인 대기 응답 반환 (클라이언트에서 처리)
  return {
    finalResponse: JSON.stringify({
      type: 'approval_required',
      action: state.pendingAction,
      message: '관리자 승인이 필요합니다.',
    }),
  };
}

/**
 * Reporter 이후 라우팅: 승인 필요 여부에 따라 분기
 */
function routeFromReporter(
  state: AgentStateType
): typeof APPROVAL_NODE | typeof END {
  if (state.requiresApproval) {
    return APPROVAL_NODE;
  }
  return END;
}

// ============================================================================
// Parallel Execution Node
// ============================================================================

/**
 * 병렬 분석 노드
 * Analyst와 NLQ 에이전트를 동시에 실행하여 보고서 작성 속도 향상
 */
async function parallelAnalysisNode(
  state: AgentStateType
): Promise<Partial<AgentStateType>> {
  console.log('🔄 [Parallel Analysis] Starting concurrent execution...');

  const startTime = Date.now();

  // Promise.all로 병렬 실행
  const [analystResult, nlqResult] = await Promise.all([
    analystAgentNode(state),
    nlqAgentNode(state),
  ]);

  const elapsedMs = Date.now() - startTime;
  console.log(`✅ [Parallel Analysis] Completed in ${elapsedMs}ms`);

  // 결과 병합
  const combinedToolResults = [
    ...(analystResult.toolResults || []),
    ...(nlqResult.toolResults || []),
  ];

  // 두 응답 통합
  const analystResponse =
    analystResult.messages?.[0]?.content || '분석 결과 없음';
  const nlqResponse = nlqResult.messages?.[0]?.content || '조회 결과 없음';

  const { AIMessage } = await import('@langchain/core/messages');

  const combinedResponse = `## 🔍 병렬 분석 결과

### 📊 메트릭 분석 (Analyst)
${analystResponse}

### 📋 데이터 조회 (NLQ)
${nlqResponse}

---
⏱️ 병렬 처리 완료: ${elapsedMs}ms`;

  return {
    messages: [new AIMessage(combinedResponse)],
    toolResults: combinedToolResults,
    finalResponse: combinedResponse,
  };
}

// ============================================================================
// 1. Graph Building
// ============================================================================

/**
 * 멀티에이전트 StateGraph 생성
 *
 * Flow:
 * START → supervisor → [nlq_agent | analyst_agent | reporter_agent | END]
 *                                                  ↓
 *                                       [approval_check (if needed)]
 *                                                  ↓
 *                                                 END
 *
 * Human-in-the-Loop: reporter_agent에서 승인 필요시 approval_check 노드로 분기
 */
export async function createMultiAgentGraph() {
  const checkpointer = await getAutoCheckpointer();

  // StateGraph 생성
  const graph = new StateGraph(AgentState)
    // 노드 등록
    .addNode(SUPERVISOR_NODE, supervisorNode)
    .addNode(NLQ_NODE, nlqAgentNode)
    .addNode(ANALYST_NODE, analystAgentNode)
    .addNode(REPORTER_NODE, reporterAgentNode)
    .addNode(APPROVAL_NODE, approvalNode)
    .addNode(PARALLEL_ANALYSIS_NODE, parallelAnalysisNode)

    // 엣지 설정
    .addEdge(START, SUPERVISOR_NODE)
    .addConditionalEdges(SUPERVISOR_NODE, routeFromSupervisor, {
      nlq_agent: NLQ_NODE,
      analyst_agent: ANALYST_NODE,
      reporter_agent: REPORTER_NODE,
      parallel_analysis: PARALLEL_ANALYSIS_NODE,
      __end__: END,
    })

    // Worker → END (NLQ, Analyst, Parallel Analysis는 직접 종료)
    .addEdge(NLQ_NODE, END)
    .addEdge(ANALYST_NODE, END)
    .addEdge(PARALLEL_ANALYSIS_NODE, END)

    // Reporter → Approval 조건부 분기 (Human-in-the-Loop)
    .addConditionalEdges(REPORTER_NODE, routeFromReporter, {
      [APPROVAL_NODE]: APPROVAL_NODE,
      __end__: END,
    })

    // Approval → END
    .addEdge(APPROVAL_NODE, END);

  // 컴파일 with interrupt (승인 노드에서 일시 정지)
  return graph.compile({
    checkpointer,
    interruptBefore: [APPROVAL_NODE], // 승인 노드 진입 전 interrupt
  });
}

// ============================================================================
// 2. Graph Execution
// ============================================================================

export interface GraphExecutionOptions {
  sessionId?: string;
  stream?: boolean;
}

// ============================================================================
// 2.1 Approval Management (Human-in-the-Loop)
// ============================================================================

export interface ApprovalDecision {
  approved: boolean;
  reason?: string;
  approvedBy?: string;
}

/**
 * 승인 결정 처리 및 그래프 재개
 * @param sessionId 세션 ID (기존 실행과 동일해야 함)
 * @param decision 승인 결정
 */
export async function resumeWithApproval(
  sessionId: string,
  decision: ApprovalDecision
): Promise<{
  response: string;
  approved: boolean;
}> {
  const graph = await createMultiAgentGraph();
  const config = createSessionConfig(sessionId);

  // 승인 상태 업데이트로 그래프 재개
  const result = await graph.invoke(
    {
      approvalStatus: decision.approved ? 'approved' : 'rejected',
    },
    config
  );

  return {
    response: result.finalResponse || '응답을 생성할 수 없습니다.',
    approved: decision.approved,
  };
}

/**
 * 현재 승인 대기 상태 조회
 */
export async function getPendingApproval(sessionId: string): Promise<{
  hasPending: boolean;
  action: AgentStateType['pendingAction'];
}> {
  const checkpointer = await getAutoCheckpointer();

  // Checkpoint에서 상태 조회
  const config = createSessionConfig(sessionId);
  const checkpoint = await checkpointer.get(config);

  if (!checkpoint) {
    return { hasPending: false, action: null };
  }

  const state = checkpoint.channel_values as AgentStateType;

  return {
    hasPending: state?.requiresApproval === true,
    action: state?.pendingAction || null,
  };
}

/**
 * 그래프 실행 (단일 응답)
 */
export async function executeGraph(
  query: string,
  options: GraphExecutionOptions = {}
): Promise<{
  response: string;
  toolResults: AgentStateType['toolResults'];
  targetAgent: AgentStateType['targetAgent'];
  sessionId: string;
}> {
  const graph = await createMultiAgentGraph();
  const sessionId = options.sessionId || `session_${Date.now()}`;
  const config = createSessionConfig(sessionId);

  const { HumanMessage } = await import('@langchain/core/messages');

  const result = await graph.invoke(
    {
      messages: [new HumanMessage(query)],
      sessionId,
    },
    config
  );

  return {
    response: result.finalResponse || '응답을 생성할 수 없습니다.',
    toolResults: result.toolResults || [],
    targetAgent: result.targetAgent,
    sessionId,
  };
}

/**
 * 그래프 스트리밍 실행
 */
export async function* streamGraph(
  query: string,
  options: GraphExecutionOptions = {}
): AsyncGenerator<{
  type: 'token' | 'tool_result' | 'final';
  content: string;
  metadata?: Record<string, unknown>;
}> {
  const graph = await createMultiAgentGraph();
  const sessionId = options.sessionId || `session_${Date.now()}`;
  const config = createSessionConfig(sessionId);

  const { HumanMessage } = await import('@langchain/core/messages');

  const stream = await graph.streamEvents(
    {
      messages: [new HumanMessage(query)],
      sessionId,
    },
    {
      version: 'v2',
      ...config,
    }
  );

  for await (const event of stream) {
    // LLM 토큰 스트리밍
    if (event.event === 'on_chat_model_stream') {
      const chunk = event.data?.chunk;
      if (chunk?.content) {
        yield {
          type: 'token',
          content: typeof chunk.content === 'string' ? chunk.content : '',
          metadata: { node: event.name },
        };
      }
    }

    // 도구 실행 결과
    if (event.event === 'on_tool_end') {
      yield {
        type: 'tool_result',
        content: JSON.stringify(event.data?.output),
        metadata: { toolName: event.name },
      };
    }

    // 그래프 종료
    if (event.event === 'on_chain_end' && event.name === 'LangGraph') {
      const output = event.data?.output;
      if (output?.finalResponse) {
        yield {
          type: 'final',
          content: output.finalResponse,
          metadata: {
            targetAgent: output.targetAgent,
            toolResults: output.toolResults,
          },
        };
      }
    }
  }
}

// ============================================================================
// 3. Express/Next.js Streaming Adapter
// ============================================================================

/**
 * Next.js API Route용 스트리밍 응답 생성
 * AI SDK v5 Data Stream Protocol 형식 사용
 *
 * @see https://sdk.vercel.ai/docs/ai-sdk-ui/stream-protocol
 * Protocol Format:
 * - Text: `0:${JSON.stringify(text)}\n`
 * - Data: `2:${JSON.stringify(data)}\n`
 * - Error: `3:${JSON.stringify(error)}\n`
 * - Finish: `d:{"finishReason":"stop"}\n`
 */
export async function createStreamingResponse(
  query: string,
  sessionId?: string
): Promise<ReadableStream<Uint8Array>> {
  const encoder = new TextEncoder();

  return new ReadableStream({
    async start(controller) {
      try {
        const generator = streamGraph(query, { sessionId });

        for await (const chunk of generator) {
          if (chunk.type === 'token') {
            // AI SDK v5 Data Stream Protocol: text part
            const dataStreamText = `0:${JSON.stringify(chunk.content)}\n`;
            controller.enqueue(encoder.encode(dataStreamText));
          } else if (chunk.type === 'final') {
            // AI SDK v5 Data Stream Protocol: finish message
            const finishMessage = `d:${JSON.stringify({ finishReason: 'stop' })}\n`;
            controller.enqueue(encoder.encode(finishMessage));
            console.log('📤 Stream completed (AI SDK v5 Data Stream Protocol)');
          }
        }

        controller.close();
      } catch (error) {
        console.error('❌ Streaming error:', error);
        // AI SDK v5 Data Stream Protocol: error part
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        const errorStream = `3:${JSON.stringify(errorMessage)}\n`;
        controller.enqueue(encoder.encode(errorStream));
        controller.close();
      }
    },
  });
}
