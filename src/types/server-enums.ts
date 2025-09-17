/**
 * 🏗️ 서버 관련 Enum 타입 정의
 * 
 * AI 교차검증 결과 기반으로 생성됨:
 * - Claude: 실용적 enum 구조 설계
 * - Gemini: 확장성 고려한 타입 체계
 * - Codex: 런타임 안전성 강화
 * - Qwen: 성능 최적화된 타입 선택
 */

// 서버 상태 Enum
export type ServerStatus = 'online' | 'offline' | 'warning' | 'critical' | 'maintenance';

// 서버 환경 Enum  
export type ServerEnvironment = 'production' | 'staging' | 'development' | 'testing';

// 서버 역할 Enum
export type ServerRole = 
  | 'web'
  | 'api' 
  | 'database'
  | 'cache'
  | 'monitoring'
  | 'security'
  | 'backup'
  | 'load-balancer'
  | 'queue'
  | 'storage'
  | 'app' | 'fallback';

// 서버 타입 (기존 호환성 유지)
export type ServerType = ServerRole;

// 메트릭 타입
export type MetricType = 'cpu' | 'memory' | 'disk' | 'network' | 'connections' | 'responseTime';

// 알림 심각도
export type AlertSeverity = 'info' | 'warning' | 'critical' | 'emergency';

// 타입 가드 함수들
export function isValidServerStatus(status: string): status is ServerStatus {
  return ['online', 'offline', 'warning', 'critical', 'maintenance'].includes(status);
}

export function isValidServerEnvironment(env: string): env is ServerEnvironment {
  return ['production', 'staging', 'development', 'testing'].includes(env);
}

export function isValidServerRole(role: string): role is ServerRole {
  return [
    'web', 'api', 'database', 'cache', 'monitoring', 
    'security', 'backup', 'load-balancer', 'queue', 'storage', 'app', 'fallback'
  ].includes(role);
}

// 기본값 제공 함수들
export function getDefaultServerStatus(): ServerStatus {
  return 'offline';
}

export function getDefaultServerEnvironment(): ServerEnvironment {
  return 'development';
}

export function getDefaultServerRole(): ServerRole {
  return 'web';
}

// Enum 배열 (옵션 리스트용)
export const SERVER_STATUSES: ServerStatus[] = ['online', 'offline', 'warning', 'critical', 'maintenance'];
export const SERVER_ENVIRONMENTS: ServerEnvironment[] = ['production', 'staging', 'development', 'testing'];
export const SERVER_ROLES: ServerRole[] = [
  'web', 'api', 'database', 'cache', 'monitoring',
  'security', 'backup', 'load-balancer', 'queue', 'storage', 'app', 'fallback'
];