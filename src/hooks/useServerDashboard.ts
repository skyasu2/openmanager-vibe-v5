'use client';

import { useServerMetrics } from '@/hooks/useServerMetrics';
import { useServerDataStore } from '@/stores/serverDataStore';
import { MetricsHistory, Server } from '@/types/server';
import { useEffect, useMemo, useState } from 'react';

export type DashboardTab = 'servers' | 'network' | 'clusters' | 'applications';
export type ViewMode = 'grid' | 'list';

// 목업 서버 데이터
const fallbackServers: Server[] = [
  // 심각 상태 (offline) 서버들
  {
    id: 'api-jp-040',
    name: 'api-jp-040',
    hostname: 'api-jp-040.example.com',
    status: 'offline',
    location: 'Asia Pacific',
    type: 'API',
    environment: 'production',
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
    hostname: 'api-sg-044.example.com',
    status: 'offline',
    location: 'Singapore',
    type: 'API',
    environment: 'production',
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
  // 경고 상태 (warning) 서버들
  {
    id: 'api-eu-045',
    name: 'api-eu-045',
    hostname: 'api-eu-045.example.com',
    status: 'warning',
    location: 'EU West',
    type: 'API',
    environment: 'production',
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
  {
    id: 'api-sg-042',
    name: 'api-sg-042',
    hostname: 'api-sg-042.example.com',
    status: 'warning',
    location: 'Singapore',
    type: 'API',
    environment: 'production',
    cpu: 72,
    memory: 79,
    disk: 58,
    network: 55,
    networkStatus: 'poor',
    uptime: '8일 6시간',
    lastUpdate: new Date(),
    alerts: 1,
    services: [
      { name: 'gunicorn', status: 'stopped', port: 8000 },
      { name: 'python', status: 'stopped', port: 3000 },
      { name: 'uwsgi', status: 'running', port: 8080 },
    ],
  },
  // 정상 상태 (online) 서버들
  {
    id: 'api-us-041',
    name: 'api-us-041',
    hostname: 'api-us-041.example.com',
    status: 'online',
    location: 'US East',
    type: 'API',
    environment: 'production',
    cpu: 59,
    memory: 48,
    disk: 30,
    network: 35,
    networkStatus: 'excellent',
    uptime: '22일 5시간',
    lastUpdate: new Date(),
    alerts: 0,
    services: [
      { name: 'nginx', status: 'running', port: 80 },
      { name: 'nodejs', status: 'running', port: 3000 },
      { name: 'gunicorn', status: 'running', port: 8000 },
    ],
  },
];

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
  const ITEMS_PER_PAGE = 8;

  // 🚀 컴포넌트 마운트 시 서버 데이터 자동 로드 및 실시간 업데이트 시작
  useEffect(() => {
    console.log('🎯 useServerDashboard 초기화 - 서버 데이터 로드 시작');

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
  }, [fetchServers, startRealTimeUpdates, stopRealTimeUpdates]);

  const allServers: Server[] = useMemo(() => {
    console.log(`🔍 서버 데이터 변환: ${allServerMetrics.length}개 서버 처리`);

    // 🛡️ allServerMetrics가 비어있으면 폴백 서버 사용
    if (allServerMetrics.length === 0) {
      console.log('⚠️ 서버 메트릭이 비어있음 - 폴백 서버 사용');
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
        name: metric.hostname,
        hostname: metric.hostname,
        status: mapStatus(metric.status),
        cpu: metric.cpu_usage,
        memory: metric.memory_usage,
        disk: metric.disk_usage,
        location: metric.environment,
        type: metric.role?.toUpperCase() || 'UNKNOWN',
        environment: metric.environment,
        uptime: `${Math.floor(metric.uptime / 86400)}d`,
        alerts: metric.alerts.length,
        lastUpdate: new Date(metric.last_updated),
        services: [], // 필요시 채워넣기
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
    return sortedServers.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [sortedServers, currentPage]);

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
