/**
 * NLQ (Natural Language Query) Agent
 * 자연어 쿼리를 서버 메트릭 조회로 변환
 */

import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { getDataCache } from '../lib/cache-layer';
import { loadHourlyScenarioData } from '../services/scenario/scenario-loader';

// ============================================================================
// 2. Tools Definition
// ============================================================================

export const getServerMetricsTool = tool(
  async ({ serverId, metric: _metric }) => {
    const cache = getDataCache();

    // Cache metrics with 1-minute TTL
    const allServers = await cache.getMetrics(
      serverId,
      () => loadHourlyScenarioData()
    );

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
      _cached: true,
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
    const cache = getDataCache();
    const cacheKey = `logs:${serverId || 'all'}:${limit}`;

    // Cache logs with 5-minute TTL (RAG)
    return cache.getHistoricalContext(cacheKey, async () => {
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
          _cached: true,
        };
      } catch (e) {
        return { success: false, error: String(e) };
      }
    });
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

// 🚫 Dead Code Removed: nlqAgentNode
// This function was a legacy standalone node.
// Current architecture uses createReactAgent in multi-agent-supervisor.ts.
// Errors in tools (getServerMetricsTool, getServerLogsTool) will be propagated
// essentially by LangGraph to the supervisor.

