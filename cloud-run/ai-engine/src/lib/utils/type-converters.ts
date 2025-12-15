/**
 * 🔄 안전한 타입 변환 유틸리티
 */

import {
  getDefaultServerEnvironment,
  getDefaultServerRole,
  getDefaultServerStatus,
  isValidServerEnvironment,
  isValidServerRole,
  isValidServerStatus,
  type ServerEnvironment,
  type ServerRole,
  type ServerStatus,
} from '../../types/server-enums';

const stringifyForLog = (value: unknown): string => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean')
    return String(value);
  try {
    return JSON.stringify(value);
  } catch {
    return '[unserializable]';
  }
};

/**
 * 🛡️ 안전한 ServerStatus 변환
 */
export function safeServerStatus(value: unknown): ServerStatus {
  const _valueString = stringifyForLog(value);
  if (typeof value === 'string' && isValidServerStatus(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const normalized = value.toLowerCase().trim();
    switch (normalized) {
      case 'healthy':
      case 'up':
      case 'active':
        return 'online';
      case 'down':
      case 'inactive':
        return 'offline';
      case 'warn':
      case 'degraded':
        return 'warning';
      case 'error':
      case 'failed':
      case 'danger':
        return 'critical';
      case 'maint':
        return 'maintenance';
      default:
        // console.warn(
        //   `[safeServerStatus] Unknown status: "${valueString}", using default`
        // );
        return getDefaultServerStatus();
    }
  }

  return getDefaultServerStatus();
}

/**
 * 🛡️ 안전한 ServerEnvironment 변환
 */
export function safeServerEnvironment(value: unknown): ServerEnvironment {
  const _valueString = stringifyForLog(value);
  if (typeof value === 'string' && isValidServerEnvironment(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const normalized = value.toLowerCase().trim();
    switch (normalized) {
      case 'prod':
      case 'live':
        return 'production';
      case 'stage':
      case 'staging':
        return 'staging';
      case 'dev':
      case 'develop':
        return 'development';
      case 'test':
      case 'testing':
        return 'testing';
      default:
        return getDefaultServerEnvironment();
    }
  }

  return getDefaultServerEnvironment();
}

/**
 * 🛡️ 안전한 ServerRole 변환
 */
export function safeServerRole(value: unknown): ServerRole {
  const _valueString = stringifyForLog(value);
  if (typeof value === 'string' && isValidServerRole(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const normalized = value
      .toLowerCase()
      .trim()
      .replace(/[-_\s]/g, '-');
    switch (normalized) {
      case 'webserver':
      case 'http':
      case 'nginx':
      case 'apache':
        return 'web';
      case 'application':
      case 'app-server':
      case 'backend':
        return 'api';
      case 'app':
      case 'service':
        return 'app';
      case 'db':
      case 'postgres':
      case 'mysql':
      case 'mongodb':
        return 'database';
      case 'redis':
      case 'memcached':
      case 'in-memory':
        return 'cache';
      case 'lb':
      case 'balancer':
      case 'haproxy':
        return 'load-balancer';
      case 'monitor':
      case 'metrics':
      case 'prometheus':
        return 'monitoring';
      case 'sec':
      case 'firewall':
      case 'auth':
        return 'security';
      case 'bk':
      case 'archive':
        return 'backup';
      case 'fs':
      case 'file':
      case 'nfs':
        return 'storage';
      case 'task':
      case 'worker':
      case 'job':
        return 'queue';
      default:
        return getDefaultServerRole();
    }
  }

  return getDefaultServerRole();
}

/**
 * 🛡️ 안전한 숫자 변환
 */
export function safeMetricValue(value: unknown, fallback: number = 0): number {
  if (
    typeof value === 'number' &&
    !Number.isNaN(value) &&
    Number.isFinite(value)
  ) {
    return Math.max(0, Math.min(100, value));
  }

  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    if (!Number.isNaN(parsed) && Number.isFinite(parsed)) {
      return Math.max(0, Math.min(100, parsed));
    }
  }

  return fallback;
}

/**
 * 🛡️ 안전한 응답시간 변환
 */
export function safeResponseTime(value: unknown, fallback: number = 0): number {
  if (
    typeof value === 'number' &&
    !Number.isNaN(value) &&
    Number.isFinite(value) &&
    value >= 0
  ) {
    return Math.min(30000, value); // 30초 최대값
  }

  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    if (!Number.isNaN(parsed) && Number.isFinite(parsed) && parsed >= 0) {
      return Math.min(30000, parsed);
    }
  }

  return fallback;
}

/**
 * 🛡️ 안전한 연결 수 변환
 */
export function safeConnections(value: unknown, fallback: number = 0): number {
  if (
    typeof value === 'number' &&
    !Number.isNaN(value) &&
    Number.isFinite(value) &&
    value >= 0
  ) {
    return Math.floor(Math.min(10000, value)); // 10k 연결 최대값
  }

  if (typeof value === 'string') {
    const parsed = parseInt(value, 10);
    if (!Number.isNaN(parsed) && parsed >= 0) {
      return Math.min(10000, parsed);
    }
  }

  return fallback;
}

/**
 * 🛡️ Raw 서버 데이터 정규화
 */
export function normalizeRawServerData(rawData: Record<string, unknown>): {
  id: string;
  name: string;
  hostname: string;
  status: ServerStatus;
  environment: ServerEnvironment;
  role: ServerRole;
  responseTime: number;
  connections: number;
  ip?: string;
  os?: string;
  cpu: number;
  memory: number;
  disk: number;
  network: number;
} {
  const toSafeString = (input: unknown, fallback: string): string => {
    const str = stringifyForLog(input);
    return str ? str : fallback;
  };

  return {
    id: toSafeString(rawData.id, 'unknown'),
    name: toSafeString(rawData.name, 'Unknown Server'),
    hostname: toSafeString(rawData.hostname || rawData.name, 'unknown'),
    status: safeServerStatus(rawData.status),
    environment: safeServerEnvironment(rawData.environment || rawData.env),
    role: safeServerRole(rawData.role || rawData.type),
    responseTime: safeResponseTime(
      rawData.responseTime || rawData.response_time
    ),
    connections: safeConnections(rawData.connections),
    ip: rawData.ip ? toSafeString(rawData.ip, '') : undefined,
    os: rawData.os ? toSafeString(rawData.os, '') : undefined,
    cpu: safeMetricValue(rawData.cpu || rawData.cpu_usage, 0),
    memory: safeMetricValue(rawData.memory || rawData.memory_usage, 0),
    disk: safeMetricValue(rawData.disk || rawData.disk_usage, 0),
    network: safeMetricValue(rawData.network || rawData.network_usage, 0),
  };
}

/**
 * 🛡️ 배치 정규화
 */
export function normalizeServerDataBatch(
  rawDataArray: unknown[]
): ReturnType<typeof normalizeRawServerData>[] {
  if (!Array.isArray(rawDataArray)) {
    console.warn(
      '[normalizeServerDataBatch] Input is not an array, returning empty array'
    );
    return [];
  }

  return rawDataArray
    .filter(
      (item): item is Record<string, unknown> =>
        typeof item === 'object' && item !== null
    )
    .map((rawData) => {
      try {
        return normalizeRawServerData(rawData);
      } catch (error) {
        console.error(
          '[normalizeServerDataBatch] Failed to normalize server data:',
          error
        );
        // 기본 서버 데이터 반환
        return normalizeRawServerData({
          id: 'error-server',
          name: 'Error Server',
          status: 'offline',
        });
      }
    });
}
