import { Server } from '../types/server';

/**
 * 🚀 toLegacyServerCardData
 *
 * 현재 서버 데이터 스키마(Server) → 예전 ServerCard v2.0 컴포넌트와 99% 호환되는 형태로 매핑한다.
 * UI 레이아웃/스타일은 유지하되, 누락된 필드에 기본값을 주입하여 런타임 오류를 방지한다.
 */
export interface LegacyServerCardData {
  id: string;
  name: string;
  type: string;
  environment: string;
  location: string;
  provider: string;
  status: 'online' | 'warning' | 'offline';
  cpu: number;
  memory: number;
  disk: number;
  uptime: string;
  lastUpdate: Date;
  alerts: number;
  services: Array<{
    name: string;
    status: 'running' | 'stopped';
    port: number;
  }>;
  ip?: string;
  hostname?: string;
}

export const toLegacyServerCardData = (
  server: Server | undefined | null
): LegacyServerCardData => {
  // 안전 장치: 서버가 없으면 기본값 반환
  if (!server) {
    return {
      id: 'unknown',
      name: 'Unknown',
      type: 'web',
      environment: 'production',
      location: 'Unknown',
      provider: 'unknown',
      status: 'offline',
      cpu: 0,
      memory: 0,
      disk: 0,
      uptime: '0m',
      lastUpdate: new Date(),
      alerts: 0,
      services: [],
    };
  }

  const randomIfNil = (value: number | undefined, min = 10, max = 50) => {
    if (typeof value === 'number') return Math.round(value);
    return Math.round(Math.random() * (max - min) + min);
  };

  return {
    id: server.id ?? `srv-${Date.now()}`,
    name: server.name ?? 'Unknown',
    type: (server as any).type ?? 'web',
    environment: (server as any).environment ?? 'production',
    location: server.location ?? 'Seoul DC1',
    provider: (server as any).provider ?? 'unknown',
    status: server.status ?? 'offline',
    cpu: randomIfNil((server as any).cpu ?? (server as any).metrics?.cpu),
    memory: randomIfNil(
      (server as any).memory ?? (server as any).metrics?.memory,
      20,
      80
    ),
    disk: randomIfNil(
      (server as any).disk ?? (server as any).metrics?.disk,
      10,
      90
    ),
    uptime: server.uptime ?? `${Math.floor(Math.random() * 30) + 1}일`,
    lastUpdate: server.lastUpdate ?? new Date(),
    alerts: server.alerts ?? 0,
    services: server.services?.length
      ? server.services.map(s => ({
          name: s.name,
          status: (s as any).status ?? 'running',
          port: (s as any).port ?? 80,
        }))
      : [],
    ip: (server as any).ip,
    hostname: (server as any).hostname,
  };
};
