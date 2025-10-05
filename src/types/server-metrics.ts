/**
 * Server Metrics Type Definitions
 *
 * 서버 메트릭 시스템의 모든 타입 정의를 중앙 관리
 * - 서버 데이터 구조
 * - 이벤트 및 시나리오 타입
 * - 성능 및 캐싱 관련 타입
 */

// ==========================================
// 서버 데이터 구조
// ==========================================

/**
 * 원시 서버 데이터 (JSON 파일 기반)
 */
export interface RawServerData {
  id: string;
  name: string;
  hostname: string;
  status: "warning" | "critical" | "online";
  type: string;
  service: string;
  location: string;
  environment: string;
  provider: string;
  uptime: number;
  cpu: number;
  memory: number;
  disk: number;
  network: number;
  specs: {
    cpu_cores: number;
    memory_gb: number;
    disk_gb: number;
  };
  // 선택적 속성
  responseTime?: number;
  connections?: number;
  ip?: string;
  os?: string;
  role?: string;
  processes?: number;
  services?: any[];
  events?: string[];
  trend?: 'stable' | 'increasing' | 'decreasing';
}

/**
 * 서버 메트릭 (핵심 모니터링 데이터)
 */
export interface ServerMetrics {
  name: string;
  cpu: number;
  memory: number;
  disk: number;
  network?: number;
  uptime: number;
  status: 'online' | 'offline' | 'warning' | 'critical';
}

/**
 * 시간별 서버 데이터 (JSON 파일 구조)
 */
export interface HourlyServerData {
  servers: Record<string, RawServerData>;
  scenario?: string;
  summary?: {
    total: number;
    online: number;
    warning: number;
    critical: number;
  };
}

// ==========================================
// 이벤트 및 시나리오
// ==========================================

/**
 * 서버 이벤트 결과
 */
export interface ServerEventResult {
  hasEvent: boolean;
  impact: number;
  type: string;
  description?: string;
}

/**
 * 서버 타입별 프로파일 및 장애 시나리오
 */
export interface ServerTypeProfile {
  type: string;
  normalRanges: {
    cpu: [number, number];
    memory: [number, number];
    disk: [number, number];
    network: [number, number];
  };
  scenarios: {
    [key: string]: {
      name: string;
      probability: number; // 0-1 확률
      effects: {
        cpu?: number;
        memory?: number;
        disk?: number;
        network?: number;
      };
      status: 'online' | 'warning' | 'critical';
    };
  };
}

// ==========================================
// 배치 처리
// ==========================================

/**
 * 배치 서버 정보
 */
export interface BatchServerInfo {
  id: string;
  type: string;
  baseMetrics: {
    cpu: number;
    memory: number;
    disk: number;
    network: number;
  };
}

/**
 * 배치 메트릭 결과
 */
export interface BatchMetricsResult {
  id: string;
  metrics: {
    cpu: number;
    memory: number;
    disk: number;
    network: number;
  };
  events: ServerEventResult;
}

// ==========================================
// 성능 및 캐싱
// ==========================================

/**
 * 성능 통계
 */
export interface PerformanceStats {
  variationMode: 'realistic';
  cacheOptimization: 'disabled';
  responseTime: string;
  dataSource: string;
}

/**
 * 파일 캐시 구조
 */
export interface FileCache {
  data: any;
  timestamp: number;
  hour: number;
}

// ==========================================
// 유틸리티 타입
// ==========================================

/**
 * 정렬 가능한 메트릭 키
 */
export type SortableKey = keyof Pick<ServerMetrics, 'cpu' | 'memory' | 'disk' | 'network' | 'uptime' | 'name'>;

// ==========================================
// 타입 가드 및 검증 유틸리티
// ==========================================

/**
 * 숫자 값 안전 변환
 */
export const ensureNumber = (value: number | undefined, fallback: number = 0): number => {
  return typeof value === 'number' && !isNaN(value) ? value : fallback;
};
