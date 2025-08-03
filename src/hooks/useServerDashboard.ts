'use client';

import { useServerDataStore } from '@/components/providers/StoreProvider';
import {
  calculateTwoRowsLayout,
  generateDisplayInfo,
  getDisplayModeConfig,
  type ServerDisplayMode,
} from '@/config/display-config';
import { ACTIVE_SERVER_CONFIG } from '@/config/serverConfig';
import type { Server } from '@/types/server';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useServerMetrics } from './useServerMetrics';

export type DashboardTab = 'servers' | 'network' | 'clusters' | 'applications';
export type ViewMode = 'grid' | 'list';

// 🎯 기존 useServerDashboard 인터페이스 유지
interface UseServerDashboardOptions {
  onStatsUpdate?: (stats: {
    total: number;
    online: number;
    warning: number;
    offline: number;
  }) => void;
}

// 🆕 새로운 Enhanced 훅 인터페이스
interface UseEnhancedServerDashboardProps {
  servers: Server[];
  _initialViewMode?: ViewMode;
  _initialDisplayMode?: ServerDisplayMode;
}

interface UseEnhancedServerDashboardReturn {
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

// 🎯 폴백 서버 데이터 제거 - 목업 시스템 사용

// 업타임 포맷팅 유틸리티
const formatUptime = (uptime: number): string => {
  const days = Math.floor(uptime / (24 * 3600));
  const hours = Math.floor((uptime % (24 * 3600)) / 3600);
  const minutes = Math.floor((uptime % 3600) / 60);

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
};

// 🎯 기존 useServerDashboard 훅 (하위 호환성 유지 + 성능 최적화)
export function useServerDashboard(options: UseServerDashboardOptions = {}) {
  const { onStatsUpdate } = options;

  // Zustand 스토어에서 서버 데이터 가져오기
  const servers = useServerDataStore(state => state.servers);
  const isLoading = useServerDataStore(state => state.isLoading);
  const error = useServerDataStore(state => state.error);
  const fetchServers = useServerDataStore(state => state.fetchServers);
  const startAutoRefresh = useServerDataStore(state => state.startAutoRefresh);
  const stopAutoRefresh = useServerDataStore(state => state.stopAutoRefresh);

  // 페이지네이션 상태 - 설정 기반으로 동적 조정
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(8); // 🆕 동적 페이지 크기

  // 🎯 서버 설정에 따른 동적 페이지 크기 설정
  const ITEMS_PER_PAGE = useMemo(() => {
    // 📊 실제 서버 생성 개수 (데이터 생성기에서 만드는 서버 수)
    const ACTUAL_SERVER_COUNT = ACTIVE_SERVER_CONFIG.maxServers; // 15개

    // 🖥️ 화면 표시 설정 (한 페이지에 보여줄 카드 수)
    const DISPLAY_OPTIONS = {
      SHOW_ALL: ACTUAL_SERVER_COUNT, // 모든 서버 표시 (15개)
      SHOW_HALF: Math.ceil(ACTUAL_SERVER_COUNT / 2), // 절반씩 표시 (8개)
      SHOW_QUARTER: Math.ceil(ACTUAL_SERVER_COUNT / 4), // 1/4씩 표시 (4개)
      SHOW_THIRD: Math.ceil(ACTUAL_SERVER_COUNT / 3), // 1/3씩 표시 (5개)
    };

    console.log('🎯 서버 표시 설정:', {
      실제_서버_생성_개수: ACTUAL_SERVER_COUNT,
      화면_표시_옵션: DISPLAY_OPTIONS,
      현재_선택: `${pageSize}개씩 페이지네이션`,
      사용자_설정_페이지_크기: pageSize,
    });

    // 🎛️ 사용자가 선택한 페이지 크기 사용
    return pageSize;
  }, [pageSize]);

  // 🎛️ 페이지 크기 변경 함수 (간단한 함수라 useCallback 불필요)
  const changePageSize = (newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(1); // 페이지 크기 변경 시 첫 페이지로 이동
    console.log('📊 페이지 크기 변경:', {
      이전_크기: pageSize,
      새_크기: newSize,
    });
  };

  // 선택된 서버 상태
  const [selectedServer, setSelectedServer] = useState<Server | null>(null);

  // 서버 메트릭 훅
  const { metricsHistory } = useServerMetrics();

  // 🚀 최적화된 서버 데이터 로드 및 자동 갱신 설정
  useEffect(() => {
    // 데이터가 없을 때 최초 로드
    if (!servers || servers.length === 0) {
      console.log('📊 서버 데이터 최초 로드');
      fetchServers();
    }

    // 자동 갱신 시작 (30-60초 주기)
    console.log('🔄 서버 데이터 자동 갱신 활성화');
    startAutoRefresh();

    // 컴포넌트 언마운트 시 자동 갱신 중지
    return () => {
      console.log('🛑 서버 데이터 자동 갱신 중지');
      stopAutoRefresh();
    };
  }, [fetchServers, startAutoRefresh, stopAutoRefresh]); // servers 의존성 제거로 무한 루프 방지

  // 실제 서버 데이터 사용 (메모이제이션)
  const actualServers = useMemo(() => {
    if (!servers || servers.length === 0) {
      return [];
    }

    // EnhancedServerMetrics를 Server 타입으로 변환
    return servers.map(
      (server: unknown): Server => ({
        id: server.id,
        name: server.name || server.hostname,
        hostname: server.hostname || server.name,
        status: server.status,
        cpu: server.cpu || server.cpu_usage || 0,
        memory: server.memory || server.memory_usage || 0,
        disk: server.disk || server.disk_usage || 0,
        network: server.network || server.network_in + server.network_out || 0,
        uptime: server.uptime || 0,
        location: server.location || 'Unknown',
        alerts: server.alerts?.length || server.alerts || 0,
        ip: server.ip || '192.168.1.1',
        os: server.os || 'Ubuntu 22.04 LTS',
        type: server.type || server.role || 'worker',
        environment: server.environment || 'production',
        provider: server.provider || 'On-Premise',
        specs: server.specs || {
          cpu_cores: 4,
          memory_gb: 8,
          disk_gb: 250,
          network_speed: '1Gbps',
        },
        lastUpdate: server.lastUpdate || new Date(),
        services: server.services || ([] as any[]),
        networkStatus:
          server.status === 'online'
            ? 'healthy'
            : server.status === 'warning'
              ? 'warning'
              : 'critical',
        systemInfo: server.systemInfo || {
          os: server.os || 'Ubuntu 22.04 LTS',
          uptime:
            typeof server.uptime === 'string'
              ? server.uptime
              : `${Math.floor(server.uptime / 3600)}h`,
          processes: Math.floor(Math.random() * 200) + 50,
          zombieProcesses: Math.floor(Math.random() * 5),
          loadAverage: '1.23, 1.45, 1.67',
          lastUpdate: server.lastUpdate || new Date().toISOString(),
        },
        networkInfo: server.networkInfo || {
          interface: 'eth0',
          receivedBytes: `${Math.floor(server.network_in || 0)} MB`,
          sentBytes: `${Math.floor(server.network_out || 0)} MB`,
          receivedErrors: Math.floor(Math.random() * 10),
          sentErrors: Math.floor(Math.random() * 10),
          status:
            server.status === 'online'
              ? 'healthy'
              : server.status === 'warning'
                ? 'warning'
                : 'critical',
        },
      })
    );
  }, [servers]);

  // 페이지네이션된 서버 데이터 (메모이제이션)
  const paginatedServers = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const result = actualServers.slice(startIndex, endIndex);

    console.log('📊 페이지네이션 결과:', {
      totalServers: actualServers.length,
      itemsPerPage: ITEMS_PER_PAGE,
      currentPage,
      startIndex,
      endIndex,
      paginatedCount: result.length,
      totalPages: Math.ceil(actualServers.length / ITEMS_PER_PAGE),
    });

    return result;
  }, [actualServers, currentPage, ITEMS_PER_PAGE]);

  // 총 페이지 수 계산
  const totalPages = Math.ceil(actualServers.length / ITEMS_PER_PAGE);

  // 통계 계산 (메모이제이션)
  const stats = useMemo(() => {
    const total = actualServers.length;

    if (total === 0) {
      return {
        total: 0,
        online: 0,
        offline: 0,
        warning: 0,
        avgCpu: 0,
        avgMemory: 0,
        avgDisk: 0,
      };
    }

    let online = 0;
    let offline = 0;
    let warning = 0;

    actualServers.forEach((server: unknown) => {
      // 목업 시스템의 상태 그대로 사용
      switch (server.status) {
        case 'online':
          online += 1;
          break;
        case 'warning':
          warning += 1;
          break;
        case 'critical':
          offline += 1; // critical을 offline으로 매핑
          break;
        default:
          // 알 수 없는 상태는 경고로 분류
          warning += 1;
      }
    });

    const avgCpu = Math.round(
      actualServers.reduce((sum: number, s: unknown) => sum + (s.cpu || 0), 0) /
        total
    );
    const avgMemory = Math.round(
      actualServers.reduce((sum: number, s: unknown) => sum + (s.memory || 0), 0) /
        total
    );
    const avgDisk = Math.round(
      actualServers.reduce((sum: number, s: unknown) => sum + (s.disk || 0), 0) /
        total
    );

    const result = {
      total,
      online,
      offline,
      warning,
      avgCpu,
      avgMemory,
      avgDisk,
    };

    console.log('📊 useServerDashboard 통계:', {
      ...result,
      서버_상태_분포: actualServers.map(s => ({
        이름: s.name || s.id,
        상태: s.status,
      })),
    });

    return result;
  }, [actualServers]);

  // 🚀 통계 업데이트 콜백 호출 (디바운싱 적용)
  useEffect(() => {
    if (onStatsUpdate && stats.total > 0) {
      // 100ms 디바운싱으로 불필요한 업데이트 방지
      const timeoutId = setTimeout(() => {
        onStatsUpdate(stats);
      }, 100);

      return () => clearTimeout(timeoutId);
    }
    return undefined;
  }, [stats, onStatsUpdate]);

  // 서버 선택 핸들러 (간단한 상태 업데이트라 useCallback 불필요)
  const handleServerSelect = (server: Server) => {
    setSelectedServer(server);
  };

  // 모달 닫기 핸들러 (간단한 상태 리셋이라 useCallback 불필요)
  const handleModalClose = () => {
    setSelectedServer(null);
  };

  // 선택된 서버의 메트릭 계산 (메모이제이션)
  const selectedServerMetrics = useMemo(() => {
    if (!selectedServer) return null;

    return {
      cpu: (selectedServer as any).cpu || 0,
      memory: (selectedServer as any).memory || 0,
      disk: (selectedServer as any).disk || 0,
      network: (selectedServer as any).network || 0,
      uptime: (selectedServer as any).uptime || 0,
      timestamp: new Date().toISOString(),
    };
  }, [selectedServer]);

  // 🚀 최적화된 로딩 상태 - 실제 로딩 중이고 데이터가 없을 때만 true
  const optimizedIsLoading = isLoading && actualServers.length === 0;

  return {
    // 데이터
    servers: actualServers,
    paginatedServers,
    isLoading: optimizedIsLoading, // 🚀 최적화된 로딩 상태
    error,
    stats,

    // 페이지네이션
    currentPage,
    totalPages,
    setCurrentPage,
    changePageSize,

    // 서버 선택
    selectedServer,
    selectedServerMetrics,
    handleServerSelect,
    handleModalClose,

    // 메트릭 히스토리
    metricsHistory,

    // 유틸리티
    formatUptime,
  };
}

