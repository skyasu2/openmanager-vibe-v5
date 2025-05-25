/**
 * Shared Types
 * 
 * 🔧 모든 모듈에서 공통으로 사용하는 타입 정의
 */

export interface BaseConfig {
  version: string;
  name: string;
  enabled: boolean;
  debug?: boolean;
}

export interface ModuleInfo {
  name: string;
  version: string;
  description: string;
  author: string;
  dependencies: string[];
  isInitialized: boolean;
}

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
  requestId?: string;
}

export interface ErrorInfo {
  code: string;
  message: string;
  details?: Record<string, any>;
  timestamp: string;
  stack?: string;
}

export interface LogEntry {
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  timestamp: string;
  module: string;
  data?: Record<string, any>;
}

export interface HealthCheck {
  status: 'healthy' | 'degraded' | 'unhealthy';
  checks: Record<string, boolean>;
  timestamp: string;
  uptime: number;
}

export type EventHandler<T = any> = (data: T) => void | Promise<void>;

export interface EventEmitter {
  on<T>(event: string, handler: EventHandler<T>): void;
  off<T>(event: string, handler: EventHandler<T>): void;
  emit<T>(event: string, data: T): void;
} 