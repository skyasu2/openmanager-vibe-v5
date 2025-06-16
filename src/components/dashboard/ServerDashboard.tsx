/* eslint-disable */
// @ts-nocheck
'use client';

import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from 'react';
import {
  Search,
  Filter,
  LayoutGrid,
  List,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Monitor,
  AlertTriangle,
  CheckCircle,
  Zap,
  Activity,
  Network,
  Globe,
  Wifi,
  Server as ServerIcon,
  Database,
  BarChart3,
  Clock,
  Cpu,
  MemoryStick,
  HardDrive,
  Users,
  TrendingUp,
  Eye,
  EyeOff,
  RefreshCw,
  Settings,
  MoreVertical,
  X,
  TrendingDown,
  Minus,
  XCircle,
} from 'lucide-react';
import ServerDetailModal from './ServerDetailModal';
import EnhancedServerCard from './EnhancedServerCard';
import EnhancedServerModal from './EnhancedServerModal';
import NetworkMonitoringCard from './NetworkMonitoringCard';
import { Server } from '../../types/server';
import { useDashboardToggleStore } from '@/stores/useDashboardToggleStore';
import { transformArray } from '@/adapters/server-dashboard.transformer';
// 🚀 캐시된 서버 데이터 사용 (성능 최적화)
import { useCachedServers } from '@/hooks/useCachedServers';

// ✅ 타입만 정의 (실제 구현은 API 라우트에서 처리)
interface ServerInstance {
  id: string;
  name: string;
  status: 'online' | 'offline' | 'warning';
  location: string;
  cpu: number;
  memory: number;
  disk: number;
  uptime: string;
  lastUpdate: Date;
  alerts: number;
  services: Array<{
    name: string;
    status: string;
    port: number;
  }>;
}

interface ServerCluster {
  id: string;
  name: string;
  servers: ServerInstance[];
}

interface ApplicationMetrics {
  id: string;
  name: string;
  status: string;
  responseTime: number;
  throughput: number;
}

interface ServerDashboardProps {
  onStatsUpdate?: (stats: {
    total: number;
    online: number;
    warning: number;
    offline: number;
  }) => void;
}

// 🎯 탭 타입 정의
type DashboardTab = 'servers' | 'network' | 'clusters' | 'applications';

// 🎯 심각→경고→정상 순으로 정렬된 목업 서버 데이터
const fallbackServers: Server[] = Array.from({ length: 30 }, (_, i) => ({
  id: `fallback-server-${i + 1}`,
  name: `서버-${i + 1}`,
  hostname: `server-${i + 1}`,
  status: i % 3 === 0 ? 'offline' : i % 3 === 1 ? 'warning' : 'healthy',
  location: ['Seoul DC1', 'Seoul DC2', 'Busan DC1'][i % 3],
  cpu: 45 + (i % 40),
  memory: 60 + (i % 30),
  disk: 75 + (i % 20),
  network: 50 + (i % 30),
  uptime: `${(i % 365) + 1}일`,
  lastUpdate: new Date(),
  alerts: i % 5,
  services: [
    { name: 'nginx', status: 'running', port: 80 },
    { name: 'nodejs', status: 'running', port: 3000 },
  ],
  networkStatus: 'good',
  type: 'api_server',
  environment: 'production',
  provider: 'AWS',
}));

