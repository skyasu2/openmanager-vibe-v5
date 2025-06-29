/**
 * 🎯 Server Modal Types v1.0
 *
 * EnhancedServerModal 관련 타입 정의
 * SOLID 원칙 적용: 타입 정의를 별도 모듈로 분리
 */

// 서버 서비스 타입
export interface ServerService {
  name: string;
  status: 'running' | 'stopped';
  port: number;
}

// 서버 사양 타입
export interface ServerSpecs {
  cpu_cores: number;
  memory_gb: number;
  disk_gb: number;
  network_speed?: string;
}

// 서버 헬스 타입
export interface ServerHealth {
  score: number;
  trend: number[];
}

// 서버 알림 요약 타입
export interface ServerAlertsSummary {
  total: number;
  critical: number;
  warning: number;
}

// 메인 서버 타입
export interface ServerData {
  id: string;
  hostname: string;
  name: string;
  type: string;
  environment: string;
  location: string;
  provider: string;
  status: 'healthy' | 'warning' | 'critical' | 'offline';
  cpu: number;
  memory: number;
  disk: number;
  network?: number;
  uptime: string;
  lastUpdate: Date;
  alerts: number;
  services: ServerService[];
  specs?: ServerSpecs;
  os?: string;
  ip?: string;
  networkStatus?: 'excellent' | 'good' | 'poor' | 'offline';
  health?: ServerHealth;
  alertsSummary?: ServerAlertsSummary;
}

// 실시간 프로세스 데이터 타입
export interface RealtimeProcessData {
  name: string;
  cpu: number;
  memory: number;
  pid: number;
}

// 실시간 로그 데이터 타입
export interface RealtimeLogData {
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  message: string;
  source: string;
}

// 실시간 네트워크 데이터 타입
export interface RealtimeNetworkData {
  in: number;
  out: number;
}

// 실시간 데이터 상태 타입
export interface RealtimeDataState {
  cpu: number[];
  memory: number[];
  disk: number[];
  network: RealtimeNetworkData[];
  latency: number[];
  processes: RealtimeProcessData[];
  logs: RealtimeLogData[];
}

// 모달 Props 타입
export interface EnhancedServerModalProps {
  server: ServerData | null;
  onClose: () => void;
}

// 탭 ID 타입
export type TabId = 'overview' | 'metrics' | 'processes' | 'logs' | 'network';

// 시간 범위 타입
export type TimeRange = '5m' | '1h' | '6h' | '24h' | '7d';

// 탭 정의 타입
export interface TabDefinition {
  id: TabId;
  label: string;
  icon: any; // Lucide React Icon
}

// 차트 Props 타입
export interface RealtimeChartProps {
  data: number[];
  color: string;
  label: string;
  height?: number;
}
