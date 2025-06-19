/**
 * 🔄 서버 데이터 어댑터
 *
 * ServerInstance (데이터 생성기) ↔ Server (프론트엔드) 간 안전한 변환
 * undefined 오류 방지 및 타입 안정성 보장
 */

import { ServerInstance } from '@/types/data-generator';
import { Server } from '@/types/server';

/**
 * ServerInstance를 Server로 안전하게 변환
 */
export function transformServerInstanceToServer(
  serverInstance: ServerInstance
): Server {
  return {
    id: serverInstance.id || `server-${Date.now()}`,
    name: serverInstance.name || 'Unknown Server',

    // 🎯 상태 매핑 (running/warning/error → online/warning/offline)
    status: mapServerStatus(serverInstance.status),

    // 🎯 메트릭 데이터 안전 변환
    cpu: serverInstance.metrics?.cpu || 0,
    memory: serverInstance.metrics?.memory || 0,
    disk: serverInstance.metrics?.disk || 0,
    network: serverInstance.metrics?.network?.in || 0,

    // 🎯 기본 정보
    uptime: formatUptime(serverInstance.metrics?.uptime || 0),
    location: serverInstance.location || 'Unknown Location',
    alerts: calculateAlerts(serverInstance),

    // 🎯 추가 정보 (옵셔널)
    ip: generateIP(serverInstance.id),
    os: getOSFromSpecs(serverInstance.specs),
    lastUpdate: new Date(),

    // 🎯 서비스 정보 변환
    services: transformServices(serverInstance),

    // 🎯 네트워크 상태
    networkStatus: mapNetworkStatus(serverInstance.metrics?.network),

    // 🎯 시스템 정보
    systemInfo: {
      os: getOSFromSpecs(serverInstance.specs),
      uptime: formatUptime(serverInstance.metrics?.uptime || 0),
      processes: Math.floor(Math.random() * 200) + 50,
      zombieProcesses: Math.floor(Math.random() * 5),
      loadAverage: generateLoadAverage(serverInstance.metrics?.cpu || 0),
      lastUpdate: new Date().toISOString(),
    },

    // 🎯 네트워크 정보
    networkInfo: {
      interface: 'eth0',
      receivedBytes: formatBytes(serverInstance.metrics?.network?.in || 0),
      sentBytes: formatBytes(serverInstance.metrics?.network?.out || 0),
      receivedErrors: Math.floor(Math.random() * 10),
      sentErrors: Math.floor(Math.random() * 5),
    },
  };
}

/**
 * 상태 매핑 함수
 */
function mapServerStatus(status: string): 'online' | 'offline' | 'warning' {
  switch (status) {
    case 'running':
      return 'online';
    case 'warning':
      return 'warning';
    case 'error':
    case 'stopped':
    case 'maintenance':
      return 'offline';
    default:
      return 'offline';
  }
}

/**
 * 네트워크 상태 매핑
 */
function mapNetworkStatus(
  network: any
): 'excellent' | 'good' | 'poor' | 'offline' {
  if (!network) return 'offline';

  const totalTraffic = (network.in || 0) + (network.out || 0);

  if (totalTraffic > 150) return 'excellent';
  if (totalTraffic > 100) return 'good';
  if (totalTraffic > 50) return 'poor';
  return 'offline';
}

/**
 * 업타임 포맷팅
 */
