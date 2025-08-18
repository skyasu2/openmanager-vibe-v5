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

import { STATIC_ERROR_SERVERS } from '@/config/fallback-data';
import { useRealtimeServers } from '@/hooks/api/useRealtimeServers';
import type { Server } from '@/types/server';
import { useCallback, useEffect, useState } from 'react';
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
}

export const useServerData = (): UseServerDataReturn => {
  const [servers, setServers] = useState<Server[]>(fallbackServers);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // 실시간 서버 데이터 훅 사용
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
  const _initializeData = useCallback(async () => {
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
                  type: 'unknown',
                  environment: 'unknown',
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
          (acc as Record<string, number>)[server.status]++;
        } else {
          // 미지원 상태는 warning으로 분류
          acc.warning++;
        }
        return acc;
      },
      { total: 0, online: 0, warning: 0, offline: 0 }
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

  // 데이터 새로고침 함수
  const refreshData = useCallback(() => {
    _initializeData();
  }, [_initializeData]);

  // 초기 데이터 로드
  useEffect(() => {
    _initializeData();
  }, [_initializeData]);

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
  };
};
