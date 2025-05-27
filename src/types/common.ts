/**
 * 🔧 Common Types
 * 
 * 프로젝트 전체에서 공통으로 사용되는 타입 정의
 * - 중복 제거를 위한 기본 타입들
 * - 확장 가능한 인터페이스 구조
 */

// 기본 서비스 상태 타입
export type ServiceStatus = 
  | 'running' 
  | 'stopped' 
  | 'failed' 
  | 'starting' 
  | 'stopping' 
  | 'error' 
  | 'unknown';

// 서버 상태 타입
export type ServerStatus = 
  | 'healthy' 
  | 'warning' 
  | 'critical' 
  | 'offline' 
  | 'maintenance';

// 알림 심각도 타입
export type AlertSeverity = 
  | 'info' 
  | 'warning' 
  | 'critical';

// 환경 타입
export type Environment = 
  | 'production' 
  | 'staging' 
  | 'development' 
  | 'test';

// 서버 타입
export type ServerType = 
  | 'web' 
  | 'database' 
  | 'api' 
  | 'cache' 
  | 'storage' 
  | 'gateway' 
  | 'worker' 
  | 'monitoring'
  | 'mail'
  | 'proxy'
  | 'kubernetes'
  | 'analytics'
  | 'ci_cd'
  | 'security';

// 클라우드 제공자 타입
export type CloudProvider = 
  | 'aws' 
  | 'gcp' 
  | 'azure' 
  | 'onpremise' 
  | 'kubernetes';

// 기본 서비스 인터페이스
export interface BaseService {
  name: string;
  status: ServiceStatus;
  port?: number;
  description?: string;
}

// 확장된 서비스 인터페이스
export interface ExtendedService extends BaseService {
  pid?: number;
  memory?: number;
  cpu?: number;
  restartCount?: number;
  uptime?: number;
  version?: string;
}

// 기본 메트릭 인터페이스
export interface BaseMetrics {
  timestamp: Date;
  cpu_usage: number;
  memory_usage: number;
  disk_usage: number;
  network_in: number;
  network_out: number;
}

// 서버 메트릭 인터페이스
export interface ServerMetrics extends BaseMetrics {
  id?: string;
  server_id: string;
  response_time: number;
  active_connections: number;
  status: ServerStatus;
  alerts: string[];
}

// 기본 알림 인터페이스
export interface BaseAlert {
  id: string;
  timestamp: Date;
  severity: AlertSeverity;
  message: string;
  acknowledged: boolean;
  resolved: boolean;
}

// 서버 알림 인터페이스
export interface ServerAlert extends BaseAlert {
  server_id: string;
  hostname: string;
  metric?: string;
  value?: number;
  threshold?: number;
}

// 기본 서버 정보 인터페이스
export interface BaseServer {
  id: string;
  hostname: string;
  name: string;
  type: ServerType;
  environment: Environment;
  status: ServerStatus;
  created_at: Date;
}

// 확장된 서버 정보 인터페이스
export interface ExtendedServer extends BaseServer {
  location?: string;
  provider?: CloudProvider;
  specs?: {
    cpu_cores: number;
    memory_gb: number;
    disk_gb: number;
  };
  tags?: string[];
  metadata?: Record<string, any>;
}

// API 응답 기본 구조
export interface BaseApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    timestamp: string;
    requestId?: string;
    version?: string;
  };
}

// 페이지네이션 정보
export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// 페이지네이션된 응답
export interface PaginatedResponse<T> extends BaseApiResponse<T[]> {
  pagination: PaginationInfo;
}

// 시간 범위 인터페이스
export interface TimeRange {
  start: Date;
  end: Date;
}

// 필터 옵션 인터페이스
export interface FilterOptions {
  serverTypes?: ServerType[];
  environments?: Environment[];
  statuses?: ServerStatus[];
  timeRange?: TimeRange;
  search?: string;
}

// 정렬 옵션 인터페이스
export interface SortOptions {
  field: string;
  direction: 'asc' | 'desc';
}

// 쿼리 옵션 인터페이스
export interface QueryOptions {
  filters?: FilterOptions;
  sort?: SortOptions;
  pagination?: {
    page: number;
    limit: number;
  };
}

// 시스템 상태 인터페이스
export interface SystemStatus {
  totalServers: number;
  healthyServers: number;
  warningServers: number;
  criticalServers: number;
  offlineServers: number;
  averageCpu: number;
  averageMemory: number;
  isGenerating?: boolean;
}

// 로그 레벨 타입
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

// 로그 엔트리 인터페이스
export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  module: string;
  data?: Record<string, any>;
}

// 설정 인터페이스
export interface BaseConfig {
  name: string;
  version: string;
  environment: Environment;
  debug: boolean;
}

// 에러 정보 인터페이스
export interface ErrorInfo {
  code: string;
  message: string;
  stack?: string;
  context?: Record<string, any>;
  timestamp: Date;
}

// 헬스체크 결과 인터페이스
export interface HealthCheckResult {
  status: 'healthy' | 'unhealthy' | 'degraded';
  checks: {
    [key: string]: {
      status: 'pass' | 'fail' | 'warn';
      message?: string;
      duration?: number;
    };
  };
  timestamp: Date;
}

// 유틸리티 타입들
export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// ID 생성 함수 타입
export type IdGenerator = () => string;

// 이벤트 핸들러 타입
export type EventHandler<T = any> = (data: T) => void | Promise<void>;

// 비동기 함수 타입
export type AsyncFunction<T = any, R = any> = (data: T) => Promise<R>; 