function formatUptime(uptimeSeconds: number): string {
  const hours = Math.floor(uptimeSeconds / 3600);
  const minutes = Math.floor((uptimeSeconds % 3600) / 60);

  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h`;
  }

  return `${hours}h ${minutes}m`;
}

/**
 * 알림 개수 계산
 */
function calculateAlerts(serverInstance: ServerInstance): number {
  let alerts = 0;

  // 건강 점수 기반 알림
  if (serverInstance.health?.score < 70) alerts++;

  // 높은 CPU 사용률
  if ((serverInstance.metrics?.cpu || 0) > 80) alerts++;

  // 높은 메모리 사용률
  if ((serverInstance.metrics?.memory || 0) > 85) alerts++;

  // 높은 디스크 사용률
  if ((serverInstance.metrics?.disk || 0) > 90) alerts++;

  // 에러율
  if ((serverInstance.metrics?.errors || 0) > 5) alerts++;

  // 건강 이슈
  alerts += serverInstance.health?.issues?.length || 0;

  return alerts;
}

/**
 * IP 주소 생성
 */
function generateIP(serverId: string): string {
  // 서버 ID를 기반으로 일관된 IP 생성
  const hash = serverId.split('').reduce((a, b) => {
    a = (a << 5) - a + b.charCodeAt(0);
    return a & a;
  }, 0);

  const octet3 = Math.abs(hash % 254) + 1;
  const octet4 = Math.abs((hash >> 8) % 254) + 1;

  return `192.168.${octet3}.${octet4}`;
}

/**
 * OS 정보 추출
 */
function getOSFromSpecs(specs: any): string {
  if (!specs?.cpu?.architecture) return 'Ubuntu 22.04 LTS';

  return specs.cpu.architecture === 'arm64'
    ? 'Ubuntu 22.04 LTS (ARM64)'
    : 'Ubuntu 22.04 LTS (x86_64)';
}

/**
 * 서비스 정보 변환
 */
function transformServices(
  serverInstance: ServerInstance
): Array<{ name: string; status: 'running' | 'stopped'; port: number }> {
  const baseServices: Array<{
    name: string;
    status: 'running' | 'stopped';
    port: number;
  }> = [
    { name: 'nginx', status: 'running', port: 80 },
    { name: 'ssh', status: 'running', port: 22 },
  ];

  // 서버 타입에 따른 추가 서비스
  switch (serverInstance.type) {
    case 'web':
      baseServices.push({ name: 'apache2', status: 'running', port: 443 });
      break;
    case 'api':
      baseServices.push({ name: 'node', status: 'running', port: 3000 });
      break;
    case 'database':
      baseServices.push({ name: 'postgresql', status: 'running', port: 5432 });
      break;
    case 'cache':
      baseServices.push({ name: 'redis', status: 'running', port: 6379 });
      break;
    default:
      baseServices.push({ name: 'systemd', status: 'running', port: 0 });
  }

  // 서버 상태에 따라 서비스 상태 조정
  if (
    serverInstance.status === 'error' ||
    serverInstance.status === 'stopped'
  ) {
    baseServices.forEach(service => {
      if (service.name !== 'ssh') {
        service.status = 'stopped';
      }
    });
  }

  return baseServices;
}

/**
 * 로드 평균 생성
 */
function generateLoadAverage(cpuUsage: number): string {
  const load1 = ((cpuUsage / 100) * 4).toFixed(2);
  const load5 = ((cpuUsage / 100) * 3.8).toFixed(2);
  const load15 = ((cpuUsage / 100) * 3.5).toFixed(2);

  return `${load1}, ${load5}, ${load15}`;
}

/**
 * 바이트 포맷팅
 */
function formatBytes(bytes: number): string {
  const mb = bytes * 1024 * 1024; // 입력값을 MB로 가정

  if (mb > 1024 * 1024 * 1024) {
    return `${(mb / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  } else if (mb > 1024 * 1024) {
    return `${(mb / (1024 * 1024)).toFixed(1)} MB`;
  } else {
    return `${(mb / 1024).toFixed(1)} KB`;
  }
}

/**
 * 배열 변환 함수 (여러 서버 처리)
 */
export function transformServerInstancesToServers(
  serverInstances: ServerInstance[]
): Server[] {
  if (!Array.isArray(serverInstances)) {
    console.warn(
      '⚠️ transformServerInstancesToServers: 입력이 배열이 아님',
      serverInstances
    );
    return [];
  }

  return serverInstances
    .filter(instance => instance != null)
    .map(instance => {
      try {
        return transformServerInstanceToServer(instance);
      } catch (error) {
        console.error('❌ 서버 인스턴스 변환 실패:', instance?.id, error);
        return null;
      }
    })
    .filter((server): server is Server => server !== null);
}

/**
 * 안전한 변환 함수 (에러 처리 포함)
 */
export function safeTransformServerData(data: any): Server[] {
  try {
    if (!data) {
      console.warn('⚠️ safeTransformServerData: 데이터가 없음');
      return [];
    }

    // 이미 Server[] 형태인 경우
    if (Array.isArray(data) && data.length > 0 && 'status' in data[0]) {
      console.log('✅ 이미 Server 형태의 데이터');
      return data;
    }

    // ServerInstance[] 형태인 경우
    if (Array.isArray(data) && data.length > 0 && 'metrics' in data[0]) {
      console.log('🔄 ServerInstance → Server 변환 중...');
      return transformServerInstancesToServers(data);
    }

    console.warn('⚠️ 알 수 없는 데이터 형태:', data);
    return [];
  } catch (error) {
    console.error('❌ 서버 데이터 변환 중 오류:', error);
    return [];
  }
}
