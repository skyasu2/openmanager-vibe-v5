import type { RawServerData } from '@/types/raw/RawServerData';
import type { Server } from '@/types/server';
import type { ServerMetrics } from '@/config/server-status-thresholds';
import { determineServerStatus } from '@/config/server-status-thresholds';

// 🎯 상태 매핑 헬퍼 (API → UI 상태 변환)
export const mapStatus = (
  raw: RawServerData['status']
): 'online' | 'warning' | 'offline' => {
  switch (raw) {
    case 'running':
      return 'online';
    case 'warning':
      return 'warning';
    case 'error':
    case 'stopped':
    case 'maintenance':
      return 'offline';
    case 'unknown':
    default:
      return 'offline';
  }
};

// 🎯 Enhanced 모달용 상태 매핑 (다른 상태 값 사용)
export const mapStatusForModal = (
  raw: RawServerData['status']
): 'healthy' | 'warning' | 'critical' | 'offline' => {
  switch (raw) {
    case 'running':
      return 'healthy';
    case 'warning':
      return 'warning';
    case 'error':
      return 'critical';
    case 'stopped':
    case 'maintenance':
    case 'unknown':
    default:
      return 'offline';
  }
};

// 🎯 업타임 변환 (초 → 읽기 쉬운 형식)
export const formatUptime = (uptime: number | string): string => {
  if (typeof uptime === 'string') return uptime;

  const seconds = Math.floor(uptime);
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  return `${days}d ${hours}h ${minutes}m`;
};

// 🎯 기본 서버 변환 (기존 ServerDashboard용)
export function transformRawToServer(
  raw: RawServerData,
  index: number = 0
): Server {
  const cpu = raw.metrics?.cpu ?? raw.cpu ?? 0;
  const memory = raw.metrics?.memory ?? raw.memory ?? 0;
  const disk = raw.metrics?.disk ?? raw.disk ?? 0;
  const network = raw.metrics?.network?.in ?? raw.network ?? 0;

  // 🚨 통합 기준으로 서버 상태 판별 (데이터 전처리 단계)
  const serverMetrics: ServerMetrics = {
    cpu,
    memory,
    disk,
    responseTime: 0, // RawServerData에 없으므로 기본값
    networkLatency: 0, // RawServerData에 없으므로 기본값
  };

  const determinedStatus = determineServerStatus(serverMetrics);

  return {
    id: raw.id || `server-${index}`,
    name: raw.name || raw.hostname || `서버-${index + 1}`,
    status: determinedStatus as any, // 통합 기준으로 판별된 상태 사용
    location: raw.location || raw.region || 'Unknown',
    cpu: Math.round(cpu),
    memory: Math.round(memory),
    disk: Math.round(disk),
    network: Math.round(network),
    uptime: formatUptime(raw.uptime || 0),
    lastUpdate: new Date(raw.lastUpdate || Date.now()),
    alerts: raw.alerts ?? 0,
    services: raw.services || [
      { name: 'nginx', status: 'running', port: 80 },
      { name: 'nodejs', status: 'running', port: 3000 },
    ],
    networkStatus: (raw.networkStatus as any) || 'good',
    type: (raw.type as any) || 'api_server',
    environment: (raw.environment as any) || 'production',
    provider: raw.provider || 'AWS',
    ip: generateMockIP(raw.id || `server-${index}`),
    os: generateMockOS(raw.type),
    logs: undefined,
    networkInfo: undefined,
    systemInfo: undefined,
  } as Server;
}

// 🎯 Enhanced 모달용 서버 변환 (완전한 데이터 구조)
export function transformRawToEnhancedServer(
  raw: RawServerData,
  index: number = 0
): any {
  const cpu = raw.metrics?.cpu ?? raw.cpu ?? 0;
  const memory = raw.metrics?.memory ?? raw.memory ?? 0;
  const disk = raw.metrics?.disk ?? raw.disk ?? 0;
  const network = raw.metrics?.network?.in ?? raw.network ?? 0;

  // 🚨 통합 기준으로 서버 상태 판별 (데이터 전처리 단계)
  const serverMetrics: ServerMetrics = {
    cpu,
    memory,
    disk,
    responseTime: 0, // RawServerData에 없으므로 기본값
    networkLatency: 0, // RawServerData에 없으므로 기본값
  };

  const determinedStatus = determineServerStatus(serverMetrics);

  return {
    id: raw.id || `server-${index}`,
    name: raw.name || raw.hostname || `서버-${index + 1}`,
    hostname: raw.hostname || raw.name || `server-${index}`,
    status: determinedStatus, // 통합 기준으로 판별된 상태 사용
    type: raw.type || 'unknown',
    environment: raw.environment || 'production',
    location: raw.location || raw.region || 'Unknown',
    provider: 'AWS', // 기본값
    cpu: Math.round(cpu),
    memory: Math.round(memory),
    disk: Math.round(disk),
    network: Math.round(network),
    uptime: formatUptime(raw.uptime || 0),
    lastUpdate: new Date(raw.lastUpdate || Date.now()),
    alerts: raw.alerts ?? 0,
    services: raw.services || [
      { name: 'nginx', status: 'running', port: 80 },
      { name: 'nodejs', status: 'running', port: 3000 },
      { name: 'redis', status: 'running', port: 6379 },
    ],
    specs: {
      cpu_cores: generateCpuCores(raw.type),
      memory_gb: generateMemoryGB(raw.type),
      disk_gb: generateDiskGB(raw.type),
      network_speed: '1Gbps',
    },
    os: generateMockOS(raw.type),
    ip: generateMockIP(raw.id || `server-${index}`),
    networkStatus: (raw.networkStatus as any) || 'good',
  };
}

// 🎯 헬퍼 함수들

function generateMockIP(serverId: string): string {
  const hash = serverId
    .split('')
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const lastOctet = (hash % 254) + 1;
  return `192.168.1.${lastOctet}`;
}

function generateMockOS(type?: string): string {
  const osMap: Record<string, string> = {
    web: 'Ubuntu 22.04 LTS',
    api: 'CentOS 8',
    database: 'Red Hat Enterprise Linux 9',
    cache: 'Ubuntu 20.04 LTS',
    queue: 'Debian 11',
  };
  return osMap[type || 'unknown'] || 'Linux';
}

function generateCpuCores(type?: string): number {
  const coreMap: Record<string, number> = {
    web: 4,
    api: 8,
    database: 16,
    cache: 8,
    queue: 4,
  };
  return coreMap[type || 'unknown'] || 4;
}

function generateMemoryGB(type?: string): number {
  const memoryMap: Record<string, number> = {
    web: 8,
    api: 16,
    database: 64,
    cache: 32,
    queue: 8,
  };
  return memoryMap[type || 'unknown'] || 8;
}

function generateDiskGB(type?: string): number {
  const diskMap: Record<string, number> = {
    web: 100,
    api: 200,
    database: 2000,
    cache: 500,
    queue: 200,
  };
  return diskMap[type || 'unknown'] || 100;
}

// 🎯 배열 변환 함수들 (내부 사용을 위해 export 제거)
function _transformArray(rawData: RawServerData[]): Server[] {
  return rawData.map((raw, index) => transformRawToServer(raw, index));
}

function _transformArrayForModal(rawData: RawServerData[]): any[] {
  return rawData.map((raw, index) => transformRawToEnhancedServer(raw, index));
}
