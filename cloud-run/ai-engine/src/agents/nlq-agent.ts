/**
 * NLQ (Natural Language Query) Agent
 * 자연어 쿼리를 서버 메트릭 조회로 변환
 */

import { AIMessage } from '@langchain/core/messages';
import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { AgentExecutionError, getErrorMessage } from '../lib/errors';
import { getNLQModel } from '../lib/model-config';
import type { AgentStateType, ToolResult } from '../lib/state-definition';
import { loadHourlyScenarioData } from '../services/scenario/scenario-loader';

// ============================================================================
// 2. Tools Definition
// ============================================================================

export const getServerMetricsTool = tool(
  async ({ serverId, metric: _metric }) => {
    const allServers = await loadHourlyScenarioData();
    const target = serverId
      ? allServers.find((s) => s.id === serverId)
      : allServers;

    const servers = Array.isArray(target)
      ? target
      : target
        ? [target]
        : allServers;

    return {
      success: true,
      servers: servers.map((s) => ({
        id: s.id,
        name: s.name,
        status: s.status,
        cpu: s.cpu,
        memory: s.memory,
        disk: s.disk,
      })),
      summary: {
        total: servers.length,
        alertCount: servers.filter(
          (s) => s.status === 'warning' || s.status === 'critical'
        ).length,
      },
      timestamp: new Date().toISOString(),
      _dataSource: 'scenario-loader',
    };
  },
  {
    name: 'getServerMetrics',
    description:
      '서버 CPU/메모리/디스크 상태를 조회합니다 (시나리오 기반 시뮬레이션)',
    schema: z.object({
      serverId: z.string().optional().describe('조회할 서버 ID (선택)'),
      metric: z
        .enum(['cpu', 'memory', 'disk', 'all'])
        .describe('조회할 메트릭 타입'),
    }),
  }
);

// ============================================================================
// 3. NLQ Agent Node Function
// ============================================================================

export async function nlqAgentNode(
  state: AgentStateType
): Promise<Partial<AgentStateType>> {
  const lastMessage = state.messages[state.messages.length - 1];
  const userQuery =
    typeof lastMessage?.content === 'string'
      ? lastMessage.content
      : 'Show server status';

  try {
    const model = getNLQModel();

    // 도구 바인딩
    const modelWithTools = model.bindTools([getServerMetricsTool]);

    // 시스템 프롬프트와 함께 호출
    const response = await modelWithTools.invoke([
      {
        role: 'system',
        content: `당신은 OpenManager VIBE의 NLQ Agent입니다.
사용자의 자연어 질문을 서버 메트릭 조회로 변환합니다.

가능한 작업:
- 서버 상태 조회 (CPU, Memory, Disk)
- 특정 서버 메트릭 조회
- 전체 서버 요약

도구를 사용해서 데이터를 조회한 후, 결과를 한국어로 친절하게 설명해주세요.`,
      },
      { role: 'user', content: userQuery },
    ]);

    // 도구 호출 처리
    const toolCalls = response.tool_calls || [];
    const toolResults: ToolResult[] = [];

    for (const toolCall of toolCalls) {
      if (toolCall.name === 'getServerMetrics') {
        const result = await getServerMetricsTool.invoke(
          toolCall.args as {
            serverId?: string;
            metric: 'cpu' | 'memory' | 'disk' | 'all';
          }
        );
        toolResults.push({
          toolName: 'getServerMetrics',
          success: true,
          data: result,
          executedAt: new Date().toISOString(),
        });
      }
    }

    // 결과 요약 생성
    let finalContent = '';
    const firstToolResult = toolResults[0];
    if (toolResults.length > 0 && firstToolResult) {
      const metricsResult = firstToolResult.data as {
        servers: Array<{
          id: string;
          name: string;
          status: string;
          cpu: number;
          memory: number;
          disk: number;
        }>;
        summary: { total: number; alertCount: number };
      };

      // 간단한 요약 생성
      const summaryResponse = await model.invoke([
        {
          role: 'system',
          content:
            '서버 메트릭 데이터를 받아서 사용자에게 친절하게 한국어로 요약해주세요. 중요한 정보만 간결하게 전달하세요.',
        },
        {
          role: 'user',
          content: `다음 서버 데이터를 요약해주세요: ${JSON.stringify(metricsResult)}`,
        },
      ]);

      finalContent =
        typeof summaryResponse.content === 'string'
          ? summaryResponse.content
          : JSON.stringify(metricsResult);
    } else {
      finalContent =
        typeof response.content === 'string'
          ? response.content
          : '서버 상태를 조회할 수 없습니다.';
    }

    console.log(
      `🔍 [NLQ Agent] Processed query with ${toolResults.length} tool calls`
    );

    return {
      messages: [new AIMessage(finalContent)],
      toolResults,
      finalResponse: finalContent,
    };
  } catch (error) {
    const agentError =
      error instanceof AgentExecutionError
        ? error
        : new AgentExecutionError(
            'nlq',
            error instanceof Error ? error : undefined
          );
    console.error('❌ NLQ Agent Error:', agentError.toJSON());
    return {
      finalResponse: '서버 상태 조회 중 오류가 발생했습니다.',
      toolResults: [
        {
          toolName: 'nlq_error',
          success: false,
          data: null,
          error: getErrorMessage(error),
          executedAt: new Date().toISOString(),
        },
      ],
    };
  }
}
