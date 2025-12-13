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
// 1. Graph Building
// ============================================================================

/**
 * 멀티에이전트 StateGraph 생성
 *
 * Flow:
 * START → supervisor → [nlq_agent | analyst_agent | reporter_agent | END]
 *                   ↓
 *                 END
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

    // 엣지 설정
    .addEdge(START, SUPERVISOR_NODE)
    .addConditionalEdges(SUPERVISOR_NODE, routeFromSupervisor, {
      nlq_agent: NLQ_NODE,
      analyst_agent: ANALYST_NODE,
      reporter_agent: REPORTER_NODE,
      __end__: END,
    })

    // Worker → END
    .addEdge(NLQ_NODE, END)
    .addEdge(ANALYST_NODE, END)
    .addEdge(REPORTER_NODE, END);

  // 컴파일
  return graph.compile({ checkpointer });
}

// ============================================================================
// 2. Graph Execution
// ============================================================================

export interface GraphExecutionOptions {
  sessionId?: string;
  stream?: boolean;
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
            controller.enqueue(encoder.encode(chunk.content));
          } else if (chunk.type === 'final') {
            // 최종 응답은 이미 토큰으로 전송됨
            console.log('📤 Stream completed');
          }
        }

        controller.close();
      } catch (error) {
        console.error('❌ Streaming error:', error);
        controller.error(error);
      }
    },
  });
}
