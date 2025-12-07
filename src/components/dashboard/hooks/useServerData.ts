/**
 * 🔧 useServerData Hook
 *
 * ⚠️ 중요: 이 파일은 ServerDashboard 핵심 모듈입니다 - 삭제 금지!
 *
 * 서버 데이터 관리 전용 훅 (Refactored)
 * - 전역 serverDataStore 사용 (Single Source of Truth)
 * - 실시간 데이터 동기화 보장
 * - 불필요한 로컬 상태 및 목업 제거
 *
 * 📍 사용처:
 * - src/components/dashboard/ServerDashboard.tsx (메인 대시보드)
 *
 * 🔄 의존성:
 * - @/components/providers/StoreProvider (전역 스토어)
 * - ../types/dashboard.types (타입 정의)
 * - ../../../types/server (Server 타입)
 *
 * 📅 수정일: 2025.12.07 (데이터 소스 통합 리팩토링)
 */

import { useCallback, useEffect, useState } from 'react';
import { useServerDataStore } from '@/components/providers/StoreProvider';
import type { Server, EnhancedServerMetrics } from '@/types/server';
import type { DashboardStats, ServerFilters } from '../types/dashboard.types';

// 🔄 기존 useServerDashboard와의 호환성을 위한 인터페이스 확장
export interface UseServerDataReturn {
  servers: EnhancedServerMetrics[];
  stats: DashboardStats;
  loading: boolean;
  error: string | null;
  lastUpdate: Date;
  refreshData: () => void;
  filterServers: (servers: EnhancedServerMetrics[], filters: ServerFilters) => EnhancedServerMetrics[];
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
  // 🎯 전역 스토어 구독
  const servers = useServerDataStore((state) => state.servers);
  const isLoadingStore = useServerDataStore((state) => state.isLoading);
  const errorStore = useServerDataStore((state) => state.error);
  const lastUpdateStore = useServerDataStore((state) => state.lastUpdate);
  const fetchServers = useServerDataStore((state) => state.fetchServers);
  const startAutoRefresh = useServerDataStore((state) => state.startAutoRefresh);
  const stopAutoRefresh = useServerDataStore((state) => state.stopAutoRefresh);

  // 로컬 로딩 상태 (초기 로드용)
  const [isInitialLoading, setIsInitialLoading] = useState(true);

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

  // 데이터 초기화 및 자동 갱신 시작
  useEffect(() => {
    const initData = async () => {
      try {
        // 데이터가 없으면 로드
        if (servers.length === 0) {
          await fetchServers();
        }
        // 자동 갱신 시작 (스토어 내부에서 중복 실행 방지됨)
        startAutoRefresh();
      } catch (error) {
        console.error('Failed to initialize server data:', error);
      } finally {
        setIsInitialLoading(false);
      }
    };

    initData();

    return () => {
      // 페이지를 떠날 때 갱신 중지 (리소스 절약)
      stopAutoRefresh();
    };
  }, [fetchServers, startAutoRefresh, stopAutoRefresh, servers.length]);

  // 서버 우선순위 정렬 (심각→경고→정상)
  const sortServersByPriority = useCallback((servers: EnhancedServerMetrics[]): EnhancedServerMetrics[] => {
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
  }, []);

  // 통계 계산 함수
  const calculateStats = useCallback((servers: EnhancedServerMetrics[]): DashboardStats => {
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
  }, [mapStatus]);

  // 서버 필터링 함수
  const filterServers = useCallback(
    (servers: EnhancedServerMetrics[], filters: ServerFilters): EnhancedServerMetrics[] => {
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
    void fetchServers();
  }, [fetchServers]);

  const batchedRefreshData = useCallback(async () => {
    await fetchServers();
  }, [fetchServers]);

  // 정렬된 서버 목록
  const sortedServers = sortServersByPriority(servers);

  // 통계 계산
  const stats = calculateStats(servers);

  const loading = isLoadingStore || isInitialLoading;
  const lastUpdate = lastUpdateStore || new Date();

  return {
    servers: sortedServers,
    stats,
    loading,
    error: errorStore,
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
