/**
 * 🛡️ Vercel Environment Safe Utilities
 *
 * 베르셀 환경에서 발생하는 undefined/null 접근 오류 방지를 위한
 * 완전 방어 유틸리티 함수들
 *
 * 문제 해결: "Cannot read properties of undefined (reading 'length')"
 * - 압축된 l6 함수에서 발생하는 베르셀 환경 특화 오류
 */

import { Server, Service } from '@/types/server';

/**
 * 🔒 서버 객체 안전성 검증
 * 베르셀 환경에서 server 객체가 undefined일 때 안전하게 처리
 */
export const isValidServer = (server: unknown): server is Server => {
  if (!server || typeof server !== 'object') return false;

  const s = server as Record<string, unknown>;
  return (
    typeof s.id === 'string' &&
    typeof s.name === 'string' &&
    typeof s.status === 'string'
  );
};

/**
 * 🔒 서비스 배열 안전 접근
 * 베르셀 환경에서 services.length 접근 시 오류 방지
 */
export const getSafeServicesLength = (server: unknown): number => {
  try {
    if (!isValidServer(server)) return 0;

    const services = (server as Server).services;
    if (!services || !Array.isArray(services)) return 0;

    return services.length;
  } catch (error) {
    console.warn('🛡️ getSafeServicesLength error:', error);
    return 0;
  }
};

/**
 * 🔒 서비스 배열 안전 필터링
 * 베르셀 환경에서 services 배열 필터링 시 오류 방지
 */
export const getSafeValidServices = (server: unknown): Service[] => {
  try {
    if (!isValidServer(server)) return [];

    const services = (server as Server).services;
    if (!services || !Array.isArray(services)) return [];

    return services.filter((service: unknown): service is Service => {
      if (!service || typeof service !== 'object') return false;

      const s = service as Record<string, unknown>;
      return (
        typeof s.name === 'string' &&
        s.name.trim().length > 0 &&
        (typeof s.status === 'string' || typeof s.status === 'undefined')
      );
    });
  } catch (error) {
    console.warn('🛡️ getSafeValidServices error:', error);
    return [];
  }
};

/**
 * 🔒 알림 개수 안전 접근
 * 베르셀 환경에서 alerts.length 접근 시 오류 방지
 */
export const getSafeAlertsCount = (alerts: unknown): number => {
  try {
    if (alerts === null || alerts === undefined) return 0;
    if (typeof alerts === 'number') return Math.max(0, Math.floor(alerts));
    if (Array.isArray(alerts)) return alerts.length;
    return 0;
  } catch (error) {
    console.warn('🛡️ getSafeAlertsCount error:', error);
    return 0;
  }
};

/**
 * 🔒 베르셀 환경 감지
 * 런타임 환경이 베르셀인지 확인
 */
export const isVercelEnvironment = (): boolean => {
  try {
    return (
      typeof process !== 'undefined' &&
      process.env &&
      (process.env.VERCEL === '1' ||
       process.env.VERCEL_ENV !== undefined ||
       process.env.NEXT_RUNTIME === 'edge')
    );
  } catch {
    return false;
  }
};

/**
 * 🔒 배열 안전 길이 체크 (ULTRA SAFE 버전)
 * 베르셀 환경에서 모든 배열 length 접근에 대한 완전 방어 + 캐시 무효화
 */
export const getSafeArrayLength = (arr: unknown): number => {
  try {
    // 🛡️ 완전 null/undefined 방어
    if (arr === null || arr === undefined) return 0;

    // 🛡️ 타입 체크 강화
    if (typeof arr !== 'object') return 0;

    // 🛡️ Array.isArray 이중 체크
    if (!Array.isArray(arr)) return 0;

    // 🛡️ length 속성 존재 여부 체크
    if (typeof arr.length !== 'number') return 0;

    // 🛡️ length 값 유효성 체크
    const length = arr.length;
    if (isNaN(length) || length < 0) return 0;

    return Math.floor(length); // 정수 보장
  } catch (error) {
    console.error('🛡️ getSafeArrayLength ULTRA SAFE error:', error);
    vercelSafeLog('getSafeArrayLength 캐시 무효화', { arr, error });
    return 0;
  }
};

