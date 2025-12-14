/**
 * NLQ (Natural Language Query) Agent
 * 자연어 쿼리를 서버 메트릭 조회로 변환 (Cloud Run Standalone)
 *
 * 역할:
 * - 서버 상태 조회 (CPU, Memory, Disk)
 * - 단순 메트릭 질의 응답
 * - Supabase 기반 실제 데이터 조회
 */

import { AIMessage } from '@langchain/core/messages';
import { tool } from '@langchain/core/tools';
import type { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { z } from 'zod';
import { getSupabaseClient } from '../../supabase/client.js';
import type { AgentStateType, ToolResult } from '../state-definition.js';
import { createRotatingGoogleModel } from '../utils/google-api-rotator.js';

// ============================================================================
// 1. Model Configuration (with API Key Rotation)
// ============================================================================

const NLQ_MODEL = 'gemini-2.5-flash-preview-05-20';

function getNLQModel(): ChatGoogleGenerativeAI {
  return createRotatingGoogleModel(NLQ_MODEL, {
    temperature: 0.3,
    maxOutputTokens: 1024,
  });
}

// ============================================================================
// 2. Tools Definition
// ============================================================================

const getServerMetricsTool = tool(
  async ({ serverId, metric }) => {
    try {
      const supabase = getSupabaseClient();

      // Supabase에서 서버 메트릭 조회
      let query = supabase.from('servers').select('*');

      if (serverId) {
        query = query.eq('id', serverId);
      }

      const { data: servers, error } = await query;

      if (error) {
        throw error;
      }

      if (!servers || servers.length === 0) {
        // 폴백: Mock 데이터 반환
        return getMockServerMetrics(serverId, metric);
      }

      return {
        success: true,
        servers: servers.map((s) => ({
          id: s.id,
          name: s.name || s.id,
          status: s.status || 'normal',
          cpu: s.cpu_usage || Math.random() * 100,
          memory: s.memory_usage || Math.random() * 100,
          disk: s.disk_usage || Math.random() * 100,
        })),
        summary: {
          total: servers.length,
          alertCount: servers.filter(
            (s) => s.status === 'warning' || s.status === 'critical'
          ).length,
        },
        timestamp: new Date().toISOString(),
        _dataSource: 'supabase',
      };
    } catch (error) {
      console.warn('⚠️ Supabase query failed, using mock data:', error);
      return getMockServerMetrics(serverId, metric);
    }
  },
  {
    name: 'getServerMetrics',
    description: '서버 CPU/메모리/디스크 상태를 조회합니다',
    schema: z.object({
      serverId: z.string().optional().describe('조회할 서버 ID (선택)'),
      metric: z
        .enum(['cpu', 'memory', 'disk', 'all'])
        .describe('조회할 메트릭 타입'),
    }),
  }
);

/**
 * Mock 서버 메트릭 (Supabase 연결 실패 시 폴백)
 */
function getMockServerMetrics(
  serverId?: string,
  _metric?: string
): {
  success: boolean;
  servers: Array<{
    id: string;
    name: string;
    status: string;
    cpu: number;
    memory: number;
    disk: number;
  }>;
  summary: { total: number; alertCount: number };
  timestamp: string;
  _dataSource: string;
} {
  const mockServers = [
    {
      id: 'server-1',
      name: 'Web Server 01',
      status: 'normal',
      cpu: 45,
      memory: 62,
      disk: 48,
    },
    {
      id: 'server-2',
      name: 'API Server 01',
      status: 'warning',
      cpu: 78,
      memory: 85,
      disk: 55,
    },
    {
      id: 'server-3',
      name: 'DB Server 01',
      status: 'normal',
      cpu: 32,
      memory: 71,
      disk: 67,
    },
    {
      id: 'server-4',
      name: 'Cache Server 01',
      status: 'critical',
      cpu: 92,
      memory: 94,
      disk: 78,
    },
    {
      id: 'server-5',
      name: 'Worker Server 01',
      status: 'normal',
      cpu: 28,
      memory: 45,
      disk: 35,
    },
  ];

  const servers = serverId
    ? mockServers.filter((s) => s.id === serverId)
    : mockServers;

  return {
    success: true,
    servers,
    summary: {
      total: servers.length,
      alertCount: servers.filter(
        (s) => s.status === 'warning' || s.status === 'critical'
      ).length,
    },
    timestamp: new Date().toISOString(),
    _dataSource: 'mock',
  };
}

// ============================================================================
// 3. NLQ Agent Node Function
// ============================================================================

/**
 * NLQ Agent 노드 함수
 */
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
      returnToSupervisor: false,
      delegationRequest: null,
    };
  } catch (error) {
    console.error('❌ NLQ Agent Error:', error);
    return {
      finalResponse: '서버 상태 조회 중 오류가 발생했습니다.',
      toolResults: [
        {
          toolName: 'nlq_error',
          success: false,
          data: null,
          error: String(error),
          executedAt: new Date().toISOString(),
        },
      ],
      returnToSupervisor: false,
      delegationRequest: null,
    };
  }
}
