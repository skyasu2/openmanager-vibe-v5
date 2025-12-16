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

export const getServerLogsTool = tool(
  async ({ serverId, limit = 5 }) => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return { success: false, error: 'Supabase credentials missing' };
    }

    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(supabaseUrl, supabaseKey);

      let query = supabase
        .from('server_logs')
        .select('timestamp, level, message, source')
        .order('timestamp', { ascending: false })
        .limit(limit);

      if (serverId) {
        query = query.eq('server_id', serverId);
      }

      const { data, error } = await query;

      if (error) throw error;

      return {
        success: true,
        serverId: serverId || 'ALL',
        logs: data,
        count: data?.length || 0,
        _dataSource: 'supabase-db',
      };
    } catch (e) {
      return { success: false, error: String(e) };
    }
  },
  {
    name: 'getServerLogs',
    description: '서버의 최근 로그 및 장애 이력을 DB에서 조회합니다 (RAG)',
    schema: z.object({
      serverId: z.string().optional().describe('조회할 서버 ID (선택)'),
      limit: z.number().optional().default(5).describe('조회할 로그 개수'),
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

    // 도구 바인딩 (메트릭 + 로그 RAG)
    const modelWithTools = model.bindTools([getServerMetricsTool, getServerLogsTool]);

    // 시스템 프롬프트와 함께 호출
    const response = await modelWithTools.invoke([
      {
        role: 'system',
        content: `당신은 OpenManager VIBE의 NLQ Agent입니다.
사용자의 자연어 질문을 서버 메트릭 조회 또는 로그 분석으로 변환합니다.

가능한 작업:
- 서버 상태 조회 (CPU, Memory, Disk)
- 서버 로그 및 에러 이력 조회 (DB 검색)
- 전체 서버 요약

질문이 "로그 보여줘" 또는 "에러 확인해줘"와 관련되면 'getServerLogs' 도구를 사용하세요.
상태나 메트릭 관련이면 'getServerMetrics' 도구를 사용하세요.
조회 결과를 한국어로 친절하게 설명해주세요.`,
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
      } else if (toolCall.name === 'getServerLogs') {
        const result = await getServerLogsTool.invoke(
          toolCall.args as {
            serverId?: string;
            limit?: number;
          }
        );
        toolResults.push({
          toolName: 'getServerLogs',
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
      const summaryResponse = await model.invoke([
        {
          role: 'system',
          content:
            '서버 데이터(메트릭 또는 로그)를 받아서 사용자에게 친절하게 한국어로 요약해주세요. 중요한 정보만 간결하게 전달하세요.',
        },
        {
          role: 'user',
          content: `다음 데이터를 요약해주세요: ${JSON.stringify(toolResults.map(t => t.data))}`,
        },
      ]);

      finalContent =
        typeof summaryResponse.content === 'string'
          ? summaryResponse.content
          : JSON.stringify(toolResults);
    } else {
      finalContent =
        typeof response.content === 'string'
          ? response.content
          : '요청하신 정보를 조회할 수 없습니다.';
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
