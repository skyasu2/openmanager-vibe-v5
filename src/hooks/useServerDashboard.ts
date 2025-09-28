'use client';

import { useServerDataStore } from '@/components/providers/StoreProvider';
import {
  calculateTwoRowsLayout,
  generateDisplayInfo,
  getDisplayModeConfig,
  type ServerDisplayMode,
} from '@/config/display-config';
import { ACTIVE_SERVER_CONFIG } from '@/config/serverConfig';
import type { Server, Service, EnhancedServerMetrics } from '@/types/server';
import type { ServerStatus } from '@/types/server-common';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useServerMetrics } from './useServerMetrics';
import { useWorkerStats, calculateServerStatsFallback } from './useWorkerStats';
import { serverTypeGuards } from '@/utils/serverUtils';
import debug from '@/utils/debug';

// 🛡️ 2025 모던 Type Guard 함수들 (Best Practices)
const isValidArray = <T>(value: unknown): value is T[] => {
  return Array.isArray(value) && value.length > 0;
};

const isValidServer = (value: unknown): value is EnhancedServerData => {
  return value !== null &&
         typeof value === 'object' &&
         typeof (value as any).id === 'string';
};

const isValidNumber = (value: unknown): value is number => {
  return typeof value === 'number' &&
         !Number.isNaN(value) &&
         Number.isFinite(value) &&
         value >= 0;
};

const hasValidLength = (value: unknown): value is { length: number } => {
  return value !== null &&
         typeof value === 'object' &&
         Object.hasOwn(value as object, 'length') &&
         isValidNumber((value as any).length);
};

