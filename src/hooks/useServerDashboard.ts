import { useState, useEffect, useCallback, useMemo } from 'react';
import { Server } from '../types/server';
import { useRealtimeServers } from './api/useRealtimeServers';
import {
  sortServersByPriority,
  mapStatus,
  getServerStats,
  filterServers,
  getUniqueLocations,
} from '../utils/serverUtils';

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

export function useServerDashboard({
  onStatsUpdate,
}: UseServerDashboardProps = {}) {
  const [activeTab, setActiveTab] = useState<DashboardTab>('servers');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [locationFilter, setLocationFilter] = useState('all');
  const [selectedServer, setSelectedServer] = useState<Server | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(12);

  // 실시간 서버 데이터 가져오기
  const {
    servers: realtimeServers = [],
    isLoading,
    error,
  } = useRealtimeServers();

  // 서버 데이터 처리 및 타입 변환
  const servers = useMemo(() => {
    if (realtimeServers && realtimeServers.length > 0) {
      // 실시간 서버 데이터를 Server 타입으로 변환
      return realtimeServers.map(serverData => {
        const convertedServer: Server = {
          id: serverData.id || `server-${Date.now()}-${Math.random()}`,
          name: serverData.name || 'Unknown Server',
          status: mapStatus(serverData.status || 'running'),
          location:
            serverData.location || serverData.environment || 'Seoul DC1',
          cpu: Math.round(serverData.metrics?.cpu || Math.random() * 50 + 20),
          memory: Math.round(
            serverData.metrics?.memory || Math.random() * 60 + 30
          ),
          disk: Math.round(serverData.metrics?.disk || Math.random() * 40 + 10),
          network: Math.round(
            (serverData.metrics?.network?.in || 0) +
            (serverData.metrics?.network?.out || 0) || Math.random() * 30 + 10
          ),
          networkStatus:
            serverData.status === 'error'
              ? 'offline'
              : serverData.status === 'warning'
                ? 'poor'
                : 'good',
          uptime: `${Math.floor(Math.random() * 30 + 1)}일 ${Math.floor(Math.random() * 24)}시간`,
          lastUpdate: new Date(),
          alerts:
            serverData.health?.issues?.length ||
            (serverData.status === 'error'
              ? 3
              : serverData.status === 'warning'
                ? 1
                : 0),
          services: [
            {
              name: 'nginx',
              status: serverData.status === 'error' ? 'stopped' : 'running',
              port: 80,
            },
            { name: 'nodejs', status: 'running', port: 3000 },
            {
              name: 'gunicorn',
              status: serverData.status === 'error' ? 'stopped' : 'running',
              port: 8000,
            },
          ],
        };
        return convertedServer;
      });
    }
    return fallbackServers;
  }, [realtimeServers]);

  // 정렬된 서버 목록
  const sortedServers = useMemo(() => {
    return sortServersByPriority(servers);
  }, [servers]);

  // 필터링된 서버 목록
  const filteredServers = useMemo(() => {
    return filterServers(
      sortedServers,
      searchTerm,
      statusFilter,
      locationFilter
    );
  }, [sortedServers, searchTerm, statusFilter, locationFilter]);

  // 페이지네이션
  const totalPages = Math.ceil(filteredServers.length / itemsPerPage);
  const paginatedServers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredServers.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredServers, currentPage, itemsPerPage]);

  // 고유 위치 목록
  const uniqueLocations = useMemo(() => {
    return getUniqueLocations(servers);
  }, [servers]);

  // 서버 통계
  const serverStats = useMemo(() => {
    return getServerStats(servers);
  }, [servers]);

  // 통계 업데이트 콜백
  useEffect(() => {
    if (onStatsUpdate) {
      onStatsUpdate(serverStats);
    }
  }, [serverStats, onStatsUpdate]);

  // 서버 선택 핸들러
  const handleServerSelect = useCallback((server: Server) => {
    setSelectedServer(server);
    setIsModalOpen(true);
  }, []);

  // 모달 닫기 핸들러
  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedServer(null);
  }, []);

  // 페이지 변경 핸들러
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  // 필터 리셋
  const resetFilters = useCallback(() => {
    setSearchTerm('');
    setStatusFilter('all');
    setLocationFilter('all');
    setCurrentPage(1);
  }, []);

  return {
    // 상태
    activeTab,
    viewMode,
    searchTerm,
    statusFilter,
    locationFilter,
    selectedServer,
    isModalOpen,
    currentPage,
    itemsPerPage,
    totalPages,
    isLoading,
    error,

    // 데이터
    servers: sortedServers,
    filteredServers,
    paginatedServers,
    uniqueLocations,
    serverStats,

    // 액션
    setActiveTab,
    setViewMode,
    setSearchTerm,
    setStatusFilter,
    setLocationFilter,
    handleServerSelect,
    handleCloseModal,
    handlePageChange,
    resetFilters,
  };
}
