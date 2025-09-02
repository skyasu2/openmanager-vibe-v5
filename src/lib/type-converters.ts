/**
 * 🔄 안전한 타입 변환 유틸리티
 * 
 * AI 교차검증 기반으로 생성됨 (8.3/10 합의):
 * - Claude: 실용적 변환 패턴 설계
 * - Gemini: 런타임 안전성 강화  
 * - Codex: 에러 처리 및 폴백 로직
 * - Qwen: 성능 최적화된 타입 체크
 */

import { 
  type ServerStatus,
  type ServerEnvironment, 
  type ServerRole,
  isValidServerStatus,
  isValidServerEnvironment,
  isValidServerRole,
  getDefaultServerStatus,
  getDefaultServerEnvironment,
  getDefaultServerRole,
} from '@/types/server-enums';

/**
 * 🛡️ 안전한 ServerStatus 변환
 * string → ServerStatus로 안전하게 변환, 유효하지 않으면 기본값 반환
 */
export function safeServerStatus(value: unknown): ServerStatus {
  if (typeof value === 'string' && isValidServerStatus(value)) {
    return value;
  }
  
  // 일반적인 변환 패턴들
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
        console.warn(`[safeServerStatus] Unknown status: "${value}", using default`);
        return getDefaultServerStatus();
    }
  }
  
  console.warn(`[safeServerStatus] Invalid type: ${typeof value}, using default`);
  return getDefaultServerStatus();
}

/**
 * 🛡️ 안전한 ServerEnvironment 변환  
 * string → ServerEnvironment로 안전하게 변환, 유효하지 않으면 기본값 반환
 */
export function safeServerEnvironment(value: unknown): ServerEnvironment {
  if (typeof value === 'string' && isValidServerEnvironment(value)) {
    return value;
  }
  
  // 일반적인 변환 패턴들
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
        console.warn(`[safeServerEnvironment] Unknown environment: "${value}", using default`);
        return getDefaultServerEnvironment();
    }
  }
  
  console.warn(`[safeServerEnvironment] Invalid type: ${typeof value}, using default`);
  return getDefaultServerEnvironment();
}

/**
 * 🛡️ 안전한 ServerRole 변환
 * string → ServerRole로 안전하게 변환, 유효하지 않으면 기본값 반환
 */
export function safeServerRole(value: unknown): ServerRole {
  if (typeof value === 'string' && isValidServerRole(value)) {
    return value;
  }
  
  // 일반적인 변환 패턴들
  if (typeof value === 'string') {
    const normalized = value.toLowerCase().trim().replace(/[-_\s]/g, '-');
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
        console.warn(`[safeServerRole] Unknown role: "${value}", using default`);
        return getDefaultServerRole();
    }
  }
  
  console.warn(`[safeServerRole] Invalid type: ${typeof value}, using default`);
  return getDefaultServerRole();
}

/**
 * 🛡️ 안전한 숫자 변환
 * 유효하지 않은 숫자를 안전하게 처리 (0-100 범위 강제)
 */
export function safeMetricValue(value: unknown, fallback: number = 0): number {
  if (typeof value === 'number' && !isNaN(value) && isFinite(value)) {
    return Math.max(0, Math.min(100, value));
  }
  
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    if (!isNaN(parsed) && isFinite(parsed)) {
      return Math.max(0, Math.min(100, parsed));
    }
  }
  
  return fallback;
}

/**
 * 🛡️ 안전한 응답시간 변환
 * responseTime을 ms 단위로 정규화
 */
export function safeResponseTime(value: unknown, fallback: number = 0): number {
  if (typeof value === 'number' && !isNaN(value) && isFinite(value) && value >= 0) {
    return Math.min(30000, value); // 30초 최대값
  }
  
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    if (!isNaN(parsed) && isFinite(parsed) && parsed >= 0) {
      return Math.min(30000, parsed);
    }
  }
  
  return fallback;
}

/**
 * 🛡️ 안전한 연결 수 변환
 * connections를 양의 정수로 정규화
 */
export function safeConnections(value: unknown, fallback: number = 0): number {
  if (typeof value === 'number' && !isNaN(value) && isFinite(value) && value >= 0) {
    return Math.floor(Math.min(10000, value)); // 10k 연결 최대값
  }
  
  if (typeof value === 'string') {
    const parsed = parseInt(value, 10);
    if (!isNaN(parsed) && parsed >= 0) {
      return Math.min(10000, parsed);
    }
  }
  
  return fallback;
}

/**
 * 🛡️ Raw 서버 데이터 정규화
 * API에서 받은 원시 데이터를 타입 안전하게 변환
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
  return {
    id: String(rawData.id || 'unknown'),
    name: String(rawData.name || 'Unknown Server'),
    hostname: String(rawData.hostname || rawData.name || 'unknown'),
    status: safeServerStatus(rawData.status),
    environment: safeServerEnvironment(rawData.environment || rawData.env),
    role: safeServerRole(rawData.role || rawData.type),
    responseTime: safeResponseTime(rawData.responseTime || rawData.response_time),
    connections: safeConnections(rawData.connections),
    ip: rawData.ip ? String(rawData.ip) : undefined,
    os: rawData.os ? String(rawData.os) : undefined,
    cpu: safeMetricValue(rawData.cpu || rawData.cpu_usage, 0),
    memory: safeMetricValue(rawData.memory || rawData.memory_usage, 0),
    disk: safeMetricValue(rawData.disk || rawData.disk_usage, 0),
    network: safeMetricValue(rawData.network || rawData.network_usage, 0),
  };
}

/**
 * 🛡️ 배치 정규화
 * 서버 데이터 배열을 일괄 정규화
 */
export function normalizeServerDataBatch(rawDataArray: unknown[]): ReturnType<typeof normalizeRawServerData>[] {
  if (!Array.isArray(rawDataArray)) {
    console.warn('[normalizeServerDataBatch] Input is not an array, returning empty array');
    return [];
  }
  
  return rawDataArray
    .filter((item): item is Record<string, unknown> => 
      typeof item === 'object' && item !== null
    )
    .map(rawData => {
      try {
        return normalizeRawServerData(rawData);
      } catch (error) {
        console.error('[normalizeServerDataBatch] Failed to normalize server data:', error);
        // 기본 서버 데이터 반환
        return normalizeRawServerData({
          id: 'error-server',
          name: 'Error Server',
          status: 'offline'
        });
      }
    });
}

// 타입 변환 테스트 유틸리티 (개발용)
export const TypeConverterTests = {
  testServerStatus: () => {
    console.log('Testing ServerStatus conversions:');
    console.log('  "online" →', safeServerStatus('online'));
    console.log('  "healthy" →', safeServerStatus('healthy'));  
    console.log('  "invalid" →', safeServerStatus('invalid'));
    console.log('  123 →', safeServerStatus(123));
  },
  
  testServerRole: () => {
    console.log('Testing ServerRole conversions:');
    console.log('  "web" →', safeServerRole('web'));
    console.log('  "webserver" →', safeServerRole('webserver'));
    console.log('  "postgres" →', safeServerRole('postgres'));
    console.log('  "invalid" →', safeServerRole('invalid'));
  },
  
  testNormalization: () => {
    const testData = {
      id: 'test-01',
      name: 'Test Server',
      status: 'healthy',
      role: 'webserver',
      cpu: '75.5',
      memory: 80,
      responseTime: '125.6'
    };
    console.log('Testing normalization:', normalizeRawServerData(testData));
  }
};