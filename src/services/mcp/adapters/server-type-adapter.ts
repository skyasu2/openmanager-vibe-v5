/**
 * 🔄 Server Type Adapter
 *
 * ServerInstance와 MCPMonitoringData 간의 타입 변환을 담당
 * 타입 안전성을 보장하면서 두 도메인 간의 브리지 역할
 */

import type { ServerInstance } from '@/types/data-generator';
import type { MCPMonitoringData } from '@/types/mcp';

/**
 * ServerInstance를 MCP 서버 형식으로 변환
 */
export function serverInstanceToMCPServer(
  server: ServerInstance
): MCPMonitoringData['servers'][0] {
  return {
    id: server.id,
    name: server.name,
    status: server.status,
    // health 변환 - number와 객체 형태 모두 처리
    health:
      typeof server.health === 'number'
        ? {
            score: server.health,
            trend: [],
            status: getHealthStatus(server.health),
          }
        : server.health || { score: 100, trend: [], status: 'healthy' },
    // metrics 변환 - network 속성 특별 처리
    metrics: server.metrics
      ? {
          ...Object.entries(server.metrics).reduce(
            (acc, [key, value]) => {
              // network 속성은 제외하고 나머지만 포함
              if (key !== 'network' && typeof value === 'number') {
                acc[key] = value;
              }
              return acc;
            },
            {} as Record<string, number>
          ),
          // network 값 별도 처리
          network_in:
            typeof server.metrics.network === 'number'
              ? server.metrics.network / 2
              : server.metrics.network &&
                  typeof server.metrics.network === 'object' &&
                  'in' in server.metrics.network
                ? (server.metrics.network as { in: number; out: number }).in
                : 0,
          network_out:
            typeof server.metrics.network === 'number'
              ? server.metrics.network / 2
              : server.metrics.network &&
                  typeof server.metrics.network === 'object' &&
                  'out' in server.metrics.network
                ? (server.metrics.network as { in: number; out: number }).out
                : 0,
        }
      : undefined,
    // 기본 메트릭 값들 직접 매핑
    cpu: server.cpu,
    memory: server.memory,
    disk: server.disk,
  };
}

/**
 * ServerInstance 배열을 MCPMonitoringData로 변환
 */
export function createMCPMonitoringData(
  servers: ServerInstance[],
  context?: Record<string, unknown>
): MCPMonitoringData {
  const mcpServers = servers.map(serverInstanceToMCPServer);

  return {
    servers: mcpServers,
    metrics: calculateAggregateMetrics(servers),
    timestamp: new Date(),
    context: context || {},
    clusters: [],
    applications: [],
    summary: {
      performance: {
        avgCpu: servers.reduce((sum, s) => sum + s.cpu, 0) / servers.length,
        avgMemory:
          servers.reduce((sum, s) => sum + s.memory, 0) / servers.length,
      },
    },
  };
}

/**
 * health 점수로부터 상태 문자열 도출
 */
function getHealthStatus(score: number): string {
  if (score >= 90) return 'healthy';
  if (score >= 70) return 'warning';
  if (score >= 50) return 'degraded';
  return 'critical';
}

/**
 * 집계 메트릭 계산
 */
function calculateAggregateMetrics(
  servers: ServerInstance[]
): Record<string, unknown> {
  const totalServers = servers.length;
  if (totalServers === 0) return {};

  return {
    totalServers,
    avgCpu: servers.reduce((sum, s) => sum + s.cpu, 0) / totalServers,
    avgMemory: servers.reduce((sum, s) => sum + s.memory, 0) / totalServers,
    avgDisk: servers.reduce((sum, s) => sum + s.disk, 0) / totalServers,
    healthyServers: servers.filter(
      s => s.status === 'online' || s.status === 'healthy'
    ).length,
    warningServers: servers.filter(s => s.status === 'warning').length,
    criticalServers: servers.filter(
      s => s.status === 'critical' || s.status === 'offline'
    ).length,
  };
}

/**
 * Health 속성에 안전하게 접근하는 헬퍼
 */
export function getHealthScore(
  health:
    | number
    | { score: number; trend?: number[]; status?: string }
    | undefined
): number {
  if (typeof health === 'number') return health;
  if (health && typeof health === 'object' && 'score' in health)
    return health.score;
  return 100; // 기본값
}

/**
 * 서버 상태의 severity 판단
 */
export function getServerSeverity(
  server: MCPMonitoringData['servers'][0]
): 'info' | 'warning' | 'error' | 'critical' {
  const healthScore = getHealthScore(server.health);

  if (healthScore < 50) return 'critical';
  if (healthScore < 70) return 'error';
  if (healthScore < 90) return 'warning';
  return 'info';
}
