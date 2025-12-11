import { useCallback, useEffect, useState } from 'react';
import { useServerQuery } from '@/hooks/useServerQuery';
import type { EnhancedServerMetrics } from '@/types/server';
import type { DashboardStats, ServerFilters } from '../types/dashboard.types';

// 🔄 기존 useServerDashboard와의 호환성을 위한 인터페이스 확장
export interface UseServerDataReturn {
  servers: EnhancedServerMetrics[];
  stats: DashboardStats;
  loading: boolean;
  error: string | null;
  lastUpdate: Date;
  refreshData: () => void;
  filterServers: (
    servers: EnhancedServerMetrics[],
    filters: ServerFilters
  ) => EnhancedServerMetrics[];
  mapStatus: (status: string) => 'online' | 'offline' | 'warning';

  // 기존 useServerDashboard 호환성
  isLoading?: boolean;
  sortedServers?: EnhancedServerMetrics[];
  filteredServers?: EnhancedServerMetrics[];

  // 🚀 Vercel 최적화: 실시간 업데이트 배칭 상태 정보 (호환성 유지)
  timerStats?: {
    activeTasks: number;
    totalTasks: number;
    isRunning: boolean;
    memoryUsage: number;
    componentId: string;
    memoryUsagePercent: number;
    isMemoryOptimal: boolean;
  };
  batchedRefreshData?: () => Promise<void>;
}

export const useServerData = (): UseServerDataReturn => {
  // 🎯 React Query로 데이터 가져오기
  const { data: servers = [], isLoading, error: queryError, refetch } = useServerQuery();
  const error = queryError ? queryError.message : null;
  const lastUpdate = new Date(); // React Query handles cache time, simplified here

  // 로컬 로딩 상태 (초기 로드용) - React Query isLoading으로 대체 가능하지만 호환성 유지를 위해 남김
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  useEffect(() => {
      if (!isLoading) {
          setIsInitialLoading(false);
      }
  }, [isLoading]);


  // 서버 상태 매핑 함수
  const mapStatus = useCallback(
    (status: string): 'online' | 'offline' | 'warning' => {
      switch (status.toLowerCase()) {
        case 'healthy':
        case 'running':
        case 'active':
        case 'online':
          return 'online';
        case 'unhealthy':
        case 'stopped':
        case 'inactive':
        case 'down':
        case 'offline':
        case 'critical':
          return 'offline';
        case 'degraded':
        case 'warning':
        case 'maintenance':
          return 'warning';
        default:
          return 'warning';
      }
    },
    []
  );


  // React Query handles auto-refresh via refetchInterval


  // 서버 우선순위 정렬 (심각→경고→정상)
  const sortServersByPriority = useCallback(
    (servers: EnhancedServerMetrics[]): EnhancedServerMetrics[] => {
      const priorityOrder: Record<string, number> = {
        offline: 0,
        critical: 0,
        unhealthy: 0,
        warning: 1,
        degraded: 1,
        maintenance: 1,
        online: 2,
        healthy: 2,
        running: 2,
        active: 2,
      };

      return [...servers].sort((a, b) => {
        const priorityA = priorityOrder[a.status] ?? 1;
        const priorityB = priorityOrder[b.status] ?? 1;

        if (priorityA !== priorityB) {
          return priorityA - priorityB;
        }

        // 같은 우선순위면 알림 수로 정렬
        const getAlertCount = (s: EnhancedServerMetrics): number => {
          if (typeof s.alerts === 'number') return s.alerts;
          if (Array.isArray(s.alerts)) return s.alerts.length;
          return 0;
        };

        return getAlertCount(b) - getAlertCount(a);
      });
    },
    []
  );

  // 통계 계산 함수
  const calculateStats = useCallback(
    (servers: EnhancedServerMetrics[]): DashboardStats => {
      const stats = servers.reduce(
        (acc, server) => {
          acc.total++;
          const status = mapStatus(server.status);
          if (status === 'online') acc.online++;
          else if (status === 'warning') acc.warning++;
          else if (status === 'offline') acc.offline++;
          else acc.unknown++;
          return acc;
        },
        { total: 0, online: 0, warning: 0, offline: 0, unknown: 0 }
      );

      return stats;
    },
    [mapStatus]
  );

  // 서버 필터링 함수
  const filterServers = useCallback(
    (
      servers: EnhancedServerMetrics[],
      filters: ServerFilters
    ): EnhancedServerMetrics[] => {
      return servers.filter((server) => {
        // 상태 필터
        if (
          filters.status &&
          filters.status !== 'all' &&
          mapStatus(server.status) !== mapStatus(filters.status)
        ) {
          return false;
        }

        // 위치 필터
        if (
          filters.location &&
          !(server.location ?? '')
            .toLowerCase()
            .includes(filters.location.toLowerCase())
        ) {
          return false;
        }

        // 검색어 필터
        if (filters.searchTerm) {
          const searchLower = filters.searchTerm.toLowerCase();
          return (
            server.name.toLowerCase().includes(searchLower) ||
            (server.location ?? '').toLowerCase().includes(searchLower) ||
            server.id.toLowerCase().includes(searchLower)
          );
        }

        return true;
      });
    },
    [mapStatus]
  );

  // 호환성을 위한 래퍼 함수
  const refreshData = useCallback(() => {
    void refetch();
  }, [refetch]);

  const batchedRefreshData = useCallback(async () => {
    await refetch();
  }, [refetch]);

  // 정렬된 서버 목록
  const sortedServers = sortServersByPriority(servers);

  // 통계 계산
  const stats = calculateStats(servers);

  const loading = isLoading || isInitialLoading;
  
  return {
    servers: sortedServers,
    stats,
    loading,
    error,
    lastUpdate,
    refreshData,
    filterServers,
    mapStatus,

    // 기존 useServerDashboard 호환성
    isLoading: loading,
    sortedServers,
    filteredServers: sortedServers,

    // 🚀 호환성 유지 (더미 데이터)
    timerStats: {
      activeTasks: 0,
      totalTasks: 0,
      isRunning: true,
      memoryUsage: 0,
      componentId: 'server-dashboard',
      memoryUsagePercent: 0,
      isMemoryOptimal: true,
    },
    batchedRefreshData,
  };
};