// 🆕 새로운 Enhanced 서버 대시보드 훅 (세로 2줄 + UI/UX 개선)
export function useEnhancedServerDashboard({
  servers,
  _initialViewMode = 'grid',
  _initialDisplayMode = 'SHOW_TWO_ROWS', // 🆕 기본값: 세로 2줄
}: UseEnhancedServerDashboardProps): UseEnhancedServerDashboardReturn {
  // 🎨 뷰 상태
  const [viewMode, setViewMode] = useState<ViewMode>(_initialViewMode);
  const [displayMode, setDisplayMode] =
    useState<ServerDisplayMode>(_initialDisplayMode);

  // 🔍 필터 상태
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [locationFilter, setLocationFilter] = useState('all');

  // 📄 페이지네이션 상태
  const [currentPage, setCurrentPage] = useState(1);

  // 🔄 로딩 상태
  const [isLoading, setIsLoading] = useState(false);

  // 📱 화면 크기 감지
  const [screenWidth, setScreenWidth] = useState(1280);

  useEffect(() => {
    const handleResize = () => {
      setScreenWidth(window.innerWidth);
    };

    if (typeof window !== 'undefined') {
      setScreenWidth(window.innerWidth);
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
    return undefined;
  }, []);

  // 🎯 표시 모드 설정 계산
  const displayConfig = useMemo(() => {
    return getDisplayModeConfig(displayMode, screenWidth);
  }, [displayMode, screenWidth]);

  // 🎛️ 그리드 레이아웃 계산 (세로 2줄)
  const gridLayout = useMemo(() => {
    if (displayMode === 'SHOW_TWO_ROWS') {
      const layout = calculateTwoRowsLayout(screenWidth);
      return {
        className: `grid gap-4 grid-cols-${layout.cols} grid-rows-2`,
        cols: layout.cols,
        rows: layout.rows,
      };
    }

    // 기본 반응형 그리드
    return {
      className:
        'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6',
      cols: 4,
      rows: 1,
    };
  }, [displayMode, screenWidth]);

  // 🌍 고유 위치 목록
  const uniqueLocations = useMemo(() => {
    return Array.from(new Set(servers.map(server => server.location))).sort();
  }, [servers]);

  // 🔍 필터링된 서버
  const filteredServers = useMemo(() => {
    return servers.filter(server => {
      const matchesSearch =
        server.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        server.location.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus =
        statusFilter === 'all' || server.status === statusFilter;
      const matchesLocation =
        locationFilter === 'all' || server.location === locationFilter;

      return matchesSearch && matchesStatus && matchesLocation;
    });
  }, [servers, searchTerm, statusFilter, locationFilter]);

  // 📄 페이지네이션 계산
  const totalPages = useMemo(() => {
    return Math.ceil(filteredServers.length / displayConfig.cardsPerPage);
  }, [filteredServers.length, displayConfig.cardsPerPage]);

  // 📊 페이지네이션된 서버
  const paginatedServers = useMemo(() => {
    const startIndex = (currentPage - 1) * displayConfig.cardsPerPage;
    const endIndex = startIndex + displayConfig.cardsPerPage;
    return filteredServers.slice(startIndex, endIndex);
  }, [filteredServers, currentPage, displayConfig.cardsPerPage]);

  // 📊 표시 정보 생성 (UI/UX 개선)
  const displayInfo = useMemo(() => {
    return generateDisplayInfo(
      displayMode,
      currentPage,
      filteredServers.length
    );
  }, [displayMode, currentPage, filteredServers.length]);

  // 🔄 페이지 리셋 (필터 변경 시)
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, locationFilter, displayMode]);

  // 🎯 필터 리셋 (간단한 상태 리셋이라 useCallback 불필요)
  const resetFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setLocationFilter('all');
    setCurrentPage(1);
  };

  // 🔄 레이아웃 새로고침 (간단한 로딩 토글이라 useCallback 불필요)
  const refreshLayout = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 300);
  };

  // 📊 디버깅 로그
  useEffect(() => {
    console.log('🎯 Enhanced 서버 대시보드 상태:', {
      전체_서버_수: servers.length,
      필터링된_서버_수: filteredServers.length,
      현재_페이지: currentPage,
      총_페이지: totalPages,
      표시_모드: displayMode,
      표시_설정: displayConfig,
      그리드_레이아웃: gridLayout,
      표시_정보: displayInfo,
    });
  }, [
    servers.length,
    filteredServers.length,
    currentPage,
    totalPages,
    displayMode,
    displayConfig,
    gridLayout,
    displayInfo,
  ]);

  return {
    // 🎯 서버 데이터
    paginatedServers,
    filteredServers,

    // 🎨 뷰 설정
    viewMode,
    displayMode,

    // 🔍 필터링
    searchTerm,
    statusFilter,
    locationFilter,
    uniqueLocations,

    // 📄 페이지네이션
    currentPage,
    totalPages,

    // 📊 표시 정보
    displayInfo,

    // 🎛️ 그리드 레이아웃
    gridLayout,

    // 🎯 액션 함수들
    setViewMode,
    setDisplayMode,
    setSearchTerm,
    setStatusFilter,
    setLocationFilter,
    setCurrentPage,
    resetFilters,

    // 🔄 유틸리티
    refreshLayout,
    isLoading,
  };
}
