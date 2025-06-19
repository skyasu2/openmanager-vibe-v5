import { useState, useEffect, useCallback, useMemo } from 'react';
import { Server, ServerStatus } from '@/types/server';
import { useRealtimeServers } from './api/useRealtimeServers';
import {
  sortServersByPriority,
  mapStatus,
  getServerStats,
  filterServers,
  getUniqueLocations,
} from '../utils/serverUtils';
import { useServerDataStore } from '@/stores/serverDataStore';

export type DashboardTab = 'servers' | 'network' | 'clusters' | 'applications';
export type ViewMode = 'grid' | 'list';

// 목업 서버 데이터
const fallbackServers: Server[] = [
  // 심각 상태 (offline) 서버들
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
  // 경고 상태 (warning) 서버들
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
  {
    id: 'api-sg-042',
    name: 'api-sg-042',
    status: 'warning',
    location: 'Singapore',
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
    status: 'online',
    location: 'US East',
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

export const useServerDashboard = ({ onStatsUpdate }: UseServerDashboardProps) => {
  const { servers: allServerMetrics, lastUpdate } = useServerDataStore();
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedServer, setSelectedServer] = useState<Server | null>(null);
  const [activeTab, setActiveTab] = useState<'servers' | 'network' | 'clusters' | 'applications'>('servers');
  const ITEMS_PER_PAGE = 8;

  const allServers: Server[] = useMemo(() => {
    return allServerMetrics.map(metric => {
      const mapStatus = (status: ServerStatus): Server['status'] => {
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
            return status;
        }
      };

      return {
        id: metric.id,
        name: metric.hostname,
        status: mapStatus(metric.status),
        cpu: metric.cpu_usage,
        memory: metric.memory_usage,
        disk: metric.disk_usage,
        location: metric.environment,
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

  const handleServerSelect = (server: Server) => {
    setSelectedServer(server);
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
    setSelectedServer,
    handleServerSelect,
    activeTab,
    setActiveTab
  };
};
