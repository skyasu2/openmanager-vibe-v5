/**
 * 🛠️ 서버 관련 공통 유틸리티 함수
 *
 * 중복 코드 제거 및 번들 크기 최적화
 * - 타입 가드 함수
 * - 서버 데이터 변환 함수
 * - 업타임 포맷팅
 * - 상태 매핑
 */

import type { Server } from '@/types/server';

/**
 * 서버 타입 가드 함수들
 */
export const serverTypeGuards = {
  getCpu: (server: Server): number => {
    return typeof server.cpu === 'number' ? server.cpu : 0;
  },

  getMemory: (server: Server): number => {
    return typeof server.memory === 'number' ? server.memory : 0;
  },

  getDisk: (server: Server): number => {
    return typeof server.disk === 'number' ? server.disk : 0;
  },

  getNetwork: (server: Server): number => {
    return typeof server.network === 'number' ? server.network : 25;
  },

  getSpecs: (server: Server): NonNullable<Server['specs']> => {
    return (
      server.specs || {
        cpu_cores: 4,
        memory_gb: 8,
        disk_gb: 250,
        network_speed: '1Gbps',
      }
    );
  },

  getStatus: (
    status: Server['status']
  ): 'healthy' | 'warning' | 'critical' | 'offline' => {
    if (status === 'online' || status === 'healthy') return 'healthy';
    if (status === 'warning') return 'warning';
    if (status === 'critical') return 'critical';
    return 'offline';
  },

  getAlerts: (alerts: Server['alerts']): number => {
    if (typeof alerts === 'number') return alerts;
    if (Array.isArray(alerts)) return alerts.length;
    return 0;
  },
};

/**
 * 업타임 포맷팅
 */
export function formatUptime(uptime?: number | string): string {
  if (typeof uptime === 'string') return uptime;
  if (typeof uptime !== 'number' || uptime <= 0) return '0m';

  const days = Math.floor(uptime / (24 * 3600));
  const hours = Math.floor((uptime % (24 * 3600)) / 3600);
  const minutes = Math.floor((uptime % 3600) / 60);

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

/**
 * 서버 상태 우선순위 매핑
 */
export const SERVER_STATUS_PRIORITY = {
  critical: 0,
  offline: 0,
  warning: 1,
  healthy: 2,
  online: 2,
} as const;

/**
 * 서버 정렬 함수
 */
export function sortServersByStatus(servers: Server[]): Server[] {
  return [...servers].sort((a, b) => {
    const priorityA =
      SERVER_STATUS_PRIORITY[a.status as keyof typeof SERVER_STATUS_PRIORITY] ??
      3;
    const priorityB =
      SERVER_STATUS_PRIORITY[b.status as keyof typeof SERVER_STATUS_PRIORITY] ??
      3;

    if (priorityA !== priorityB) {
      return priorityA - priorityB;
    }

    // 같은 우선순위면 알림 수로 정렬 (많은 순)
    const alertsA = serverTypeGuards.getAlerts(a.alerts);
    const alertsB = serverTypeGuards.getAlerts(b.alerts);

    return alertsB - alertsA;
  });
}

/**
 * 서버 데이터 정규화
 */
export function normalizeServerData(server: any): Server {
  return {
    id: server.id || server.hostname || 'unknown',
    name: server.name || server.hostname || 'Unknown Server',
    hostname: server.hostname || server.name || 'Unknown',
    status: server.status || 'offline',
    cpu: serverTypeGuards.getCpu(server),
    memory: serverTypeGuards.getMemory(server),
    disk: serverTypeGuards.getDisk(server),
    network: serverTypeGuards.getNetwork(server),
    uptime: server.uptime || 0,
    location: server.location || 'Unknown',
    alerts: server.alerts || 0,
    ip: server.ip || '192.168.1.1',
    os: server.os || 'Ubuntu 22.04 LTS',
    type: server.type || server.role || 'worker',
    environment: server.environment || 'production',
    provider: server.provider || 'On-Premise',
    specs: serverTypeGuards.getSpecs(server),
    lastUpdate: server.lastUpdate || new Date(),
    services: server.services || [],
    networkStatus: server.networkStatus || 'healthy',
  };
}

/**
 * 메트릭 색상 결정
 */
export function getMetricColor(
  value: number,
  type: 'cpu' | 'memory' | 'disk' | 'network'
) {
  const thresholds = {
    cpu: { warning: 70, critical: 85 },
    memory: { warning: 80, critical: 90 },
    disk: { warning: 80, critical: 95 },
    network: { warning: 60, critical: 80 },
  };

  const threshold = thresholds[type];
  if (value >= threshold.critical) {
    return {
      bg: 'from-red-500 to-red-600',
      text: 'text-red-700',
      border: 'border-red-300',
      status: 'critical' as const,
    };
  } else if (value >= threshold.warning) {
    return {
      bg: 'from-amber-500 to-amber-600',
      text: 'text-amber-700',
      border: 'border-amber-300',
      status: 'warning' as const,
    };
  } else {
    const colors = {
      cpu: {
        bg: 'from-blue-500 to-blue-600',
        text: 'text-blue-700',
        border: 'border-blue-300',
      },
      memory: {
        bg: 'from-purple-500 to-purple-600',
        text: 'text-purple-700',
        border: 'border-purple-300',
      },
      disk: {
        bg: 'from-indigo-500 to-indigo-600',
        text: 'text-indigo-700',
        border: 'border-indigo-300',
      },
      network: {
        bg: 'from-emerald-500 to-emerald-600',
        text: 'text-emerald-700',
        border: 'border-emerald-300',
      },
    };
    return {
      ...colors[type],
      status: 'healthy' as const,
    };
  }
}

/**
 * 서버 건강도 계산
 */
export function calculateServerHealth(server: Server): number {
  const cpu = serverTypeGuards.getCpu(server);
  const memory = serverTypeGuards.getMemory(server);
  const disk = serverTypeGuards.getDisk(server);

  // 가중 평균 계산 (CPU: 40%, Memory: 40%, Disk: 20%)
  const weightedScore =
    (100 - cpu) * 0.4 + (100 - memory) * 0.4 + (100 - disk) * 0.2;

  return Math.round(Math.max(0, Math.min(100, weightedScore)));
}