// 🌐 네트워크 메트릭 목업 데이터
const networkMetrics = [
  {
    serverName: 'api-us-041',
    metrics: {
      bandwidth: 75,
      latency: 45,
      packetLoss: 0.1,
      uptime: 99.9,
      downloadSpeed: 850,
      uploadSpeed: 420,
      connections: 156,
      status: 'excellent' as const,
    },
  },
  {
    serverName: 'api-eu-043',
    metrics: {
      bandwidth: 68,
      latency: 52,
      packetLoss: 0.2,
      uptime: 99.8,
      downloadSpeed: 720,
      uploadSpeed: 380,
      connections: 134,
      status: 'good' as const,
    },
  },
  {
    serverName: 'database-1',
    metrics: {
      bandwidth: 82,
      latency: 38,
      packetLoss: 0.05,
      uptime: 99.95,
      downloadSpeed: 950,
      uploadSpeed: 480,
      connections: 89,
      status: 'excellent' as const,
    },
  },
  {
    serverName: 'api-eu-045',
    metrics: {
      bandwidth: 45,
      latency: 125,
      packetLoss: 2.1,
      uptime: 97.2,
      downloadSpeed: 320,
      uploadSpeed: 180,
      connections: 67,
      status: 'poor' as const,
    },
  },
  {
    serverName: 'api-sg-042',
    metrics: {
      bandwidth: 38,
      latency: 180,
      packetLoss: 3.5,
      uptime: 95.8,
      downloadSpeed: 280,
      uploadSpeed: 150,
      connections: 45,
      status: 'poor' as const,
    },
  },
  {
    serverName: 'api-jp-040',
    metrics: {
      bandwidth: 0,
      latency: 0,
      packetLoss: 100,
      uptime: 0,
      downloadSpeed: 0,
      uploadSpeed: 0,
      connections: 0,
      status: 'offline' as const,
    },
  },
];

// ✅ 간단한 디바운스 훅 (안전한 구현)
const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// ✅ 성능 최적화 훅 제거 (무한 렌더링 방지)

const mapStatus = (rawStatus: string): 'healthy' | 'warning' | 'offline' => {
  const s = String(rawStatus)?.toLowerCase();
  if (s === 'online' || s === 'running' || s === 'healthy') return 'healthy';
  if (s === 'warning' || s === 'degraded' || s === 'unhealthy')
    return 'warning';
  return 'offline';
};