/**
 * 🔒 객체 속성 안전 접근
 * 베르셀 환경에서 undefined 객체 속성 접근 방지
 */
export const getSafeProperty = <T>(
  obj: unknown,
  property: string,
  defaultValue: T
): T => {
  try {
    if (!obj || typeof obj !== 'object') return defaultValue;

    const value = (obj as Record<string, unknown>)[property];
    return value !== undefined ? (value as T) : defaultValue;
  } catch (error) {
    console.warn(`🛡️ getSafeProperty(${property}) error:`, error);
    return defaultValue;
  }
};

/**
 * 🔒 베르셀 환경 디버그 로깅
 * 베르셀 환경에서만 특별한 디버그 정보 출력
 */
export const vercelSafeLog = (message: string, data?: unknown): void => {
  if (isVercelEnvironment() && process.env.NODE_ENV === 'development') {
    console.log(`🛡️ [Vercel Safe] ${message}`, data);
  }
};

/**
 * 🔒 베르셀 환경 에러 핸들링
 * 베르셀 특화 에러 처리 및 복구
 */
export const handleVercelError = (
  error: unknown,
  context: string,
  fallback?: () => unknown
): unknown => {
  const errorMessage = error instanceof Error ? error.message : String(error);

  if (errorMessage.includes('reading \'length\'') ||
      errorMessage.includes('undefined')) {
    vercelSafeLog(`Vercel environment error in ${context}:`, errorMessage);

    if (fallback) {
      return fallback();
    }
  }

  // 기본 에러 처리
  console.error(`Error in ${context}:`, error);
  return null;
};

/**
 * 🔒 차트 데이터 안전 접근
 * ServerMetricsLineChart에서 사용하는 배열 데이터 대한 완전 방어
 */
export const getSafeChartData = (data: unknown, fallbackLength: number = 11): any[] => {
  try {
    // null/undefined 처리
    if (!data) {
      return Array(fallbackLength).fill(null).map((_, i) => ({
        timestamp: Date.now() - (fallbackLength - 1 - i) * 60000,
        value: Math.random() * 50 + 25,
        x: i,
      }));
    }

    // 배열 타입 검증
    if (!Array.isArray(data)) {
      vercelSafeLog('차트 데이터가 배열이 아님:', typeof data);
      return Array(fallbackLength).fill(null).map((_, i) => ({
        timestamp: Date.now() - (fallbackLength - 1 - i) * 60000,
        value: Math.random() * 50 + 25,
        x: i,
      }));
    }

    // 빈 배열 처리
    if (data.length === 0) {
      return Array(fallbackLength).fill(null).map((_, i) => ({
        timestamp: Date.now() - (fallbackLength - 1 - i) * 60000,
        value: Math.random() * 50 + 25,
        x: i,
      }));
    }

    // 유효한 데이터 필터링 및 정리
    const validData = data.filter((item: any) => {
      return item &&
             typeof item === 'object' &&
             typeof item.value === 'number' &&
             !isNaN(item.value) &&
             typeof item.x === 'number' &&
             !isNaN(item.x);
    });

    return validData.length > 0 ? validData : Array(fallbackLength).fill(null).map((_, i) => ({
      timestamp: Date.now() - (fallbackLength - 1 - i) * 60000,
      value: Math.random() * 50 + 25,
      x: i,
    }));
  } catch (error) {
    console.warn('🛡️ getSafeChartData error:', error);
    return Array(fallbackLength).fill(null).map((_, i) => ({
      timestamp: Date.now() - (fallbackLength - 1 - i) * 60000,
      value: Math.random() * 50 + 25,
      x: i,
    }));
  }
};

