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
  // 🛡️ 입력 검증
  if (!rawList) {
    console.error('❌ transformArray: rawList가 null/undefined입니다');
    return [];
  }

  if (!Array.isArray(rawList)) {
    console.error(
      '❌ transformArray: rawList가 배열이 아닙니다:',
      typeof rawList,
      rawList
    );
    return [];
  }

  console.log('✅ transformArray: 배열 변환 시작:', rawList.length);

  try {
    const result = rawList.map((item, index) => {
      if (!item || typeof item !== 'object') {
        console.warn(`⚠️ transformArray: 잘못된 항목 [${index}]:`, item);
        // 기본값으로 대체
        return transformRawToServer({} as RawServerData, index);
      }
      return transformRawToServer(item, index);
    });

    console.log('✅ transformArray: 변환 완료:', result.length);
    return result;
  } catch (error) {
    console.error('❌ transformArray: 변환 중 오류:', error);
    return [];
  }
}
