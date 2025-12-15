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
// A2A Return-to-Supervisor Routing
// ============================================================================

/**
 * Worker Agent 이후 라우팅: 다른 에이전트의 도움이 필요하면 Supervisor로 복귀
 * - returnToSupervisor: true면 Supervisor로 재라우팅
 * - delegationRequest: 있으면 해당 정보를 Supervisor가 활용
 */
function routeFromWorker(
  state: AgentStateType
): typeof SUPERVISOR_NODE | typeof END {
  // Return-to-Supervisor 플래그 체크
  if (state.returnToSupervisor) {
    console.log('🔄 [A2A] Worker requested return to supervisor');
    if (state.delegationRequest) {
      console.log(`   Delegation: ${state.delegationRequest.reason}`);
      console.log(
        `   From: ${state.delegationRequest.fromAgent} → To: ${state.delegationRequest.toAgent || 'supervisor decision'}`
      );
    }
    return SUPERVISOR_NODE;
  }
  return END;
}

// ============================================================================
// Parallel Execution Node
// ============================================================================

/**
 * 에이전트 타입별 노드 함수 매핑
 */
const AGENT_NODE_MAP: Record<
  string,
  (state: AgentStateType) => Promise<Partial<AgentStateType>>
> = {
  nlq: nlqAgentNode,
  analyst: analystAgentNode,
  reporter: reporterAgentNode,
};

/**
 * 에이전트 타입별 표시 이름
 */
const AGENT_DISPLAY_NAMES: Record<string, string> = {
  nlq: '📋 데이터 조회 (NLQ)',
  analyst: '📊 메트릭 분석 (Analyst)',
  reporter: '📝 장애 리포트 (Reporter)',
};

/**
 * 동적 병렬 분석 노드
 * - state.parallelAgents가 설정되면 해당 에이전트들을 병렬 실행
 * - 설정되지 않으면 기본값으로 analyst + nlq 실행
 * - Promise.allSettled로 부분 실패 허용
 * - agentResults에 결과 누적하여 A2A Context Propagation 지원
 */
async function parallelAnalysisNode(
  state: AgentStateType
): Promise<Partial<AgentStateType>> {
  // 동적 에이전트 선택 (state.parallelAgents 또는 기본값)
  const agentsToRun =
    state.parallelAgents && state.parallelAgents.length > 0
      ? state.parallelAgents.filter(
          (a): a is NonNullable<typeof a> => a !== null
        )
      : ['analyst', 'nlq'];

  console.log(`🔄 [Parallel Analysis] Starting concurrent execution...`);
  console.log(`   Agents: ${agentsToRun.join(', ')}`);

  const startTime = Date.now();

  // Promise.allSettled로 부분 실패 허용
  const results = await Promise.allSettled(
    agentsToRun.map(async (agentType) => {
      const nodeFn = AGENT_NODE_MAP[agentType];
      if (!nodeFn) {
        throw new Error(`Unknown agent type: ${agentType}`);
      }
      const result = await nodeFn(state);
      return { agentType, result };
    })
  );

  const elapsedMs = Date.now() - startTime;
  console.log(`✅ [Parallel Analysis] Completed in ${elapsedMs}ms`);

  // 결과 분류 (성공/실패)
  const successfulResults: Array<{
    agentType: string;
    result: Partial<AgentStateType>;
  }> = [];
  const failedAgents: Array<{ agentType: string; error: string }> = [];

  results.forEach((result, index) => {
    const agentType = agentsToRun[index] ?? 'unknown';
    if (result.status === 'fulfilled') {
      successfulResults.push(result.value);
      console.log(`   ✅ ${agentType} succeeded`);
    } else {
      failedAgents.push({
        agentType,
        error: result.reason?.message || 'Unknown error',
      });
      console.error(`   ❌ ${agentType} failed:`, result.reason);
    }
  });

  // 도구 결과 병합
  const combinedToolResults = successfulResults.flatMap(
    ({ result }) => result.toolResults || []
  );

  // A2A Context Propagation: agentResults에 결과 누적
  const newAgentResults = successfulResults.map(({ agentType, result }) => ({
    agentId: agentType as AgentStateType['targetAgent'],
    response:
      typeof result.messages?.[0]?.content === 'string'
        ? result.messages[0].content
        : '응답 없음',
    toolResults: result.toolResults || [],
    confidence: 0.85,
    executedAt: new Date().toISOString(),
    metadata: { parallelExecution: true },
  }));

  // 응답 메시지 구성
  const { AIMessage } = await import('@langchain/core/messages');

  let combinedResponse = `## 🔍 병렬 분석 결과\n\n`;

  // 성공한 에이전트 결과 추가
  for (const { agentType, result } of successfulResults) {
    const displayName = AGENT_DISPLAY_NAMES[agentType] || agentType;
    const response =
      typeof result.messages?.[0]?.content === 'string'
        ? result.messages[0].content
        : '결과 없음';
    combinedResponse += `### ${displayName}\n${response}\n\n`;
  }

  // 실패한 에이전트 표시
  if (failedAgents.length > 0) {
    combinedResponse += `### ⚠️ 실패한 에이전트\n`;
    for (const { agentType, error } of failedAgents) {
      combinedResponse += `- ${agentType}: ${error}\n`;
    }
    combinedResponse += '\n';
  }

  combinedResponse += `---\n⏱️ 병렬 처리 완료: ${elapsedMs}ms (${successfulResults.length}/${agentsToRun.length} 성공)`;

  return {
    messages: [new AIMessage(combinedResponse)],
    toolResults: combinedToolResults,
    agentResults: newAgentResults, // A2A Context Propagation
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
 * START → supervisor → [nlq_agent | analyst_agent | reporter_agent | parallel_analysis | END]
 *              ↑                ↓               ↓              ↓
 *              └────────────────┴───────────────┘              ↓
 *              (A2A Return-to-Supervisor)         [approval_check (if needed)]
 *                                                              ↓
 *                                                             END
 *
 * Features:
 * - A2A (Agent-to-Agent): Worker들이 returnToSupervisor=true로 재라우팅 요청 가능
 * - Human-in-the-Loop: reporter_agent에서 승인 필요시 approval_check 노드로 분기
 * - Context Propagation: agentResults에 이전 에이전트 결과 누적
 * - Dynamic Parallel: parallel_analysis로 Analyst+NLQ 동시 실행
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

    // Worker → Supervisor 또는 END (A2A Return-to-Supervisor 패턴)
    .addConditionalEdges(NLQ_NODE, routeFromWorker, {
      [SUPERVISOR_NODE]: SUPERVISOR_NODE,
      __end__: END,
    })
    .addConditionalEdges(ANALYST_NODE, routeFromWorker, {
      [SUPERVISOR_NODE]: SUPERVISOR_NODE,
      __end__: END,
    })
    .addEdge(PARALLEL_ANALYSIS_NODE, END) // Parallel Analysis는 직접 종료 (이미 두 에이전트 통합)

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
            // AI SDK v5 Data Stream Protocol: output the final response content
            if (chunk.content) {
              const dataStreamText = `0:${JSON.stringify(chunk.content)}\n`;
              controller.enqueue(encoder.encode(dataStreamText));
            }
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
        // AI SDK v5 Data Stream Protocol: finish message (error case)
        const finishMessage = `d:${JSON.stringify({ finishReason: 'error' })}\n`;
        controller.enqueue(encoder.encode(finishMessage));
        controller.close();
      }
    },
  });
}
