import type { RawServerData } from '@/types/server-metrics';
import type { Server } from '@/types/server';
import type { ServerMetrics } from '@/config/server-status-thresholds';
import { determineServerStatus } from '@/config/server-status-thresholds';

// 🎯 Enhanced Server 인터페이스 정의 (unknown 타입 대체)
export interface EnhancedServer {
  id: string;
  name: string;
  hostname: string;
  status: 'healthy' | 'warning' | 'critical' | 'offline';
  type: string;
  environment: string;
  location: string;
  provider: string;
  cpu: number;
  memory: number;
  disk: number;
  network: number;
  uptime: string;
  lastUpdate: Date;
  alerts: number;
  services: Array<{ name: string; status: string; port?: number }>;
  specs: {
    cpu_cores: number;
    memory_gb: number;
    disk_gb: number;
    network_speed: string;
  };
  os: string;
  ip: string;
  networkStatus: string;
}

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

// 🎯 Enhanced 모달용 상태 매핑 (determineServerStatus 반환값에 맞춤)
export const mapStatusForModal = (
  status: 'healthy' | 'warning' | 'critical'
): 'healthy' | 'warning' | 'critical' | 'offline' => {
  // determineServerStatus가 반환하는 상태를 그대로 사용
  return status;
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
  const cpu = raw.cpu ?? 0;
  const memory = raw.memory ?? 0;
  const disk = raw.disk ?? 0;
  const network = raw.network ?? 0;

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
    status: determinedStatus, // 통합 기준으로 판별된 상태 사용
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
    networkStatus: raw.networkStatus || 'healthy',
    type: raw.type || 'api_server',
    environment: raw.environment || 'production',
    provider: raw.provider || 'AWS',
    ip: generateMockIP(raw.id || `server-${index}`),
    os: generateMockOS(raw.type),
    logs: undefined,
    networkInfo: undefined,
    systemInfo: undefined,
  } as Server;
}

// 🎯 기본 정보 추출 헬퍼 (복잡도 감소)
function extractBasicInfo(
  raw: RawServerData,
  index: number
): Pick<EnhancedServer, 'id' | 'name' | 'hostname'> {
  return {
    id: raw.id || `server-${index}`,
    name: raw.name || raw.hostname || `서버-${index + 1}`,
    hostname: raw.hostname || raw.name || `server-${index}`,
  };
}

// 🎯 메트릭 추출 헬퍼 (복잡도 감소)
function extractMetrics(
  raw: RawServerData
): Pick<EnhancedServer, 'cpu' | 'memory' | 'disk' | 'network'> {
  const cpu = raw.cpu ?? 0;
  const memory = raw.memory ?? 0;
  const disk = raw.disk ?? 0;
  const network = raw.network ?? 0;

  return {
    cpu: Math.round(cpu),
    memory: Math.round(memory),
    disk: Math.round(disk),
    network: Math.round(network),
  };
}

// 🎯 스펙 정보 추출 헬퍼 (복잡도 감소)
function extractSpecs(raw: RawServerData): EnhancedServer['specs'] {
  return {
    cpu_cores: generateCpuCores(raw.type),
    memory_gb: generateMemoryGB(raw.type),
    disk_gb: generateDiskGB(raw.type),
    network_speed: '1Gbps',
  };
}

// 🎯 시스템 정보 추출 헬퍼 (복잡도 감소)
function extractSystemInfo(
  raw: RawServerData,
  index: number
): Pick<EnhancedServer, 'os' | 'ip' | 'networkStatus'> {
  return {
    os: generateMockOS(raw.type),
    ip: generateMockIP(raw.id || `server-${index}`),
    networkStatus: raw.networkStatus || 'healthy',
  };
}

// 🎯 Enhanced 모달용 서버 변환 (완전한 데이터 구조) - 함수 분할로 복잡도 감소
export function transformRawToEnhancedServer(
  raw: RawServerData,
  index: number = 0
): EnhancedServer {
  // 🔧 기본 정보 추출
  const basicInfo = extractBasicInfo(raw, index);

  // 🔧 메트릭 추출
  const metrics = extractMetrics(raw);

  // 🚨 통합 기준으로 서버 상태 판별 (데이터 전처리 단계)
  const serverMetrics: ServerMetrics = {
    cpu: metrics.cpu,
    memory: metrics.memory,
    disk: metrics.disk,
    responseTime: 0, // RawServerData에 없으므로 기본값
    networkLatency: 0, // RawServerData에 없으므로 기본값
  };

  const determinedStatus = determineServerStatus(serverMetrics);

  // 🔧 스펙 및 시스템 정보 추출
  const specs = extractSpecs(raw);
  const systemInfo = extractSystemInfo(raw, index);

  return {
    ...basicInfo,
    status: mapStatusForModal(determinedStatus), // Enhanced용 상태 매핑
    type: raw.type || 'unknown',
    environment: raw.environment || 'production',
    location: raw.location || raw.region || 'Unknown',
    provider: 'AWS', // 기본값
    ...metrics,
    uptime: formatUptime(raw.uptime || 0),
    lastUpdate: new Date(raw.lastUpdate || Date.now()),
    alerts: raw.alerts ?? 0,
    services: raw.services || [
      { name: 'nginx', status: 'running', port: 80 },
      { name: 'nodejs', status: 'running', port: 3000 },
      { name: 'redis', status: 'running', port: 6379 },
    ],
    specs,
    ...systemInfo,
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

// 🎯 배열 변환 함수들 (타입 안전성 개선)
function _transformArray(rawData: RawServerData[]): Server[] {
  return rawData.map((raw, index) => transformRawToServer(raw, index));
}

function _transformArrayForModal(rawData: RawServerData[]): EnhancedServer[] {
  return rawData.map((raw, index) => transformRawToEnhancedServer(raw, index));
}
