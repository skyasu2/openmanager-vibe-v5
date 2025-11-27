'use client';

import { useServerDataStore } from '@/components/providers/StoreProvider';
import {
  calculateTwoRowsLayout,
  generateDisplayInfo,
  getDisplayModeConfig,
  type ServerDisplayMode,
} from '@/config/display-config';
import type {
  Server,
  Service,
  ServerRole,
  ServerEnvironment,
} from '@/types/server';
import type { EnhancedServerMetrics } from '@/types/unified-server';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useServerMetrics } from './useServerMetrics';
import {
  EnhancedServerData,
  ServerStats,
  ServerWithMetrics,
  UseServerDashboardOptions,
  UseEnhancedServerDashboardProps,
  UseEnhancedServerDashboardReturn,
  ViewMode,
  DashboardTab,
} from '@/types/dashboard/server-dashboard.types';
import { formatUptime } from '@/utils/dashboard/server-utils';
import { useServerPagination } from '@/hooks/dashboard/useServerPagination';
import { useServerFilter } from '@/hooks/dashboard/useServerFilter';
import { useServerStats } from '@/hooks/dashboard/useServerStats';

// 🎯 기존 useServerDashboard 훅 (하위 호환성 유지 + 성능 최적화)
export function useServerDashboard(options: UseServerDashboardOptions = {}) {
  const { onStatsUpdate } = options;

  // Zustand 스토어에서 서버 데이터 가져오기
  const rawServers = useServerDataStore((state) => state.servers);

  // 🛡️ AI 교차검증 기반: previousServers 캐시로 Race Condition 방지
  const previousServersRef = useRef<EnhancedServerMetrics[]>([]);

  // Double-check null safety: 스토어 데이터가 유효한 경우에만 캐시 업데이트
  const servers = useMemo(() => {
    // AI 사이드바 오픈 시 빈 배열이 되는 Race Condition 방지
    if (!rawServers || !Array.isArray(rawServers) || rawServers.length === 0) {
      return previousServersRef.current;
    }

    // 유효한 데이터인 경우 캐시 업데이트
    previousServersRef.current = rawServers;
    return rawServers;
  }, [rawServers]);

  const isLoading = useServerDataStore((state) => state.isLoading);
  const error = useServerDataStore((state) => state.error);
  const fetchServers = useServerDataStore((state) => state.fetchServers);
  const startAutoRefresh = useServerDataStore(
    (state) => state.startAutoRefresh
  );
  const stopAutoRefresh = useServerDataStore((state) => state.stopAutoRefresh);

  // 즉시 fetchServers 실행 (조건부)
  if (
    (!servers || !Array.isArray(servers) || servers.length === 0) &&
    !isLoading &&
    fetchServers
  ) {
    setTimeout(() => {
      fetchServers();
    }, 100);
  }

  // 🚀 화면 크기에 따른 초기 페이지 크기 설정
  const getInitialPageSize = () => {
    return 3; // 모든 화면 크기에서 3개 시작 (무거움 방지)
  };

  // 🎨 화면 크기 변경 시 페이지 크기 자동 조정 로직은 useServerPagination 내부가 아닌 여기서 처리 (반응형 로직)
  const [responsivePageSize, setResponsivePageSize] =
    useState(getInitialPageSize);

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      let newPageSize: number;

      if (width < 640) {
        newPageSize = 6;
      } else if (width < 1024) {
        newPageSize = 9;
      } else {
        newPageSize = 15;
      }

      if (newPageSize !== responsivePageSize && responsivePageSize <= 15) {
        setResponsivePageSize(newPageSize);
      }
    };

    if (typeof window !== 'undefined') {
      handleResize();
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
    return undefined;
  }, [responsivePageSize]);

  // 🎯 서버 설정에 따른 동적 페이지 크기 설정
  const ITEMS_PER_PAGE = useMemo(() => {
    return responsivePageSize;
  }, [responsivePageSize]);

  // 선택된 서버 상태
  const [selectedServer, setSelectedServer] = useState<Server | null>(null);

  // 서버 메트릭 훅
  const { metricsHistory } = useServerMetrics();

  // 🚀 최적화된 서버 데이터 로드 및 자동 갱신 설정
  useEffect(() => {
    fetchServers().catch((err) => {
      if (process.env.NODE_ENV !== 'production') {
        console.error('❌ fetchServers 호출 실패:', err);
      }
    });

    startAutoRefresh();
    return () => {
      stopAutoRefresh();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 실제 서버 데이터 사용 (메모이제이션 + 🕐 시간 기반 메트릭 변화)
  const actualServers = useMemo(() => {
    if (!servers || !Array.isArray(servers) || servers.length === 0) {
      return [];
    }

    // EnhancedServerMetrics를 Server 타입으로 변환 (고정 시간별 데이터 사용)
    return servers.map((server: unknown): Server => {
      const s = server as EnhancedServerData;
      const cpu = Math.round(s.cpu || s.cpu_usage || 0);
      const memory = Math.round(s.memory || s.memory_usage || 0);
      const disk = Math.round(s.disk || s.disk_usage || 0);
      const network = Math.round(
        s.network || (s.network_in || 0) + (s.network_out || 0) || 0
      );

      return {
        id: s.id,
        name: s.name || s.hostname || 'Unknown',
        hostname: s.hostname || s.name || 'Unknown',
        status: s.status,
        cpu: cpu,
        memory: memory,
        disk: disk,
        network: network,
        uptime: s.uptime || 0,
        location: s.location || 'Unknown',
        alerts:
          typeof s.alerts === 'number'
            ? s.alerts
            : Array.isArray(s.alerts)
              ? s.alerts.length
              : 0,
        ip: s.ip || '192.168.1.1',
        os: s.os || 'Ubuntu 22.04 LTS',
        role: (s.type || s.role || 'worker') as ServerRole,
        environment: (s.environment || 'production') as ServerEnvironment,
        provider: s.provider || 'On-Premise',
        specs: s.specs || {
          cpu_cores: 4,
          memory_gb: 8,
          disk_gb: 250,
          network_speed: '1Gbps',
        },
        lastUpdate:
          typeof s.lastUpdate === 'string'
            ? new Date(s.lastUpdate)
            : s.lastUpdate || new Date(),
        services: Array.isArray(s.services) ? (s.services as Service[]) : [],
        networkStatus:
          s.status === 'online'
            ? 'online'
            : s.status === 'warning'
              ? 'warning'
              : 'critical',
        systemInfo: s.systemInfo || {
          os: s.os || 'Ubuntu 22.04 LTS',
          uptime:
            typeof s.uptime === 'string'
              ? s.uptime
              : `${Math.floor((s.uptime || 0) / 3600)}h`,
          processes: Math.floor(Math.random() * 200) + 50,
          zombieProcesses: Math.floor(Math.random() * 5),
          loadAverage: '1.23, 1.45, 1.67',
          lastUpdate:
            typeof s.lastUpdate === 'string'
              ? s.lastUpdate
              : s.lastUpdate instanceof Date
                ? s.lastUpdate.toISOString()
                : new Date().toISOString(),
        },
        networkInfo: s.networkInfo || {
          interface: 'eth0',
          receivedBytes: `${Math.floor(s.network_in || 0)} MB`,
          sentBytes: `${Math.floor(s.network_out || 0)} MB`,
          receivedErrors: Math.floor(Math.random() * 10),
          sentErrors: Math.floor(Math.random() * 10),
          status:
            s.status === 'online'
              ? 'online'
              : s.status === 'warning'
                ? 'warning'
                : 'critical',
        },
      };
    });
  }, [servers]);

  // 🏗️ Clean Architecture: 페이지네이션 훅 사용
  const {
    paginatedItems: paginatedServers,
    totalPages,
    currentPage,
    setCurrentPage,
    setPageSize: setHookPageSize,
  } = useServerPagination(actualServers, ITEMS_PER_PAGE);

  // 페이지 크기 변경 시 훅의 상태도 업데이트
  useEffect(() => {
    setHookPageSize(ITEMS_PER_PAGE);
  }, [ITEMS_PER_PAGE, setHookPageSize]);

  const changePageSize = (newSize: number) => {
    setResponsivePageSize(newSize);
    setCurrentPage(1);
  };

  // 🏗️ Clean Architecture: 통계 계산 훅 사용
  const { stats } = useServerStats(actualServers as EnhancedServerData[]);

  // 🚀 통계 업데이트 콜백 호출 (디바운싱 적용)
  useEffect(() => {
    if (onStatsUpdate && stats.total > 0) {
      const timeoutId = setTimeout(() => {
        const offlineCount = actualServers.filter(
          (s) => s.status === 'offline'
        ).length;
        onStatsUpdate({
          total: stats.total,
          online: stats.online,
          warning: stats.warning,
          offline: offlineCount,
          unknown: stats.unknown,
        });
      }, 100);

      return () => clearTimeout(timeoutId);
    }
    return undefined;
  }, [stats, onStatsUpdate, actualServers]);

  // 서버 선택 핸들러
  const handleServerSelect = (server: Server) => {
    setSelectedServer(server);
  };

  // 모달 닫기 핸들러
  const handleModalClose = () => {
    setSelectedServer(null);
  };

  // 선택된 서버의 메트릭 계산 (메모이제이션)
  const selectedServerMetrics = useMemo(() => {
    if (!selectedServer) return null;

    const serverWithMetrics = selectedServer as ServerWithMetrics;
    return {
      cpu: serverWithMetrics.cpu || 0,
      memory: serverWithMetrics.memory || 0,
      disk: serverWithMetrics.disk || 0,
      network: serverWithMetrics.network || 0,
      uptime: serverWithMetrics.uptime || 0,
      timestamp: new Date().toISOString(),
    };
  }, [selectedServer]);

  // 🚀 최적화된 로딩 상태
  const optimizedIsLoading = isLoading && actualServers.length === 0;

  return {
    servers: actualServers,
    paginatedServers,
    isLoading: optimizedIsLoading,
    error,
    stats,
    currentPage,
    totalPages,
    pageSize: responsivePageSize,
    setCurrentPage,
    changePageSize,
    selectedServer,
    selectedServerMetrics,
    handleServerSelect,
    handleModalClose,
    metricsHistory,
    formatUptime,
  };
}

// 🆕 새로운 Enhanced 서버 대시보드 훅 (세로 2줄 + UI/UX 개선)
export function useEnhancedServerDashboard({
  servers,
  _initialViewMode = 'grid',
  _initialDisplayMode = 'SHOW_TWO_ROWS',
}: UseEnhancedServerDashboardProps): UseEnhancedServerDashboardReturn {
  // 🎨 뷰 상태
  const [viewMode, setViewMode] = useState<ViewMode>(_initialViewMode);
  const [displayMode, setDisplayMode] =
    useState<ServerDisplayMode>(_initialDisplayMode);

  // 🏗️ Clean Architecture: 필터링 훅 사용
  const {
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    locationFilter,
    setLocationFilter,
    filteredServers,
    uniqueLocations,
    resetFilters,
  } = useServerFilter(servers);

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

    return {
      className:
        'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6',
      cols: 4,
      rows: 1,
    };
  }, [displayMode, screenWidth]);

  // 🏗️ Clean Architecture: 페이지네이션 훅 사용
  // useServerPagination을 사용하되, displayConfig.cardsPerPage를 동적으로 반영
  // 여기서는 useServerPagination을 직접 쓰지 않고 내부 로직을 재구현하여 최적화
  // (useServerPagination은 state를 가지므로, props로 전달된 pageSize 변경에 반응하려면 useEffect가 필요함)

  const calculatedTotalPages = useMemo(() => {
    const safeLength =
      filteredServers && Array.isArray(filteredServers)
        ? filteredServers.length
        : 0;
    return Math.ceil(safeLength / displayConfig.cardsPerPage);
  }, [filteredServers, displayConfig.cardsPerPage]);

  const calculatedPaginatedServers = useMemo(() => {
    if (
      !filteredServers ||
      !Array.isArray(filteredServers) ||
      filteredServers.length === 0
    ) {
      return [];
    }

    const startIndex = (currentPage - 1) * displayConfig.cardsPerPage;
    const endIndex = startIndex + displayConfig.cardsPerPage;
    return filteredServers.slice(startIndex, endIndex);
  }, [filteredServers, currentPage, displayConfig.cardsPerPage]);

  // 📊 표시 정보 생성 (UI/UX 개선)
  const displayInfo = useMemo(() => {
    const safeFilteredLength =
      filteredServers && Array.isArray(filteredServers)
        ? filteredServers.length
        : 0;
    return generateDisplayInfo(displayMode, currentPage, safeFilteredLength);
  }, [displayMode, currentPage, filteredServers]);

  // 🔄 페이지 리셋 (필터 변경 시)
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, locationFilter, displayMode]);

  // 🔄 레이아웃 새로고침
  const refreshLayout = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 300);
  };

  return {
    paginatedServers: calculatedPaginatedServers,
    filteredServers,
    viewMode,
    displayMode,
    searchTerm,
    statusFilter,
    locationFilter,
    uniqueLocations,
    currentPage,
    totalPages: calculatedTotalPages,
    displayInfo,
    gridLayout,
    setViewMode,
    setDisplayMode,
    setSearchTerm,
    setStatusFilter,
    setLocationFilter,
    setCurrentPage,
    resetFilters,
    refreshLayout,
    isLoading,
  };
}

// 🔄 Re-export types for backward compatibility
export type {
  EnhancedServerData,
  ServerStats,
  ServerWithMetrics,
  DashboardTab,
  ViewMode,
  UseServerDashboardOptions,
  UseEnhancedServerDashboardProps,
  UseEnhancedServerDashboardReturn,
};