export default function ServerDashboard({
  onStatsUpdate,
}: ServerDashboardProps) {
  const { sections, toggleSection } = useDashboardToggleStore();
  const [selectedServer, setSelectedServer] = useState<Server | null>(null);
  const { viewMode, setViewMode } = useDashboardToggleStore();
  const [activeTab, setActiveTab] = useState<DashboardTab>('servers');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('priority');
  const [currentPage, setCurrentPage] = useState(1);
  const [isClient, setIsClient] = useState(false);
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'healthy' | 'warning' | 'offline'
  >('all');
  const [locationFilter, setLocationFilter] = useState<string>('all');
  // 페이지네이션 상태 (8개씩 표시)
  // showAllServers 제거 - 이제 페이지네이션으로 관리

  // ✅ 페이지네이션 설정: 8개씩 표시, 총 20개 서버
  const SERVERS_PER_PAGE = 8; // 페이지당 8개 서버
  const TOTAL_SERVERS_LIMIT = 20; // 총 20개 서버 제한

  // 🎯 검색어 디바운싱 (500ms 지연) - 훅 순서 고정
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  // 🎯 대시보드 토글 상태 - 훅 순서 고정
  const { isCollapsed } = useDashboardToggleStore();

  // 🔧 안전한 실시간 데이터 훅 사용
  const {
    servers: realtimeServers,
    isLoading,
    error,
    lastUpdated,
    refresh: refreshServers,
  } = useCachedServers({
    pageSize: TOTAL_SERVERS_LIMIT, // 총 20개 서버 로드
    status: statusFilter === 'all' ? 'all' : statusFilter,
    search: debouncedSearchTerm,
    location: locationFilter,
    sortBy,
    autoRefresh: true,
    refreshInterval: 15000, // 15초마다 자동 새로고침
  });

  // 🚀 디버깅 로그 추가
  console.log('📊 ServerDashboard 렌더링:', {
    serversCount: realtimeServers?.length,
    isClient,
    isLoading,
    error,
    searchTerm,
    currentPage,
    timestamp: new Date().toISOString(),
  });

  // 🛡️ 클라이언트 사이드 초기화 (단순화)
  useEffect(() => {
    setIsClient(true);
  }, []);

  // ✅ 서버 정렬 로직 메모이제이션
  const sortServersByPriority = useCallback((servers: Server[]): Server[] => {
    if (!Array.isArray(servers)) return [];

    const statusPriority = {
      offline: 4,
      critical: 3,
      warning: 2,
      healthy: 1,
    };

    return [...servers].sort((a, b) => {
      // 1순위: 상태별 우선순위
      const statusDiff =
        (statusPriority[b.status] || 0) - (statusPriority[a.status] || 0);
      if (statusDiff !== 0) return statusDiff;

      // 2순위: 알림 개수
      const alertDiff = (b.alerts || 0) - (a.alerts || 0);
      if (alertDiff !== 0) return alertDiff;

      // 3순위: CPU 사용률 (높은 순)
      const cpuDiff = (b.cpu || 0) - (a.cpu || 0);
      if (cpuDiff !== 0) return cpuDiff;

      // 4순위: 메모리 사용률 (높은 순)
      return (b.memory || 0) - (a.memory || 0);
    });
  }, []);

  // 🔧 서버 통계 업데이트 (안전한 의존성)
  useEffect(() => {
    if (
      Array.isArray(realtimeServers) &&
      realtimeServers.length > 0 &&
      onStatsUpdate
    ) {
      const online = realtimeServers.filter(s => s.status === 'healthy').length;
      const warning = realtimeServers.filter(
        s => s.status === 'warning'
      ).length;
      const offline = realtimeServers.filter(
        s => s.status === 'offline'
      ).length;
      onStatsUpdate({
        total: realtimeServers.length,
        online,
        warning,
        offline,
      });
    }
  }, [realtimeServers, onStatsUpdate]);

  // ✅ 필터링된 서버 데이터 메모이제이션 (표시 개수 제한 포함)
  const filteredServers = useMemo(() => {
    if (!Array.isArray(realtimeServers)) {
      return [];
    }

    let filtered = realtimeServers.filter(server => {
      const matchesSearch =
        searchTerm === '' ||
        (server.name &&
          server.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (server.hostname &&
          server.hostname.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'healthy' && server.status === 'running') ||
        (statusFilter === 'warning' && server.status === 'warning') ||
        (statusFilter === 'offline' && server.status === 'error');

      const matchesLocation =
        locationFilter === 'all' ||
        (server.location && server.location === locationFilter);

      return matchesSearch && matchesStatus && matchesLocation;
    });

    // 정렬 적용
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return (a.name || '').localeCompare(b.name || '');
        case 'cpu':
          return (b.cpu || 0) - (a.cpu || 0);
        case 'memory':
          return (b.memory || 0) - (a.memory || 0);
        case 'status':
          return (a.status || '').localeCompare(b.status || '');
        case 'priority':
        default:
          // 우선순위: error > warning > running
          const statusPriority = { error: 3, warning: 2, running: 1 };
          return (
            (statusPriority[b.status] || 0) - (statusPriority[a.status] || 0)
          );
      }
    });

    // 🎯 총 20개 서버로 제한
    if (filtered.length > TOTAL_SERVERS_LIMIT) {
      return filtered.slice(0, TOTAL_SERVERS_LIMIT);
    }

    return filtered;
  }, [realtimeServers, searchTerm, statusFilter, locationFilter, sortBy]);

  // 🔧 페이지네이션된 서버 목록 (8개씩 표시)
  const paginatedServers = useMemo(() => {
    const startIndex = (currentPage - 1) * SERVERS_PER_PAGE;
    const endIndex = startIndex + SERVERS_PER_PAGE;
    return filteredServers.slice(startIndex, endIndex);
  }, [filteredServers, currentPage]);

  // 🔧 총 페이지 수 계산 (8개씩 나누어 계산)
  const totalPages = useMemo(() => {
    return Math.ceil(filteredServers.length / SERVERS_PER_PAGE);
  }, [filteredServers.length]);

  // 🎯 서버 카드 클릭 핸들러
  const handleServerClick = useCallback((server: Server) => {
    setSelectedServer(server);
  }, []);

  // 🎯 모달 닫기 핸들러
  const handleCloseModal = useCallback(() => {
    setSelectedServer(null);
  }, []);

  // 🎯 새로고침 핸들러
  const handleRefresh = useCallback(() => {
    refreshServers();
  }, [refreshServers]);

  // 🛡️ 로딩 상태 처리
  if (!isClient) {
    return (
      <div className='flex items-center justify-center h-64'>
        <div className='text-gray-500'>클라이언트 초기화 중...</div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className='flex items-center justify-center h-64'>
        <div className='flex items-center gap-2'>
          <RefreshCw className='w-5 h-5 animate-spin' />
          <span className='text-gray-500'>서버 데이터 로딩 중...</span>
        </div>
      </div>
    );
  }

  if (error && (!realtimeServers || realtimeServers.length === 0)) {
    return (
      <div className='flex flex-col items-center justify-center h-64 gap-4'>
        <AlertTriangle className='w-12 h-12 text-red-500' />
        <div className='text-center'>
          <h3 className='text-lg font-semibold text-gray-900 mb-2'>
            서버 데이터 로드 실패
          </h3>
          <p className='text-gray-600 mb-4'>{error}</p>
          <button
            onClick={handleRefresh}
            className='px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors'
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className='flex flex-col h-full bg-gray-50'>
      {/* 헤더 및 컨트롤 */}
      <div className='p-4 sm:p-6 border-b border-gray-200'>
        <div className='flex items-center justify-between mb-4'>
          <h1 className='text-2xl font-bold text-gray-900'>서버 대시보드</h1>
          <button
            onClick={() => refreshServers()}
            className='px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2'
          >
            <RefreshCw className='w-4 h-4' />
            새로고침
          </button>
        </div>

        {/* 검색 및 필터 */}
        <div className='flex gap-4 mb-4'>
          <div className='flex-1'>
            <input
              type='text'
              placeholder='서버 검색...'
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
            />
          </div>
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            aria-label='서버 상태 필터'
            className='px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500'
          >
            <option value='all'>모든 상태</option>
            <option value='online'>정상</option>
            <option value='warning'>경고</option>
            <option value='offline'>오프라인</option>
          </select>
        </div>
      </div>

      {/* 서버 그리드/리스트 */}
      <div className='flex-1 p-6 overflow-auto'>
        {paginatedServers.length > 0 ? (
          <>
            {/* 페이지네이션 정보 */}
            <div className='mb-4 flex items-center justify-between'>
              <div className='text-sm text-gray-600'>
                총 {filteredServers.length}개 서버 중{' '}
                {(currentPage - 1) * SERVERS_PER_PAGE + 1}-
                {Math.min(
                  currentPage * SERVERS_PER_PAGE,
                  filteredServers.length
                )}
                개 표시
              </div>
              <div className='text-sm text-gray-500'>
                페이지 {currentPage} / {totalPages}
              </div>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4 gap-6'>
              {paginatedServers.map(server => (
                <EnhancedServerCard
                  key={server.id}
                  server={server}
                  onClick={() => handleServerClick(server)}
                />
              ))}
            </div>

            {/* 페이지네이션 컨트롤 */}
            {totalPages > 1 && (
              <div className='mt-8 flex items-center justify-center space-x-2'>
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className='p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed'
                  aria-label='이전 페이지'
                >
                  <ChevronLeft size={16} />
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  page => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-2 rounded-lg border ${
                        currentPage === page
                          ? 'bg-blue-500 text-white border-blue-500'
                          : 'border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  )
                )}

                <button
                  onClick={() =>
                    setCurrentPage(Math.min(totalPages, currentPage + 1))
                  }
                  disabled={currentPage === totalPages}
                  className='p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed'
                  aria-label='다음 페이지'
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </>
        ) : (
          <div className='text-center py-16'>
            <Monitor className='mx-auto h-12 w-12 text-gray-400' />
            <h3 className='mt-2 text-sm font-medium text-gray-900'>
              결과 없음
            </h3>
            <p className='mt-1 text-sm text-gray-500'>
              검색 조건과 일치하는 서버를 찾을 수 없습니다.
            </p>
          </div>
        )}
      </div>

      {/* 모달 */}
      {selectedServer && (
        <EnhancedServerModal
          isOpen={selectedServer !== null}
          onClose={handleCloseModal}
          server={selectedServer}
        />
      )}
    </div>
  );
}
