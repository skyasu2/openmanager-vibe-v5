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

import { useState, useEffect, useCallback } from 'react';
import { Server } from '../../../types/server';
import { useRealtimeServers } from '@/hooks/api/useRealtimeServers';
import { DashboardStats, ServerFilters } from '../types/dashboard.types';

// 🎯 심각→경고→정상 순으로 정렬된 목업 서버 데이터
const fallbackServers: Server[] = [
  // 🚨 심각 상태 (offline) 서버들
  {
    id: 'api-jp-040',
    name: 'api-jp-040',
    status: 'offline',
    location: 'Asia Pacific',
    cpu: 95,
    memory: 98,
    disk: 85,
    network: 85,
    networkStatus: 'offline',
    uptime: '0분',
    lastUpdate: new Date(),
    alerts: 5,
    services: [
      { name: 'nginx', status: 'stopped', port: 80 },
      { name: 'nodejs', status: 'stopped', port: 3000 },
      { name: 'gunicorn', status: 'stopped', port: 8000 },
      { name: 'uwsgi', status: 'stopped', port: 8080 },
    ],
  },
  {
    id: 'api-sg-044',
    name: 'api-sg-044',
    status: 'offline',
    location: 'Singapore',
    cpu: 88,
    memory: 92,
    disk: 78,
    network: 78,
    networkStatus: 'offline',
    uptime: '0분',
    lastUpdate: new Date(),
    alerts: 4,
    services: [
      { name: 'nodejs', status: 'stopped', port: 3000 },
      { name: 'nginx', status: 'stopped', port: 80 },
    ],
  },
  // ⚠️ 경고 상태 (warning) 서버들
  {
    id: 'api-eu-045',
    name: 'api-eu-045',
    status: 'warning',
    location: 'EU West',
    cpu: 78,
    memory: 85,
    disk: 68,
    network: 65,
    networkStatus: 'poor',
    uptime: '8일 12시간',
    lastUpdate: new Date(),
    alerts: 2,
    services: [
      { name: 'nodejs', status: 'stopped', port: 3000 },
      { name: 'nginx', status: 'running', port: 80 },
      { name: 'gunicorn', status: 'running', port: 8000 },
    ],
  },
  // ✅ 정상 상태 (online) 서버들
  {
    id: 'api-us-001',
    name: 'api-us-001',
    status: 'online',
    location: 'US East',
    cpu: 45,
    memory: 62,
    disk: 35,
    network: 25,
    networkStatus: 'excellent',
    uptime: '45일 18시간',
    lastUpdate: new Date(),
    alerts: 0,
    services: [
      { name: 'nginx', status: 'running', port: 80 },
      { name: 'nodejs', status: 'running', port: 3000 },
    ],
  },
];

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
  const initializeData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // 🛡️ 안전한 데이터 처리 - 배열 타입 검증
      let safeServers: Server[] = [];

      // 실시간 데이터가 있으면 사용, 없으면 폴백 데이터 사용
      if (realtimeData) {
        if (Array.isArray(realtimeData)) {
          const mappedServers = realtimeData.map((server: any) => ({
            ...server,
            status: mapStatus(server.status || 'unknown'),
            lastUpdate: new Date(),
          }));
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
    const priorityOrder = { offline: 0, warning: 1, online: 2 };

    return [...servers].sort((a, b) => {
      const priorityA = priorityOrder[a.status] ?? 1;
      const priorityB = priorityOrder[b.status] ?? 1;

      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }

      // 같은 우선순위면 알림 수로 정렬
      return (b.alerts || 0) - (a.alerts || 0);
    });
  }, []);

  // 통계 계산 함수
  const calculateStats = useCallback((servers: Server[]): DashboardStats => {
    const stats = servers.reduce(
      (acc, server) => {
        acc.total++;
        acc[server.status]++;
        return acc;
      },
      { total: 0, online: 0, warning: 0, offline: 0 }
    );

    return stats;
  }, []);

  // 서버 필터링 함수
  const filterServers = useCallback(
    (servers: Server[], filters: ServerFilters): Server[] => {
      return servers.filter(server => {
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
    initializeData();
  }, [initializeData]);

  // 초기 데이터 로드
  useEffect(() => {
    initializeData();
  }, [initializeData]);

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