// 🏗️ Clean Architecture: 도메인 레이어 - 순수 비즈니스 로직
interface ServerStats {
  total: number;
  online: number;
  unknown: number; // 🔧 수정: 'offline' → 'unknown' (일관성)
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

// 🚀 성능 최적화: Map 기반 캐싱 시스템
const statsCache = new Map<string, ServerStats>();
const serverGroupCache = new Map<string, Map<string, EnhancedServerData[]>>();

const getServerGroupKey = (servers: EnhancedServerData[]): string => {
  return servers.map(s => `${s.id}:${s.status}:${(s as any).cpu}:${(s as any).memory}:${(s as any).disk}`).join('|');
};

const groupServersByStatus = (servers: EnhancedServerData[]): Map<string, EnhancedServerData[]> => {
  const groups = new Map<string, EnhancedServerData[]>();

  for (const server of servers) {
    if (!isValidServer(server)) continue;

    const status = server.status || 'unknown';
    if (!groups.has(status)) {
      groups.set(status, []);
    }
    groups.get(status)!.push(server);
  }

  return groups;
};

// 🚀 Web Worker 결과를 레거시 포맷으로 변환하는 어댑터 함수
const adaptWorkerStatsToLegacy = (workerStats: any): ServerStats => {
  return {
    total: workerStats.total || 0,
    online: workerStats.online || 0,
    unknown: workerStats.unknown || workerStats.offline || 0, // 🔧 수정: 'offline' → 'unknown' (호환성)
    warning: workerStats.warning || 0,
    critical: workerStats.critical || 0,
    avgCpu: Math.round(workerStats.averageCpu || 0),
    avgMemory: Math.round(workerStats.averageMemory || 0),
    avgDisk: 0, // Web Worker에서는 disk 메트릭 미지원, fallback 사용
    // Web Worker 추가 정보 유지
    averageCpu: workerStats.averageCpu,
    averageMemory: workerStats.averageMemory,
    averageUptime: workerStats.averageUptime,
    totalBandwidth: workerStats.totalBandwidth,
    typeDistribution: workerStats.typeDistribution,
    performanceMetrics: workerStats.performanceMetrics,
  };
};

const calculateServerStats = (servers: EnhancedServerData[]): ServerStats => {
  if (!isValidArray<EnhancedServerData>(servers)) {
    return {
      total: 0,
      online: 0,
      unknown: 0, // 🔧 수정: 'offline' → 'unknown' (일관성)
      warning: 0,
      critical: 0,
      avgCpu: 0,
      avgMemory: 0,
      avgDisk: 0
    };
  }

  // 🚀 캐시 키 생성 및 캐시 확인
  const cacheKey = getServerGroupKey(servers);
  if (statsCache.has(cacheKey)) {
    return statsCache.get(cacheKey)!;
  }

  // 🚀 Fallback 계산 사용 (Web Worker 미지원 환경용)
  const fallbackStats = calculateServerStatsFallback(servers);

  // 레거시 포맷으로 변환
  const result: ServerStats = adaptWorkerStatsToLegacy(fallbackStats);

  // 🚀 결과 캐싱 (최대 100개 엔트리로 제한)
  if (statsCache.size >= 100) {
    const firstKey = statsCache.keys().next().value;
    statsCache.delete(firstKey);
  }
  statsCache.set(cacheKey, result);

  return result;
};

const calculatePagination = <T>(
  items: T[],
  currentPage: number,
  itemsPerPage: number
): { paginatedItems: T[]; totalPages: number } => {
  if (!isValidArray<T>(items)) {
    return { paginatedItems: [], totalPages: 0 };
  }

  const totalPages = Math.ceil(items.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedItems = items.slice(startIndex, endIndex);

  return { paginatedItems, totalPages };
};

// Type interfaces for server data transformation
interface EnhancedServerData {
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
  uptime?: number;
  location?: string;
  alerts?: Array<unknown> | number;
  ip?: string;
  os?: string;
  type?: string;
  role?: string;
  environment?: string;
  provider?: string;
  specs?: {
    cpu_cores: number;
    memory_gb: number;
    disk_gb: number;
    network_speed?: string;
  };
  lastUpdate?: Date | string;
  services?: Array<unknown>;
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
    status: 'healthy' | 'warning' | 'critical';
  };
}

interface ServerWithMetrics extends Server {
  cpu: number;
  memory: number;
  disk: number;
  network: number;
  uptime: number;
}

export type DashboardTab = 'servers' | 'network' | 'clusters' | 'applications';
export type ViewMode = 'grid' | 'list';

// 🎯 기존 useServerDashboard 인터페이스 유지
interface UseServerDashboardOptions {
  onStatsUpdate?: (stats: {
    total: number;
    online: number;
    warning: number;
    unknown: number; // 🔧 수정: 'offline' → 'unknown' (일관성)
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
  console.log('🔥 useServerDashboard 훅이 실행되었습니다!');
  const { onStatsUpdate } = options;

  // 🚀 Web Worker 통계 계산 Hook (비동기 성능 최적화)
  const { calculateStats: calculateStatsWorker, isWorkerReady } = useWorkerStats();

  // Zustand 스토어에서 서버 데이터 가져오기
  const rawServers = useServerDataStore((state) => {
    console.log('🔍 스토어에서 servers 선택:', state.servers?.length || 0, '개');
    return state.servers;
  });

  // 🛡️ AI 교차검증 기반: previousServers 캐시로 Race Condition 방지
  const previousServersRef = useRef<EnhancedServerMetrics[]>([]);

  // Double-check null safety: 스토어 데이터가 유효한 경우에만 캐시 업데이트
  const servers = useMemo(() => {
    console.log('🛡️ 서버 데이터 안전성 검사:', {
      rawServers_exists: !!rawServers,
      rawServers_length: rawServers?.length || 0,
      rawServers_isArray: Array.isArray(rawServers),
      cache_length: previousServersRef.current.length
    });

    // AI 사이드바 오픈 시 빈 배열이 되는 Race Condition 방지
    if (!rawServers || !Array.isArray(rawServers) || rawServers.length === 0) {
      console.log('⚠️ 서버 데이터 없음 - 캐시된 데이터 사용:', previousServersRef.current.length, '개');
      return previousServersRef.current;
    }

    // 유효한 데이터인 경우 캐시 업데이트
    console.log('✅ 서버 데이터 유효 - 캐시 업데이트:', rawServers.length, '개');
    previousServersRef.current = rawServers;
    return rawServers;
  }, [rawServers]);

  const isLoading = useServerDataStore((state) => {
    console.log('🔍 스토어에서 isLoading 선택:', state.isLoading);
    return state.isLoading;
  });
  const error = useServerDataStore((state) => state.error);
  const fetchServers = useServerDataStore((state) => {
    console.log('🔍 fetchServers 함수 선택됨');
    return state.fetchServers;
  });
  const startAutoRefresh = useServerDataStore(
    (state) => state.startAutoRefresh
  );
  const stopAutoRefresh = useServerDataStore((state) => state.stopAutoRefresh);

  // 즉시 fetchServers 실행 (조건부)
  if ((!servers || (!Array.isArray(servers) || servers.length === 0)) && !isLoading && fetchServers) {
    console.log('🚀 즉시 fetchServers 실행 - 서버 데이터 없음');
    setTimeout(() => {
      console.log('⏰ setTimeout으로 fetchServers 호출');
      fetchServers();
    }, 100);
  }

  // 페이지네이션 상태 - 설정 기반으로 동적 조정
  const [currentPage, setCurrentPage] = useState(1);
  // 🚀 화면 크기에 따른 초기 페이지 크기 설정
  const getInitialPageSize = () => {
    if (typeof window === 'undefined') return 6;
    const width = window.innerWidth;
    if (width < 640) return 3; // 모바일: 3개
    if (width < 1024) return 6; // 태블릿: 6개
    return 6; // 데스크톱: 6개 (기본값)
  };

  const [pageSize, setPageSize] = useState(getInitialPageSize);

  console.log('📍 useEffect 실행 직전:', {
    fetchServers: typeof fetchServers,
    startAutoRefresh: typeof startAutoRefresh,
    stopAutoRefresh: typeof stopAutoRefresh
  });

  // 🎯 서버 설정에 따른 동적 페이지 크기 설정
  const ITEMS_PER_PAGE = useMemo(() => {
    // 📊 실제 서버 생성 개수 (데이터 생성기에서 만드는 서버 수)
    const ACTUAL_SERVER_COUNT = ACTIVE_SERVER_CONFIG.maxServers; // 15개

    // 🖥️ 화면 표시 설정 (한 페이지에 보여줄 카드 수)
    const DISPLAY_OPTIONS = {
      SHOW_ALL: ACTUAL_SERVER_COUNT, // 모든 서버 표시 (8개)
      SHOW_HALF: Math.ceil(ACTUAL_SERVER_COUNT / 2), // 절반씩 표시 (4개)
      SHOW_QUARTER: Math.ceil(ACTUAL_SERVER_COUNT / 4), // 1/4씩 표시 (2개)
      SHOW_THIRD: Math.ceil(ACTUAL_SERVER_COUNT / 3), // 1/3씩 표시 (3개)
    };

    debug.log('🎯 서버 표시 설정:', {
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
    debug.log('📊 페이지 크기 변경:', {
      이전_크기: pageSize,
      새_크기: newSize,
    });
  };

  // 선택된 서버 상태
  const [selectedServer, setSelectedServer] = useState<Server | null>(null);

  // 서버 메트릭 훅
  const { metricsHistory } = useServerMetrics();

  // 🕐 Supabase에서 24시간 데이터를 직접 제공하므로 시간 회전 시스템 제거됨

  // 🎨 화면 크기 변경 시 페이지 크기 자동 조정
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      let newPageSize: number;

      if (width < 640) {
        newPageSize = 6; // 모바일 (적어도 6개)
      } else if (width < 1024) {
        newPageSize = 9; // 태블릿 (9개)
      } else {
        newPageSize = 15; // 데스크톱 (15개 모두 표시)
      }

      // 현재 페이지 크기와 다르면 업데이트
      if (newPageSize !== pageSize && pageSize <= 15) {
        // 사용자가 수동으로 변경한 경우도 반영
        setPageSize(newPageSize);
      }
    };

    // 초기 실행 및 리스너 등록
    handleResize();
    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, []); // 의존성 배열을 비워서 초기에만 리스너 등록

  // 🚀 최적화된 서버 데이터 로드 및 자동 갱신 설정
  useEffect(() => {
    console.log('🔧 useServerDashboard useEffect 실행됨');
    console.log('📊 현재 서버 상태:', {
      servers_length: servers?.length || 0,
      servers_exists: !!servers,
      fetchServers_type: typeof fetchServers,
      startAutoRefresh_type: typeof startAutoRefresh
    });
    
    // 즉시 한 번 fetchServers 호출 (조건 없이)
    console.log('⚡ fetchServers 즉시 호출 시작');
    fetchServers()
      .then(() => {
        if (process.env.NODE_ENV !== 'production') {
          console.log('✅ fetchServers 호출 성공');
        }
      })
      .catch((err) => {
        if (process.env.NODE_ENV !== 'production') {
          console.error('❌ fetchServers 호출 실패:', err);
        }
      });

    // 자동 갱신 시작 (5-10분 주기로 최적화됨)
    console.log('🔄 서버 데이터 자동 갱신 시작 (5-10분 주기)');
    startAutoRefresh();

    // 컴포넌트 언마운트 시 자동 갱신 중지
    return () => {
      console.log('🛑 서버 데이터 자동 갱신 중지');
      stopAutoRefresh();
    };
  }, []); // 빈 의존성 배열로 마운트 시 한 번만 실행

  // 실제 서버 데이터 사용 (메모이제이션 + 🕐 시간 기반 메트릭 변화)
  const actualServers = useMemo(() => {
    if (!servers || (!Array.isArray(servers) || servers.length === 0)) {
      return [];
    }

    // EnhancedServerMetrics를 Server 타입으로 변환 (고정 시간별 데이터 사용)
    return servers.map((server: unknown): Server => {
      const s = server as EnhancedServerData;

      // 고정 시간별 데이터에서 이미 시간 기반 메트릭이 적용되어 있음
      // 추가 시간 배율 적용 없이 데이터 그대로 사용
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
        status: s.status === 'running' ? 'online' : s.status as 'online' | 'warning' | 'critical' | 'unknown', // 🔧 수정: 'offline' → 'unknown' (일관성)
        // 고정 시간별 데이터의 메트릭 그대로 사용
        cpu: cpu,
        memory: memory,
        disk: disk,
        network: network,
        uptime: s.uptime || 0,
        location: s.location || 'Unknown',
        alerts: serverTypeGuards.getAlerts(s?.alerts),
        ip: s.ip || '192.168.1.1',
        os: s.os || 'Ubuntu 22.04 LTS',
        type: s.type || s.role || 'worker',
        environment: s.environment || 'production',
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
            ? 'healthy'
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
              ? 'healthy'
              : s.status === 'warning'
                ? 'warning'
                : 'critical',
        },
      };
    });
  }, [servers]); // 고정 시간별 데이터 사용으로 시간 회전 의존성 제거

  // 🏗️ Clean Architecture: 페이지네이션 도메인 로직 (순수 함수)
  const { paginatedItems: paginatedServers, totalPages } = useMemo(() => {
    return calculatePagination(actualServers as Server[], currentPage, ITEMS_PER_PAGE);
  }, [actualServers, currentPage, ITEMS_PER_PAGE]);

  // 🚀 Web Worker 기반 비동기 통계 계산 상태
  const [workerStats, setWorkerStats] = useState<ServerStats | null>(null);
  const [isCalculatingStats, setIsCalculatingStats] = useState(false);

  // 🛡️ 안전한 Web Worker 계산 관리 (useEffect로 분리)
  useEffect(() => {
    if (!actualServers || actualServers.length === 0) {
      setWorkerStats(null);
      return;
    }

    // Web Worker 사용 조건: 준비 완료 + 10개 이상 서버
    if (isWorkerReady() && actualServers.length >= 10) {
      if (!isCalculatingStats) {
        console.log('🚀 Web Worker 비동기 계산 시작:', actualServers.length, '개 서버');
        setIsCalculatingStats(true);

        calculateStatsWorker(actualServers as EnhancedServerData[])
          .then((workerResult) => {
            console.log('✅ Web Worker 계산 완료:', workerResult.performanceMetrics);
            const adaptedStats = adaptWorkerStatsToLegacy(workerResult);
            setWorkerStats(adaptedStats);
            setIsCalculatingStats(false);
          })
          .catch((error) => {
            console.error('❌ Web Worker 계산 실패, Fallback으로 대체:', error);
            const fallbackStats = calculateServerStats(actualServers as EnhancedServerData[]);
            setWorkerStats(fallbackStats);
            setIsCalculatingStats(false);
          });
      }
    } else {
      // 조건 미충족 시 동기 계산 결과 저장
      console.log('🔄 동기 계산 사용 (Worker 미준비 또는 서버 <10개):', {
        workerReady: isWorkerReady(),
        serverCount: actualServers.length
      });
      const syncStats = calculateServerStats(actualServers as EnhancedServerData[]);
      setWorkerStats(syncStats);
    }
  }, [actualServers, isWorkerReady, calculateStatsWorker, isCalculatingStats]);

  // 🏗️ Clean Architecture: 순수 동기 stats 반환 (useMemo)
  const stats = useMemo(() => {
    if (!actualServers || actualServers.length === 0) {
      return {
        total: 0, online: 0, unknown: 0, warning: 0, critical: 0, // 🔧 수정: 'offline' → 'unknown' (일관성)
        avgCpu: 0, avgMemory: 0, avgDisk: 0
      };
    }

    // Web Worker 결과 우선, 없으면 즉시 동기 계산
    return workerStats || calculateServerStats(actualServers as EnhancedServerData[]);
  }, [actualServers, workerStats]);

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
  }, [stats, onStatsUpdate]); // onStatsUpdate 함수 의존성 복구

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

