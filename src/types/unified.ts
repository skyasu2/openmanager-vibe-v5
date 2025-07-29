/**
 * 🎯 OpenManager VIBE v5 - 통합 타입 정의
 *
 * 모든 타입을 중앙 집중화하여 일관성과 재사용성 확보
 * TypeScript strict 모드 완전 준수
 */

// ============================================
// 🖥️ 서버 관련 통합 타입
// ============================================

/**
 * 서버 상태 열거형
 * 모든 가능한 서버 상태를 통합
 */
export type ServerStatus =
  | 'online'
  | 'offline'
  | 'running'
  | 'stopped'
  | 'healthy'
  | 'warning'
  | 'critical'
  | 'error'
  | 'maintenance'
  | 'active'
  | 'inactive';

/**
 * 서버 스펙 정의
 */
export interface ServerSpecs {
  cpu_cores: number;
  memory_gb: number;
  disk_gb: number;
  network_speed?: string;
  cpu?: {
    cores: number;
    model?: string;
  };
  memory?: {
    total: number;
    unit?: 'GB' | 'MB';
  };
  disk?: {
    total: number;
    unit?: 'GB' | 'TB';
  };
}

/**
 * 알림 정의
 */
export interface ServerAlert {
  id: string;
  type: 'cpu' | 'memory' | 'disk' | 'network' | 'health' | 'custom';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: string;
  serverId?: string;
  resolved?: boolean;
  resolvedAt?: string;
  acknowledgedBy?: string;
}

/**
 * 서버 헬스 정보
 */
export interface ServerHealth {
  score: number;
  trend: number[];
  status: ServerStatus;
  issues?: string[];
  lastChecked?: string;
}

/**
 * 서버 메트릭 정의 (통합)
 */
export interface ServerMetrics {
  // 기본 메트릭
  cpu: number;
  memory: number;
  disk: number;
  network: number;

  // 추가 정보
  timestamp?: string;
  uptime?: number;
  id?: string;
  hostname?: string;
  environment?: string;
  role?: string;
  status?: ServerStatus;

  // 상세 메트릭
  cpu_usage?: number;
  memory_usage?: number;
  disk_usage?: number;
  network_in?: number;
  network_out?: number;
  response_time?: number;
  last_updated?: string;

  // 관련 데이터
  alerts?: ServerAlert[];
  requests?: number;
  errors?: number;
  customMetrics?: Record<string, string | number | boolean>;
}

/**
 * 통합 서버 인스턴스 정의
 */
export interface ServerInstance {
  // 필수 필드
  id: string;
  name: string;
  status: ServerStatus;

  // 메트릭
  cpu: number;
  memory: number;
  disk: number;
  network: number;

  // 시간 정보
  uptime: number;
  lastCheck: string;
  lastUpdated: string;

  // 분류 정보
  type: string;
  environment: string;
  region: string;
  version: string;
  location: string;
  provider: string;

  // 추가 정보
  tags: string[];
  alerts: number;
  health?: ServerHealth;
  specs?: ServerSpecs;

  // 요청 정보
  requests?: {
    total: number;
    success: number;
    errors: number;
    averageTime: number;
  };

  // 부가 정보
  ip?: string;
  isSSL?: boolean;
  services?: string[];
  description?: string;
  managedBy?: string;
  createdAt?: string;
  metadata?: Record<string, unknown>;
}

// ============================================
// 🔧 유틸리티 타입
// ============================================

/**
 * Null/Undefined 제거
 */
export type NonNullableFields<T> = {
  [P in keyof T]-?: NonNullable<T[P]>;
};

/**
 * 필수 필드 지정
 */
export type RequireFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

/**
 * 선택적 필드 지정
 */
export type PartialFields<T, K extends keyof T> = Omit<T, K> &
  Partial<Pick<T, K>>;

/**
 * 안전한 인덱스 접근
 */
export type SafeIndex<T> = T | undefined;

/**
 * 깊은 읽기 전용
 */
export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};

/**
 * 깊은 부분 타입
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// ============================================
// 🎯 API 응답 타입
// ============================================

/**
 * 기본 API 응답 구조
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  timestamp: string;
  requestId?: string;
}

/**
 * 페이지네이션 응답
 */
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

/**
 * 대시보드 데이터
 */
export interface DashboardData {
  servers: ServerInstance[];
  alerts: ServerAlert[];
  systemOverview: {
    totalServers: number;
    onlineServers: number;
    criticalAlerts: number;
    averageResponseTime: number;
    _systemHealth: 'excellent' | 'good' | 'warning' | 'critical';
  };
  timestamp: string;
}

// ============================================
// 🛡️ 타입 가드용 브랜드 타입
// ============================================

/**
 * 검증된 서버 ID
 */
export type ValidatedServerId = string & { readonly brand: unique symbol };

/**
 * 검증된 타임스탬프
 */
export type ValidatedTimestamp = string & { readonly brand: unique symbol };

// ============================================
// 📊 차트/시각화 타입
// ============================================

/**
 * 차트 데이터 포인트
 */
export interface ChartDataPoint {
  timestamp: string;
  value: number;
  label?: string;
  metadata?: Record<string, unknown>;
}

/**
 * 시계열 데이터
 */
export interface TimeSeriesData {
  serverId: string;
  metric: keyof ServerMetrics;
  data: ChartDataPoint[];
  aggregation?: 'avg' | 'min' | 'max' | 'sum';
}

// ============================================
// 🔄 상태 관리 타입
// ============================================

/**
 * 로딩 상태
 */
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

/**
 * 비동기 상태
 */
export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  lastFetch: string | null;
}

// ============================================
// 📝 폼/입력 타입
// ============================================

/**
 * 서버 필터 옵션
 */
export interface ServerFilterOptions {
  status?: ServerStatus[];
  environment?: string[];
  region?: string[];
  tags?: string[];
  search?: string;
}

/**
 * 정렬 옵션
 */
export interface SortOptions<T> {
  field: keyof T;
  direction: 'asc' | 'desc';
}

// Export all types from other files for backward compatibility
export type { AlertSeverity } from './common';
export type {
  ServerStatus as ServerStatusLegacy,
  ServerHealth as ServerHealthLegacy,
  ServerMetrics as ServerMetricsLegacy,
  ServerSpecs as ServerSpecsLegacy,
} from './server-common';
