/**
 * 🎯 Error Handling Types
 *
 * 에러 처리 시스템의 모든 타입 정의
 * - ServiceError 인터페이스
 * - 에러 핸들러 타입들
 * - 복구 설정 타입들
 * - 모니터링 타입들
 */

import type { ILogger } from '@/interfaces/services';

export interface ServiceError extends Error {
  code: string;
  service: string;
  context?: Record<string, any>;
  cause?: Error;
  timestamp?: Date;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  retry?: boolean;
  recoverable?: boolean;
}

export interface IErrorHandler {
  handle(error: ServiceError): void;
  register(errorType: string, handler: (error: ServiceError) => void): void;
  unregister(errorType: string): void;
  getErrorHistory(limit?: number): ServiceError[];
  clearErrorHistory(): void;
}

export interface ErrorStats {
  total: number;
  byService: Record<string, number>;
  byCode: Record<string, number>;
  recentCritical: ServiceError[];
  errorRate: number;
}

export interface RecoveryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffFactor: number;
  timeout: number;
}

export interface CircuitBreakerConfig {
  failureThreshold: number;
  timeout: number;
  retryAfter: number;
}

export interface ServiceHealthStatus {
  isHealthy: boolean;
  responseTime: number;
  statusCode?: number;
  error?: string;
  lastChecked?: Date;
}

export interface ServiceDependencyStatus {
  healthy: string[];
  failed: string[];
  lastChecked: Date;
}

export interface WebSocketHealthStatus {
  isConnected: boolean;
  lastHeartbeat?: Date;
  reconnectAttempts: number;
}

export interface FileSystemHealth {
  totalSpace: number;
  freeSpace: number;
  usagePercent: number;
  issues: string[];
}

export interface ExternalService {
  name: string;
  url?: string;
  critical: boolean;
}

export interface RecoveryResult {
  success: boolean;
  attempts: number;
  fallbackUrl?: string;
  error?: string;
}

export interface ErrorHandlerFunction {
  (error: ServiceError): void | Promise<void>;
}

export interface MonitoringEvent {
  type: 'error' | 'recovery' | 'fallback' | 'critical';
  data: Record<string, any>;
  timestamp: Date;
}

export interface EmergencyModeConfig {
  disableNonCritical: boolean;
  enableLogging: boolean;
  notifyAdmins: boolean;
  fallbackTimeout: number;
}

export interface GracefulDegradationConfig {
  reduceQuality: boolean;
  disableFeatures: string[];
  enablePolling: boolean;
  pollInterval: number;
}

export type ErrorType =
  | 'NETWORK_ERROR'
  | 'DATABASE_ERROR'
  | 'AUTH_ERROR'
  | 'PERMISSION_ERROR'
  | 'VALIDATION_ERROR'
  | 'CONFIG_ERROR'
  | 'TIMEOUT_ERROR'
  | 'AI_AGENT_ERROR'
  | 'MEMORY_EXHAUSTED'
  | 'DISK_FULL'
  | 'REDIS_CONNECTION_ERROR'
  | 'PROMETHEUS_ERROR'
  | 'SYSTEM_OVERLOAD'
  | 'EXTERNAL_API_ERROR'
  | 'WEBSOCKET_ERROR'
  | 'FILESYSTEM_ERROR'
  | 'SECURITY_BREACH'
  | 'RATE_LIMIT_ERROR'
  | 'SERVICE_DEPENDENCY_ERROR';

export interface ErrorHandlingConfig {
  maxHistorySize: number;
  enableLogging: boolean;
  enableMonitoring: boolean;
  enableRecovery: boolean;
  criticalThreshold: number;
  defaultTimeout: number;
  logger?: ILogger;
}

/**
 * 🔧 에러 처리 타입 정의
 */

export interface RecoveryStrategy {
  canRecover(error: ServiceError): boolean;
  recover(error: ServiceError): Promise<boolean>;
}

export interface SystemHealthStatus {
  healthy: string[];
  failed: string[];
  critical: string[];
  warnings: string[];
}

export interface NetworkHealthStatus {
  isConnected: boolean;
  latency: number;
  failures: number;
  lastCheck: Date;
}

export interface ExternalAPIHealthStatus {
  isHealthy: boolean;
  responseTime: number;
  statusCode?: number;
  error?: string;
}

export interface ErrorStatistics {
  total: number;
  byService: Record<string, number>;
  byCode: Record<string, number>;
  recentCritical: ServiceError[];
  errorRate: number;
}

export interface ServiceDependency {
  name: string;
  url?: string;
  critical: boolean;
  healthCheckInterval?: number;
}

/**
 * 에러 코드 상수
 */
