import { RawServerData } from '@/types/raw/RawServerData';
import { Server } from '@/types/server';

// 상태 매핑 헬퍼
export const mapStatus = (
  raw: RawServerData['status']
): 'online' | 'warning' | 'offline' => {
  switch (raw) {
    case 'running':
    case 'unknown':
      return 'online';
    case 'warning':
      return 'warning';
    default:
      return 'offline';
  }
};

export function transformRawToServer(
  raw: RawServerData,
  index: number = 0
): Server {
  const cpu = raw.metrics?.cpu ?? raw.cpu ?? 0;
  const memory = raw.metrics?.memory ?? raw.memory ?? 0;
  const disk = raw.metrics?.disk ?? raw.disk ?? 0;
  const network = raw.metrics?.network?.in ?? raw.network ?? 0; /* 단순치 */

  return {
    id: raw.id || `server-${index}`,
    name: raw.name || raw.hostname || `서버-${index + 1}`,
    status: mapStatus(raw.status),
    location: raw.location || raw.region || 'Unknown',
    cpu: Math.round(cpu),
    memory: Math.round(memory),
    disk: Math.round(disk),
    network: Math.round(network),
    uptime:
      typeof raw.uptime === 'number'
        ? `${Math.floor(raw.uptime / 3600)}h`
        : (raw.uptime as string) || `${index + 1}일`,
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
    logs: undefined,
    networkInfo: undefined,
    systemInfo: undefined,
  } as Server;
}

export function transformArray(rawList: RawServerData[]): Server[] {
  return rawList.map(transformRawToServer);
}
