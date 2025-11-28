import type {
  Server,
  ServerRole,
  ServerEnvironment,
  Service,
} from '@/types/server';
import type { EnhancedServerData } from '@/types/dashboard/server-dashboard.types';

/**
 * 🔄 Server Data Transformer
 *
 * EnhancedServerData를 Server 타입으로 변환하는 순수 함수
 * - 타입 안전성 보장
 * - 기본값 제공
 * - 메트릭 데이터 정규화
 */
export function transformServerData(
  rawServers: EnhancedServerData[]
): Server[] {
  if (!rawServers || !Array.isArray(rawServers) || rawServers.length === 0) {
    return [];
  }

  return rawServers.map((s): Server => {
    const cpu = Math.round(s.cpu || s.cpu_usage || 0);
    const memory = Math.round(s.memory || s.memory_usage || 0);
    const disk = Math.round(s.disk || s.disk_usage || 0);
    const network = Math.round(
      s.network || (s.network_in || 0) + (s.network_out || 0) || 0
    );

    return {
      id: s.id,
      name: s.name || s.hostname || 'Unknown',
      hostname: s.hostname || s.name || 'Unknown',
      status: s.status,
      cpu: cpu,
      memory: memory,
      disk: disk,
      network: network,
      uptime: s.uptime || 0,
      location: s.location || 'Unknown',
      alerts:
        typeof s.alerts === 'number'
          ? s.alerts
          : Array.isArray(s.alerts)
            ? s.alerts.length
            : 0,
      ip: s.ip || '192.168.1.1',
      os: s.os || 'Ubuntu 22.04 LTS',
      role: (s.type || s.role || 'worker') as ServerRole,
      environment: (s.environment || 'production') as ServerEnvironment,
      provider: s.provider || 'On-Premise',
      specs: s.specs || {
        cpu_cores: 4,
        memory_gb: 8,
        disk_gb: 250,
        network_speed: '1Gbps',
      },
      lastUpdate:
        typeof s.lastUpdate === 'string'
          ? new Date(s.lastUpdate)
          : s.lastUpdate || new Date(),
      services: Array.isArray(s.services) ? (s.services as Service[]) : [],
      networkStatus:
        s.status === 'online'
          ? 'online'
          : s.status === 'warning'
            ? 'warning'
            : 'critical',
      systemInfo: s.systemInfo || {
        os: s.os || 'Ubuntu 22.04 LTS',
        uptime:
          typeof s.uptime === 'string'
            ? s.uptime
            : `${Math.floor((s.uptime || 0) / 3600)}h`,
        processes: Math.floor(Math.random() * 200) + 50,
        zombieProcesses: Math.floor(Math.random() * 5),
        loadAverage: '1.23, 1.45, 1.67',
        lastUpdate:
          typeof s.lastUpdate === 'string'
            ? s.lastUpdate
            : s.lastUpdate instanceof Date
              ? s.lastUpdate.toISOString()
              : new Date().toISOString(),
      },
      networkInfo: s.networkInfo || {
        interface: 'eth0',
        receivedBytes: `${Math.floor(s.network_in || 0)} MB`,
        sentBytes: `${Math.floor(s.network_out || 0)} MB`,
        receivedErrors: Math.floor(Math.random() * 10),
        sentErrors: Math.floor(Math.random() * 10),
        status:
          s.status === 'online'
            ? 'online'
            : s.status === 'warning'
              ? 'warning'
              : 'critical',
      },
    };
  });
}
