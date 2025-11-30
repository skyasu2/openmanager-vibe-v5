/**
 * 🔧 useServerData Hook
 *
 * ⚠️ 중요: 이 파일은 ServerDashboard 핵심 모듈입니다 - 삭제 금지!
 *
 * 서버 데이터 관리 전용 훅
 * - 실시간 데이터 페칭
 * - 캐싱 및 상태 관리
 * - 에러 처리 및 폴백
 *
 * 📍 사용처:
 * - src/components/dashboard/ServerDashboard.tsx (메인 대시보드)
 * - src/components/dashboard/server-dashboard/ (하위 컴포넌트들)
 * - src/hooks/useServerDashboard.ts (기존 훅에서 호출)
 *
 * 🔄 의존성:
 * - @/hooks/api/useRealtimeServers (실시간 데이터)
 * - ../types/dashboard.types (타입 정의)
 * - ../../../types/server (Server 타입)
 *
 * 📅 생성일: 2025.06.14 (ServerDashboard 1522줄 분리 작업)
 */

import { useCallback, useEffect, useState } from 'react';
import { STATIC_ERROR_SERVERS } from '@/config/fallback-data';
import { useRealtimeServers } from '@/hooks/api/useRealtimeServers';
import { createTimerTask, useUnifiedTimer } from '@/hooks/useUnifiedTimer';
// 🚀 Vercel 최적화: API 배칭 + 통합 타이머 시스템 통합
import { getAPIBatcher } from '@/lib/api/api-batcher';
import type { Server, ServerEnvironment, ServerRole } from '@/types/server';
import type { DashboardStats, ServerFilters } from '../types/dashboard.types';

// 🎯 통합된 폴백 서버 데이터 사용 (하드코딩 제거)
const fallbackServers: Server[] = STATIC_ERROR_SERVERS;

// 🔄 기존 useServerDashboard와의 호환성을 위한 인터페이스 확장
export interface UseServerDataReturn {
  servers: Server[];
  stats: DashboardStats;
  loading: boolean;
  error: string | null;
  lastUpdate: Date;
  refreshData: () => void;
  filterServers: (servers: Server[], filters: ServerFilters) => Server[];
  mapStatus: (status: string) => 'online' | 'offline' | 'warning';

  // 기존 useServerDashboard 호환성
  isLoading?: boolean;
  sortedServers?: Server[];
  filteredServers?: Server[];

  // 🚀 Vercel 최적화: 실시간 업데이트 배칭 상태 정보
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
  const [servers, setServers] = useState<Server[]>(fallbackServers);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // 🚀 Vercel 최적화: 통합 타이머 시스템 사용
  const timer = useUnifiedTimer(2000); // 2초 기본 간격으로 배칭 최적화

  // 실시간 서버 데이터 훅 사용 (기존 호환성 유지)
  const { servers: realtimeData, isLoading: realtimeLoading } =
    useRealtimeServers();

