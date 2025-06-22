'use client';

import { DATA_CONSISTENCY_CONFIG } from '@/config/data-consistency';
import { UNIFIED_FALLBACK_SERVERS } from '@/config/fallback-data';
import { useServerMetrics } from '@/hooks/useServerMetrics';
import { useServerDataStore } from '@/stores/serverDataStore';
import { MetricsHistory, Server } from '@/types/server';
import { useEffect, useMemo, useState } from 'react';

export type DashboardTab = 'servers' | 'network' | 'clusters' | 'applications';
export type ViewMode = 'grid' | 'list';

// 🎯 통합된 폴백 서버 데이터 사용 (하드코딩 제거)
const fallbackServers: Server[] = UNIFIED_FALLBACK_SERVERS;

// 업타임 포맷팅 함수
const formatUptime = (uptime: number): string => {
  if (typeof uptime !== 'number' || uptime <= 0) return '0분';

  const days = Math.floor(uptime / 86400);
  const hours = Math.floor((uptime % 86400) / 3600);
  const minutes = Math.floor((uptime % 3600) / 60);

  if (days > 0) {
    return `${days}일 ${hours}시간`;
  } else if (hours > 0) {
    return `${hours}시간 ${minutes}분`;
  } else {
    return `${minutes}분`;
  }
};

interface UseServerDashboardProps {
  onStatsUpdate?: (stats: {
    total: number;
    online: number;
    warning: number;
    offline: number;
  }) => void;
}

export const useServerDashboard = ({
  onStatsUpdate,
}: UseServerDashboardProps) => {
  const {
    servers: allServerMetrics,
    lastUpdate,
    fetchServers,
    startRealTimeUpdates,
    stopRealTimeUpdates,
  } = useServerDataStore();
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedServer, setSelectedServer] = useState<Server | null>(null);
  const [selectedServerMetrics, setSelectedServerMetrics] = useState<
    MetricsHistory[]
  >([]);
  const [isModalLoading, setIsModalLoading] = useState(false);
  const { loadMetricsHistory } = useServerMetrics();

  // 🎯 중앙 설정에서 페이지 크기 가져오기 (불일치 문제 해결)
  const ITEMS_PER_PAGE = DATA_CONSISTENCY_CONFIG.servers.itemsPerPage;

  // 🚀 컴포넌트 마운트 시 서버 데이터 자동 로드 및 실시간 업데이트 시작
  useEffect(() => {
    console.log('🎯 useServerDashboard 초기화 - 서버 데이터 로드 시작');
    console.log(`📄 페이지당 표시 개수: ${ITEMS_PER_PAGE}개 (중앙 설정 적용)`);

    // 초기 데이터 로드
    fetchServers()
      .then(() => {
        console.log('✅ 초기 서버 데이터 로드 완료');
      })
      .catch(error => {
        console.error('❌ 초기 서버 데이터 로드 실패:', error);
      });

    // 실시간 업데이트 시작
    startRealTimeUpdates();

    // 컴포넌트 언마운트 시 실시간 업데이트 정리
    return () => {
      console.log('🔄 useServerDashboard 정리 - 실시간 업데이트 중지');
      stopRealTimeUpdates();
    };
  }, [fetchServers, startRealTimeUpdates, stopRealTimeUpdates, ITEMS_PER_PAGE]);

  const allServers: Server[] = useMemo(() => {
    console.log(`🔍 서버 데이터 변환: ${allServerMetrics.length}개 서버 처리`);

    // 🛡️ allServerMetrics가 비어있으면 폴백 서버 사용
    if (allServerMetrics.length === 0) {
      console.log('⚠️ 서버 메트릭이 비어있음 - 폴백 서버 데이터 사용');
      return fallbackServers;
    }

    return allServerMetrics.map(metric => {
      const mapStatus = (status: string): Server['status'] => {
        switch (status) {
          case 'running':
            return 'healthy';
          case 'stopped':
            return 'critical';
          case 'error':
            return 'critical';
          case 'maintenance':
            return 'warning';
          default:
            return status as Server['status'];
        }
      };

      return {
        id: metric.id,
        name: metric.name,
        hostname: metric.hostname,
        status: mapStatus(metric.status),
        location: metric.environment || 'Unknown',
        type: metric.role || 'worker',
        environment: metric.environment,
        cpu: Number(metric.cpu_usage?.toFixed(2)) || 0,
        memory: Number(metric.memory_usage?.toFixed(2)) || 0,
        disk: Number(metric.disk_usage?.toFixed(2)) || 0,
        network: Number(metric.network_in?.toFixed(2)) || 0,
        networkStatus:
          metric.network_in > 100
            ? 'poor'
            : metric.network_in > 50
              ? 'good'
              : 'excellent',
        uptime: formatUptime(metric.uptime),
        lastUpdate: new Date(metric.last_updated),
        alerts: Array.isArray(metric.alerts) ? metric.alerts.length : 0,
        services: [],
      };
    });
  }, [allServerMetrics]);

  const sortedServers = useMemo(() => {
    return [...allServers].sort((a, b) => {
      const statusOrder = { critical: 0, warning: 1, healthy: 2 };
      return (statusOrder[a.status] ?? 3) - (statusOrder[b.status] ?? 3);
    });
  }, [allServers]);

  const totalPages = Math.ceil(sortedServers.length / ITEMS_PER_PAGE);

  const paginatedServers = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const paginated = sortedServers.slice(startIndex, endIndex);

    // 🔍 데이터 일관성 검증 로깅
    if (process.env.NODE_ENV === 'development') {
      console.log(`📊 페이지네이션 상태: ${paginated.length}/${sortedServers.length}개 서버 표시 (페이지 ${currentPage}/${totalPages})`);

      // 불일치 경고
      if (sortedServers.length > ITEMS_PER_PAGE && paginated.length < sortedServers.length) {
        console.warn(`⚠️ 페이지네이션으로 인해 ${sortedServers.length - paginated.length}개 서버가 숨겨짐`);
      }
    }

    return paginated;
  }, [sortedServers, currentPage, ITEMS_PER_PAGE]);

  const serverStats = useMemo(() => {
    const stats = {
      total: allServers.length,
      online: allServers.filter(s => s.status === 'healthy').length,
      warning: allServers.filter(s => s.status === 'warning').length,
      offline: allServers.filter(s => s.status === 'critical').length,
    };
    if (onStatsUpdate) {
      onStatsUpdate(stats);
    }
    return stats;
  }, [allServers, onStatsUpdate]);

  const handleServerSelect = async (server: Server) => {
    if (!server || !server.id) return;
    setSelectedServer(server);
    setIsModalLoading(true);

    try {
      await loadMetricsHistory(server.id, '24h');
      // useServerMetrics 훅에서 metricsHistory 상태를 직접 사용
      setSelectedServerMetrics([]);
    } catch (error) {
      console.error('메트릭 히스토리 로드 실패:', error);
      setSelectedServerMetrics([]);
    } finally {
      setIsModalLoading(false);
    }
  };

  const handleModalClose = () => {
    setSelectedServer(null);
    setSelectedServerMetrics([]);
  };

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  return {
    servers: allServers,
    sortedServers,
    paginatedServers,
    currentPage,
    totalPages,
    setCurrentPage,
    serverStats,
    lastUpdate,
    selectedServer,
    isModalLoading,
    selectedServerMetrics,
    handleServerSelect,
    handleModalClose,
    fetchServers,
  };
};