  // 🚀 최적화된 로딩 상태 - 실제 로딩 중이고 데이터가 없을 때만 true
  const optimizedIsLoading = isLoading && actualServers.length === 0;

  console.log('🎯 useServerDashboard 리턴 직전:', {
    actualServers_length: actualServers.length,
    paginatedServers_length: paginatedServers.length,
    optimizedIsLoading,
    stats
  });

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
    pageSize,
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
    // 🛡️ AI 교차검증: servers 배열 안전성 검증
    if (!servers || !Array.isArray(servers) || servers.length === 0) {
      return [];
    }
    return Array.from(new Set(servers.map((server) => server.location))).sort();
  }, [servers]);

  // 🔍 필터링된 서버
  const filteredServers = useMemo(() => {
    // 🛡️ AI 교차검증: servers 배열 안전성 검증
    if (!servers || !Array.isArray(servers) || servers.length === 0) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('⚠️ useEnhancedServerDashboard: servers 배열이 비어있거나 유효하지 않음');
      }
      return [];
    }

    return servers.filter((server) => {
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
    // 🛡️ AI 교차검증: filteredServers 안전성 검증
    const safeLength = (filteredServers && Array.isArray(filteredServers)) ? filteredServers.length : 0;
    return Math.ceil(safeLength / displayConfig.cardsPerPage);
  }, [filteredServers, displayConfig.cardsPerPage]);

  // 📊 페이지네이션된 서버
  const paginatedServers = useMemo(() => {
    // 🛡️ AI 교차검증: filteredServers 안전성 검증
    if (!filteredServers || !Array.isArray(filteredServers) || filteredServers.length === 0) {
      return [];
    }

    const startIndex = (currentPage - 1) * displayConfig.cardsPerPage;
    const endIndex = startIndex + displayConfig.cardsPerPage;
    return filteredServers.slice(startIndex, endIndex);
  }, [filteredServers, currentPage, displayConfig.cardsPerPage]);

  // 📊 표시 정보 생성 (UI/UX 개선)
  const displayInfo = useMemo(() => {
    // 🛡️ AI 교차검증: filteredServers.length 안전성 검증
    const safeFilteredLength = (filteredServers && Array.isArray(filteredServers)) ? filteredServers.length : 0;
    return generateDisplayInfo(
      displayMode,
      currentPage,
      safeFilteredLength
    );
  }, [displayMode, currentPage, filteredServers]);

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
    debug.log('🎯 Enhanced 서버 대시보드 상태:', {
      전체_서버_수: Array.isArray(servers) ? servers.length : 0,
      필터링된_서버_수: (filteredServers && Array.isArray(filteredServers)) ? filteredServers.length : 0,
      현재_페이지: currentPage,
      총_페이지: totalPages,
      표시_모드: displayMode,
      표시_설정: displayConfig,
      그리드_레이아웃: gridLayout,
      표시_정보: displayInfo,
    });
  }, [
    Array.isArray(servers) ? servers.length : 0,
    (filteredServers && Array.isArray(filteredServers)) ? filteredServers.length : 0,
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