  // 서버 상태 매핑 함수
  const mapStatus = useCallback(
    (status: string): 'online' | 'offline' | 'warning' => {
      switch (status.toLowerCase()) {
        case 'healthy':
        case 'running':
        case 'active':
          return 'online';
        case 'unhealthy':
        case 'stopped':
        case 'inactive':
        case 'down':
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

  // 데이터 초기화 함수
  const _initializeData = useCallback(() => {
    try {
      setLoading(true);
      setError(null);

      // 🛡️ 안전한 데이터 처리 - 배열 타입 검증
      let safeServers: Server[] = [];

      // 실시간 데이터가 있으면 사용, 없으면 폴백 데이터 사용
      if (realtimeData) {
        if (Array.isArray(realtimeData)) {
          const mappedServers = realtimeData.map((server: unknown) => {
            if (typeof server !== 'object' || server === null) {
              // 필수 속성들을 모두 포함한 기본 서버 객체 반환
              return (
                fallbackServers[0] ||
                ({
                  id: 'unknown',
                  name: 'Unknown Server',
                  hostname: 'unknown',
                  status: 'offline' as const,
                  cpu: 0,
                  memory: 0,
                  disk: 0,
                  network: 0,
                  uptime: 0,
                  location: 'Unknown',
                  alerts: 0,
                  ip: '0.0.0.0',
                  os: 'Unknown',
                  role: 'worker' as ServerRole,
                  environment: 'production' as ServerEnvironment,
                  provider: 'unknown',
                  lastUpdate: new Date(),
                } as Server)
              );
            }
            const s = server as Record<string, unknown>;
            return {
              ...s,
              status: mapStatus((s.status as string) || 'unknown'),
              lastUpdate: new Date(),
            } as Server;
          });
          safeServers = mappedServers;
        } else {
          console.warn(
            '⚠️ realtimeData가 배열이 아닙니다:',
            typeof realtimeData,
            realtimeData
          );
          safeServers = fallbackServers;
        }
      } else {
        // 폴백 데이터 사용
        safeServers = fallbackServers;
      }

      // 🛡️ 최종 배열 검증
      if (!Array.isArray(safeServers)) {
        console.error('❌ safeServers가 배열이 아닙니다:', typeof safeServers);
        safeServers = fallbackServers;
      }

      setServers(safeServers);
      setLastUpdate(new Date());
    } catch (err) {
      console.error('서버 데이터 초기화 실패:', err);
      setError('서버 데이터를 불러올 수 없습니다.');
      setServers(fallbackServers); // 에러 시 폴백 데이터 사용
    } finally {
      setLoading(false);
    }
  }, [realtimeData, mapStatus]);

  // 서버 우선순위 정렬 (심각→경고→정상)
  const sortServersByPriority = useCallback((servers: Server[]): Server[] => {
    const priorityOrder: Record<string, number> = {
      offline: 0,
      warning: 1,
      online: 2,
      healthy: 2,
      critical: 0,
      unhealthy: 0,
    };

    return [...servers].sort((a, b) => {
      const priorityA = priorityOrder[a.status] ?? 1;
      const priorityB = priorityOrder[b.status] ?? 1;

      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }

      // 같은 우선순위면 알림 수로 정렬
      const getAlertCount = (s: Server): number => {
        if (typeof s.alerts === 'number') return s.alerts;
        if (Array.isArray(s.alerts)) return s.alerts.length;
        return 0;
      };

      return getAlertCount(b) - getAlertCount(a);
    });
  }, []);

  // 통계 계산 함수
  const calculateStats = useCallback((servers: Server[]): DashboardStats => {
    const stats = servers.reduce(
      (acc, server) => {
        acc.total++;
        // 안전한 인덱스 접근
        if (server.status in acc) {
          const accRecord = acc as Record<string, number>;
          if (accRecord[server.status] !== undefined) {
            accRecord[server.status] = (accRecord[server.status] ?? 0) + 1;
          }
        } else {
          // 미지원 상태는 warning으로 분류
          acc.warning++;
        }
        return acc;
      },
      { total: 0, online: 0, warning: 0, offline: 0, unknown: 0 }
    );

    return stats;
  }, []);

  // 서버 필터링 함수
  const filterServers = useCallback(
    (servers: Server[], filters: ServerFilters): Server[] => {
      return servers.filter((server) => {
        // 상태 필터
        if (
          filters.status &&
          filters.status !== 'all' &&
          server.status !== filters.status
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
    []
  );

  // 🚀 Vercel 최적화: API 배칭을 사용한 실시간 업데이트
  const batchedRefreshData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const batcher = getAPIBatcher();

      // 다중 API 엔드포인트를 배칭으로 호출
      const [serversResponse, _statusResponse, _metricsResponse] =
        await Promise.allSettled([
          batcher.request({
            id: 'servers-all',
            endpoint: '/api/servers/all',
            priority: 'high', // 서버 데이터는 높은 우선순위
          }),
          batcher.request({
            id: 'system-status',
            endpoint: '/api/system/status',
            priority: 'normal',
          }),
          batcher.request({
            id: 'server-metrics',
            endpoint: '/api/servers/metrics',
            priority: 'normal',
          }),
        ]);

      // 서버 데이터 처리
      if (
        serversResponse.status === 'fulfilled' &&
        serversResponse.value.data
      ) {
        const serverData = Array.isArray(serversResponse.value.data)
          ? serversResponse.value.data
          : fallbackServers;

        const mappedServers = serverData.map((server: Server) => ({
          ...server,
          status: mapStatus(server.status || 'unknown'),
          lastUpdate: new Date(),
        }));

        setServers(mappedServers);
        setLastUpdate(new Date());
      } else {
        // API 실패 시 폴백 데이터 사용 (기존 호환성)
        if (realtimeData && Array.isArray(realtimeData)) {
          const mappedServers = realtimeData.map((server: Server) => ({
            ...server,
            status: mapStatus(server.status || 'unknown'),
            lastUpdate: new Date(),
          }));
          setServers(mappedServers);
        } else {
          setServers(fallbackServers);
        }
      }
    } catch (error) {
      console.error('🚨 Batched data refresh failed:', error);
      setError('서버 데이터를 불러올 수 없습니다.');
      // 에러 시에도 폴백 데이터 유지
      setServers(fallbackServers);
    } finally {
      setLoading(false);
    }
  }, [realtimeData, mapStatus]);

  // 기존 호환성을 위한 refreshData 함수 (통합 타이머 사용)
  const refreshData = useCallback(() => {
    // 즉시 실행이 아닌 타이머 기반 배칭 업데이트 트리거
    timer.registerTask(
      createTimerTask.customTask(
        'manual-refresh',
        100, // 100ms 후 실행
        batchedRefreshData,
        { priority: 'high' }
      )
    );
  }, [timer, batchedRefreshData]);

  // 🚀 Vercel 최적화: 통합 타이머 시스템으로 실시간 업데이트 관리
  useEffect(() => {
    // 초기 데이터 로드 (기존 호환성)
    _initializeData();

    // 실시간 배칭 업데이트 타이머 등록 (5초마다)
    timer.registerTask(
      createTimerTask.customTask(
        'realtime-batch-update',
        5000, // 5초마다 실행 (Vercel 무료 티어 고려)
        batchedRefreshData,
        {
          priority: 'normal',
          maxRetries: 3,
        }
      )
    );

    // 시스템 상태 체크 (30초마다)
    timer.registerTask(
      createTimerTask.systemStatus(async () => {
        try {
          const batcher = getAPIBatcher();
          await batcher.request({
            id: 'health-check',
            endpoint: '/api/health',
            priority: 'low',
          });
          console.log('✅ System health check completed');
        } catch (error) {
          console.warn('⚠️ System health check failed:', error);
        }
      })
    );

    // 컴포넌트 언마운트 시 타이머 정리
    return () => {
      timer.unregisterTask('realtime-batch-update');
      timer.unregisterTask('system-status');
      console.log(`🧹 Cleaned up timers for component ${timer.componentId}`);
    };
  }, [_initializeData, timer, batchedRefreshData]);

  // 정렬된 서버 목록
  const sortedServers = sortServersByPriority(servers);

  // 통계 계산
  const stats = calculateStats(servers);

  return {
    servers: sortedServers,
    stats,
    loading: loading || realtimeLoading,
    error,
    lastUpdate,
    refreshData,
    filterServers,
    mapStatus,

    // 기존 useServerDashboard 호환성
    isLoading: loading || realtimeLoading,
    sortedServers,
    filteredServers: sortedServers, // 기본적으로 정렬된 서버 반환

    // 🚀 Vercel 최적화: 실시간 배칭 업데이트 정보
    timerStats: timer.getTimerStats(),
    batchedRefreshData,
  };
};
