import type { ServerDisplayMode } from '@/config/display-config';
import type {
  Server,
  ServerEnvironment,
  ServerRole,
  Service,
} from '@/types/server';
import type { ServerStatus } from '@/types/server-common';

// 🏗️ Clean Architecture: 도메인 레이어 - 순수 비즈니스 로직
export interface ServerStats {
  total: number;
  online: number;
  unknown: number;
  warning: number;
  critical: number;
  avgCpu: number;
  avgMemory: number;
  avgDisk: number;
  averageCpu?: number; // 🚀 Web Worker 호환성
  averageMemory?: number; // 🚀 Web Worker 호환성
  averageUptime?: number; // 🚀 Web Worker 추가 메트릭
  totalBandwidth?: number; // 🚀 Web Worker 추가 메트릭
  typeDistribution?: Record<string, number>; // 🚀 Web Worker 추가 메트릭
  performanceMetrics?: {
    calculationTime: number;
    serversProcessed: number;
  };
}

// Type interfaces for server data transformation
export interface EnhancedServerData {
  id: string;
  name?: string;
  hostname?: string;
  status: ServerStatus;
  cpu?: number;
  cpu_usage?: number;
  memory?: number;
  memory_usage?: number;
  disk?: number;
  disk_usage?: number;
  network?: number;
  network_in?: number;
  network_out?: number;
  bandwidth?: number;
  uptime?: number;
  location?: string;
  alerts?: Array<unknown> | number;
  ip?: string;
  os?: string;
  type?: string;
  role?: ServerRole | string;
  environment?: ServerEnvironment | string;
  provider?: string;
  specs?: {
    cpu_cores: number;
    memory_gb: number;
    disk_gb: number;
    network_speed?: string;
  };
  lastUpdate?: Date | string;
  services?: Service[] | Array<unknown>;
  systemInfo?: {
    os: string;
    uptime: string;
    processes: number;
    zombieProcesses: number;
    loadAverage: string;
    lastUpdate: string;
  };
  networkInfo?: {
    interface: string;
    receivedBytes: string;
    sentBytes: string;
    receivedErrors: number;
    sentErrors: number;
    status: 'online' | 'warning' | 'critical';
  };
}

export interface ServerWithMetrics extends Server {
  cpu: number;
  memory: number;
  disk: number;
  network: number;
  uptime: number;
}

export type DashboardTab = 'servers' | 'network' | 'clusters' | 'applications';
export type ViewMode = 'grid' | 'list';

// 🎯 기존 useServerDashboard 인터페이스 유지
export interface UseServerDashboardOptions {
  onStatsUpdate?: (stats: {
    total: number;
    online: number;
    warning: number;
    offline: number;
    unknown: number;
  }) => void;
}

// 🆕 새로운 Enhanced 훅 인터페이스
export interface UseEnhancedServerDashboardProps {
  servers: Server[];
  _initialViewMode?: ViewMode;
  _initialDisplayMode?: ServerDisplayMode;
}

export interface UseEnhancedServerDashboardReturn {
  // 🎯 서버 데이터
  paginatedServers: Server[];
  filteredServers: Server[];

  // 🎨 뷰 설정
  viewMode: ViewMode;
  displayMode: ServerDisplayMode;

  // 🔍 필터링
  searchTerm: string;
  statusFilter: string;
  locationFilter: string;
  uniqueLocations: string[];

  // 📄 페이지네이션
  currentPage: number;
  totalPages: number;

  // 📊 표시 정보 (UI/UX 개선)
  displayInfo: {
    totalServers: number;
    displayedCount: number;
    statusMessage: string;
    paginationMessage: string;
    modeDescription: string;
    displayRange: string;
  };

  // 🎛️ 그리드 레이아웃 (세로 2줄)
  gridLayout: {
    className: string;
    cols: number;
    rows: number;
  };

  // 🎯 액션 함수들
  setViewMode: (mode: ViewMode) => void;
  setDisplayMode: (mode: ServerDisplayMode) => void;
  setSearchTerm: (term: string) => void;
  setStatusFilter: (status: string) => void;
  setLocationFilter: (location: string) => void;
  setCurrentPage: (page: number) => void;
  resetFilters: () => void;

  // 🔄 유틸리티
  refreshLayout: () => void;
  isLoading: boolean;
}