export const ERROR_CODES = {
  // 시스템 에러
  SYSTEM_FAILURE: 'SYSTEM_FAILURE',
  MEMORY_EXHAUSTED: 'MEMORY_EXHAUSTED',
  DISK_FULL: 'DISK_FULL',
  SYSTEM_OVERLOAD: 'SYSTEM_OVERLOAD',

  // 네트워크 에러
  NETWORK_ERROR: 'NETWORK_ERROR',
  CONNECTION_TIMEOUT: 'CONNECTION_TIMEOUT',
  DNS_RESOLUTION_FAILED: 'DNS_RESOLUTION_FAILED',
  WEBSOCKET_ERROR: 'WEBSOCKET_ERROR',

  // 데이터베이스 에러
  DATABASE_ERROR: 'DATABASE_ERROR',
  DATABASE_CONNECTION_LOST: 'DATABASE_CONNECTION_LOST',
  QUERY_TIMEOUT: 'QUERY_TIMEOUT',
  CONSTRAINT_VIOLATION: 'CONSTRAINT_VIOLATION',
  REDIS_CONNECTION_ERROR: 'REDIS_CONNECTION_ERROR',

  // 인증/권한 에러
  AUTH_ERROR: 'AUTH_ERROR',
  PERMISSION_ERROR: 'PERMISSION_ERROR',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',

  // 검증 에러
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',

  // 설정 에러
  CONFIG_ERROR: 'CONFIG_ERROR',
  MISSING_CONFIG: 'MISSING_CONFIG',
  INVALID_CONFIG: 'INVALID_CONFIG',

  // 비즈니스 로직 에러
  BUSINESS_RULE_VIOLATION: 'BUSINESS_RULE_VIOLATION',
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
  RESOURCE_ALREADY_EXISTS: 'RESOURCE_ALREADY_EXISTS',

  // 외부 서비스 에러
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
  EXTERNAL_API_ERROR: 'EXTERNAL_API_ERROR',
  API_RATE_LIMIT_EXCEEDED: 'API_RATE_LIMIT_EXCEEDED',
  THIRD_PARTY_SERVICE_DOWN: 'THIRD_PARTY_SERVICE_DOWN',

  // 타임아웃 에러
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  OPERATION_TIMEOUT: 'OPERATION_TIMEOUT',
  REQUEST_TIMEOUT: 'REQUEST_TIMEOUT',

  // 보안 에러
  SECURITY_BREACH: 'SECURITY_BREACH',
  SUSPICIOUS_ACTIVITY: 'SUSPICIOUS_ACTIVITY',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',

  // AI 관련 에러
  AI_AGENT_ERROR: 'AI_AGENT_ERROR',
  AI_MODEL_ERROR: 'AI_MODEL_ERROR',
  AI_CONTEXT_ERROR: 'AI_CONTEXT_ERROR',

  // 모니터링 에러
  PROMETHEUS_ERROR: 'PROMETHEUS_ERROR',
  METRICS_ERROR: 'METRICS_ERROR',
  MONITORING_ERROR: 'MONITORING_ERROR',

  // 파일 시스템 에러
  FILESYSTEM_ERROR: 'FILESYSTEM_ERROR',
  FILE_NOT_FOUND: 'FILE_NOT_FOUND',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  DISK_SPACE_LOW: 'DISK_SPACE_LOW',
} as const;

export type ErrorCode = keyof typeof ERROR_CODES;

/**
 * 심각도 레벨
 */
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

/**
 * 복구 전략 타입
 */
export enum RecoveryType {
  RETRY = 'retry',
  FALLBACK = 'fallback',
  CIRCUIT_BREAKER = 'circuit_breaker',
  GRACEFUL_DEGRADATION = 'graceful_degradation',
  EMERGENCY_MODE = 'emergency_mode',
}

/**
 * 서비스 에러 생성 헬퍼
 */
export function createServiceError(
  code: string,
  message: string,
  service: string,
  context?: Record<string, any>,
  cause?: Error
): ServiceError {
  const error = new Error(message) as ServiceError;
  error.name = 'ServiceError';
  error.code = code;
  error.service = service;
  error.timestamp = new Date();
  error.context = context;
  error.cause = cause;
  error.severity = 'medium';
  error.retry = true;
  error.recoverable = true;
  return error;
}

/**
 * 에러 심각도 판단
 */
export function getErrorSeverity(error: ServiceError): ErrorSeverity {
  const criticalErrors = [
    ERROR_CODES.SYSTEM_FAILURE,
    ERROR_CODES.SECURITY_BREACH,
    ERROR_CODES.MEMORY_EXHAUSTED,
    ERROR_CODES.DISK_FULL,
  ];

  const highErrors = [
    ERROR_CODES.DATABASE_ERROR,
    ERROR_CODES.AI_AGENT_ERROR,
    ERROR_CODES.EXTERNAL_SERVICE_ERROR,
  ];

  const mediumErrors = [
    ERROR_CODES.NETWORK_ERROR,
    ERROR_CODES.AUTH_ERROR,
    ERROR_CODES.TIMEOUT_ERROR,
  ];

  if (criticalErrors.includes(error.code as any)) {
    return ErrorSeverity.CRITICAL;
  }

  if (highErrors.includes(error.code as any)) {
    return ErrorSeverity.HIGH;
  }

  if (mediumErrors.includes(error.code as any)) {
    return ErrorSeverity.MEDIUM;
  }

  return ErrorSeverity.LOW;
}