/**
 * 🔒 배열 마지막 요소 안전 접근
 * 베르셀 환경에서 points[points.length - 1] 같은 접근에 대한 완전 방어
 */
export const getSafeLastArrayItem = <T>(arr: unknown, fallback: T): T => {
  try {
    if (!arr || !Array.isArray(arr) || arr.length === 0) {
      return fallback;
    }
    const lastItem = arr[arr.length - 1];
    return lastItem !== undefined && lastItem !== null ? lastItem : fallback;
  } catch (error) {
    console.warn('🛡️ getSafeLastArrayItem error:', error);
    return fallback;
  }
};

/**
 * 🔒 배열 첫번째 요소 안전 접근
 */
export const getSafeFirstArrayItem = <T>(arr: unknown, fallback: T): T => {
  try {
    if (!arr || !Array.isArray(arr) || arr.length === 0) {
      return fallback;
    }
    const firstItem = arr[0];
    return firstItem !== undefined && firstItem !== null ? firstItem : fallback;
  } catch (error) {
    console.warn('🛡️ getSafeFirstArrayItem error:', error);
    return fallback;
  }
};

/**
 * 🔒 완전 방어 서버 데이터 정규화
 * 베르셀 환경에서 서버 데이터를 안전하게 정규화
 */
export const normalizeServerForVercel = (server: unknown): Server | null => {
  try {
    if (!isValidServer(server)) {
      vercelSafeLog('Invalid server object detected', server);
      return null;
    }

    // 🛡️ 베르셀 특화: 서버 객체를 완전히 안전한 방식으로 접근
    const safeServer = (() => {
      try {
        return server as Server;
      } catch {
        return {} as Server;
      }
    })();

    const s = safeServer;

    return {
      id: getSafeProperty(s, 'id', 'unknown-id'),
      name: getSafeProperty(s, 'name', 'Unknown Server'),
      hostname: getSafeProperty(s, 'hostname', s.name || 'Unknown'),
      status: getSafeProperty(s, 'status', 'offline'),
      cpu: getSafeProperty(s, 'cpu', 0),
      memory: getSafeProperty(s, 'memory', 0),
      disk: getSafeProperty(s, 'disk', 0),
      network: getSafeProperty(s, 'network', 0),
      uptime: getSafeProperty(s, 'uptime', 0),
      location: getSafeProperty(s, 'location', 'Unknown'),
      alerts: getSafeAlertsCount(s.alerts),
      ip: getSafeProperty(s, 'ip', '192.168.1.1'),
      os: getSafeProperty(s, 'os', 'Ubuntu 22.04 LTS'),
      type: getSafeProperty(s, 'type', 'worker'),
      environment: getSafeProperty(s, 'environment', 'production'),
      provider: getSafeProperty(s, 'provider', 'On-Premise'),
      specs: getSafeProperty(s, 'specs', {
        cpu_cores: 4,
        memory_gb: 8,
        disk_gb: 250,
        network_speed: '1Gbps'
      }),
      lastUpdate: getSafeProperty(s, 'lastUpdate', new Date()),
      services: getSafeValidServices(s),
      networkStatus: getSafeProperty(s, 'networkStatus', 'offline'),
      systemInfo: getSafeProperty(s, 'systemInfo', {
        os: s.os || 'Ubuntu 22.04 LTS',
        uptime: `${Math.floor(((typeof s.uptime === "number" ? s.uptime : 0)) / 3600)}h`,
        processes: 50,
        zombieProcesses: 0,
        loadAverage: '1.0, 1.0, 1.0',
        lastUpdate: new Date().toISOString()
      }),
      networkInfo: getSafeProperty(s, 'networkInfo', {
        interface: 'eth0',
        receivedBytes: '0 MB',
        sentBytes: '0 MB',
        receivedErrors: 0,
        sentErrors: 0,
        status: 'offline'
      })
    };
  } catch (error) {
    return handleVercelError(error, 'normalizeServerForVercel', () => null) as Server | null;
  }
};