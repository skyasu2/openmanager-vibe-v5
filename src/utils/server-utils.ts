/**
 * 서버 데이터 안전 처리 유틸리티
 * undefined 오류 방지 및 타입 안정성 보장
 */

import { Server } from '../types/server';

/**
 * 서버 객체의 속성을 안전하게 접근하는 함수
 */
export const safeServerAccess = {
  name: (server: Server | undefined | null): string => {
    return server?.name || 'Unknown Server';
  },

  hostname: (server: Server | undefined | null): string => {
    return (server as any)?.hostname || server?.name || 'unknown-host';
  },

  ip: (server: Server | undefined | null): string => {
    return server?.ip || '0.0.0.0';
  },

  location: (server: Server | undefined | null): string => {
    return server?.location || 'Unknown Location';
  },

  status: (
    server: Server | undefined | null
  ): 'online' | 'offline' | 'warning' => {
    return server?.status || 'offline';
  },

  cpu: (server: Server | undefined | null): number => {
    return server?.cpu || 0;
  },

  memory: (server: Server | undefined | null): number => {
    return server?.memory || 0;
  },

  disk: (server: Server | undefined | null): number => {
    return server?.disk || 0;
  },

  network: (server: Server | undefined | null): number => {
    return server?.network || 0;
  },

  uptime: (server: Server | undefined | null): string => {
    return server?.uptime || '0h 0m';
  },

  alerts: (server: Server | undefined | null): number => {
    return server?.alerts || 0;
  },

  services: (server: Server | undefined | null): any[] => {
    return server?.services || [];
  },

  lastUpdate: (server: Server | undefined | null): Date => {
    return server?.lastUpdate || new Date();
  },
};

/**
 * 서버 검색을 안전하게 수행하는 함수
 */
export const safeServerSearch = (
  server: Server | undefined | null,
  searchTerm: string
): boolean => {
  if (!server || !searchTerm) return true;

  const term = searchTerm.toLowerCase();

  // 안전한 문자열 검색
  const searchableFields = [
    safeServerAccess.name(server),
    safeServerAccess.hostname(server),
    safeServerAccess.ip(server),
    safeServerAccess.location(server),
    server.id || '',
  ];

  return searchableFields.some(field => field.toLowerCase().includes(term));
};

/**
 * 서버 배열을 안전하게 필터링하는 함수
 */
export const safeServerFilter = (
  servers: (Server | undefined | null)[],
  searchTerm: string = '',
  statusFilter: string = 'all'
): Server[] => {
  return servers
    .filter((server): server is Server => server != null)
    .filter(server => {
      const matchesSearch = safeServerSearch(server, searchTerm);

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'online' &&
          safeServerAccess.status(server) === 'online') ||
        (statusFilter === 'warning' &&
          safeServerAccess.status(server) === 'warning') ||
        (statusFilter === 'offline' &&
          safeServerAccess.status(server) === 'offline');

      return matchesSearch && matchesStatus;
    });
};

/**
 * 서버 데이터를 Enhanced 형식으로 안전하게 변환
 */
export const safeServerTransform = (server: Server | undefined | null) => {
  if (!server) {
    throw new Error('Server data is required for transformation');
  }

  return {
    id: server.id || 'unknown-id',
    name: safeServerAccess.name(server),
    hostname: safeServerAccess.hostname(server),
    type: (server as any).type || 'unknown',
    role: 'standalone' as const,
    environment: (server as any).environment || 'production',
    location: safeServerAccess.location(server),
    status:
      safeServerAccess.status(server) === 'online'
        ? 'running'
        : safeServerAccess.status(server) === 'warning'
          ? 'warning'
          : 'error',
    metrics: {
      cpu: safeServerAccess.cpu(server),
      memory: safeServerAccess.memory(server),
      disk: safeServerAccess.disk(server),
      network: {
        in: safeServerAccess.network(server),
        out: safeServerAccess.network(server) * 0.8,
      },
    },
    uptime: safeServerAccess.uptime(server),
    lastUpdate: safeServerAccess.lastUpdate(server),
    alerts: safeServerAccess.alerts(server),
    services: safeServerAccess.services(server),
    provider: (server as any).provider || 'unknown',
    networkStatus: server.networkStatus || 'good',
  };
};

/**
 * 배열이 안전한지 확인하는 함수
 */
export const isSafeArray = <T>(arr: T[] | undefined | null): arr is T[] => {
  return Array.isArray(arr) && arr.length > 0;
};

/**
 * 객체의 속성이 안전한지 확인하는 함수
 */
export const hasSafeProperty = <T, K extends keyof T>(
  obj: T | undefined | null,
  prop: K
): obj is T & Record<K, NonNullable<T[K]>> => {
  return obj != null && obj[prop] != null;
};
