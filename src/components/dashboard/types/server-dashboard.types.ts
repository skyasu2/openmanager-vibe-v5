/**
 * ServerDashboard 컴포넌트 any 타입 제거를 위한 타입 정의
 * any 타입 제거를 위한 명확한 타입 정의
 */

import type { Server, Service, ServerAlert } from '@/types/server';

// 서버 확장 타입 (any 타입 제거용)
export interface ExtendedServer extends Omit<Server, 'networkStatus'> {
  hostname: string;
  cpu: number;
  memory: number;
  disk: number;
  network: number;
  uptime: string | number;
  ip: string;
  os: string;
  type: string;
  environment: string;
  provider: string;
  lastUpdate: Date;
  alerts: number | ServerAlert[];
  services: Service[];
  specs: {
    cpu_cores: number;
    memory_gb: number;
    disk_gb: number;
    network_speed?: string;
  };
  networkStatus: 'excellent' | 'good' | 'poor' | 'offline' | 'healthy' | 'warning' | 'critical' | 'maintenance';
  health: {
    score: number;
    trend: number[];
  };
  alertsSummary: {
    total: number;
    critical: number;
    warning: number;
  };
}

// 서버 타입 가드
export function isExtendedServer(server: Server): server is ExtendedServer {
  return (
    server &&
    'cpu' in server &&
    'memory' in server &&
    'disk' in server &&
    typeof server.cpu === 'number' &&
    typeof server.memory === 'number' &&
    typeof server.disk === 'number'
  );
}

// uptime 포매팅 헬퍼
export function formatUptime(uptime: string | number | undefined): string {
  if (!uptime) return 'N/A';
  
  if (typeof uptime === 'string') {
    return uptime;
  }
  
  if (typeof uptime === 'number') {
    const hours = Math.floor(uptime / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    return `${hours}h ${minutes}m`;
  }
  
  return 'N/A';
}

// alerts 카운트 헬퍼
export function getAlertsCount(alerts: number | ServerAlert[] | undefined): number {
  if (typeof alerts === 'number') {
    return alerts;
  }
  
  if (Array.isArray(alerts)) {
    return alerts.length;
  }
  
  return 0;
}

// 서버를 ExtendedServer로 안전하게 변환
export function toExtendedServer(server: Server): ExtendedServer {
  // 속성 확인을 위한 타입 체크
  const hasProperty = <T extends object, K extends PropertyKey>(
    obj: T,
    key: K
  ): obj is T & Record<K, unknown> => {
    return key in obj;
  };

  return {
    ...server,
    hostname: server.hostname || server.name,
    cpu: hasProperty(server, 'cpu') && typeof server.cpu === 'number' ? server.cpu : 0,
    memory: hasProperty(server, 'memory') && typeof server.memory === 'number' ? server.memory : 0,
    disk: hasProperty(server, 'disk') && typeof server.disk === 'number' ? server.disk : 0,
    network: hasProperty(server, 'network') && typeof server.network === 'number' ? server.network : 25,
    uptime: server.uptime || 'N/A',
    ip: server.ip || '192.168.1.100',
    os: server.os || 'Ubuntu 22.04',
    type: server.type || 'api',
    environment: server.environment || 'prod',
    provider: server.provider || 'Unknown',
    lastUpdate: hasProperty(server, 'lastUpdate') && server.lastUpdate instanceof Date
      ? server.lastUpdate
      : new Date(),
    alerts: server.alerts || 0,
    services: server.services || [],
    specs: hasProperty(server, 'specs') && typeof server.specs === 'object' && server.specs !== null
      ? server.specs as ExtendedServer['specs']
      : {
          cpu_cores: 4,
          memory_gb: 16,
          disk_gb: 500,
        },
    networkStatus: hasProperty(server, 'networkStatus') && 
      ['excellent', 'good', 'poor', 'offline', 'healthy', 'warning', 'critical', 'maintenance'].includes(String(server.networkStatus))
      ? server.networkStatus as ExtendedServer['networkStatus']
      : 'good',
    health: server.health || {
      score: 85,
      trend: [],
    },
    alertsSummary: server.alertsSummary || {
      total: getAlertsCount(server.alerts),
      critical: 0,
      warning: getAlertsCount(server.alerts),
    },
  };
}