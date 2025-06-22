'use client';

import { UNIFIED_FALLBACK_SERVERS } from '@/config/fallback-data';
import { useServerMetrics } from '@/hooks/useServerMetrics';
import { useServerDataStore } from '@/stores/serverDataStore';
import { Server } from '@/types/server';
import { useEffect, useMemo, useState } from 'react';

export type DashboardTab = 'servers' | 'network' | 'clusters' | 'applications';
export type ViewMode = 'grid' | 'list';

// 통합된 폴백 서버 데이터 사용 (하드코딩 제거)
const fallbackServers: Server[] = UNIFIED_FALLBACK_SERVERS;

// 업타임 포맷팅 함수
const formatUptime = (uptime: number): string => {
  if (typeof uptime !== 'number' || uptime <= 0) return '0분';

  const days = Math.floor(uptime / 86400);
  const hours = Math.floor((uptime % 86400) / 3600);
  const minutes = Math.floor((uptime % 3600) / 60);

  if (days > 0) return `${days}일 ${hours}시간`;
  if (hours > 0) return `${hours}시간 ${minutes}분`;
  return `${minutes}분`;
};

interface UseServerDashboardOptions {
  onStatsUpdate?: (stats: any) => void;
}

export function useServerDashboard(options: UseServerDashboardOptions = {}) {
  const { onStatsUpdate } = options;

  // Zustand 스토어에서 서버 데이터 가져오기
  const { servers, isLoading, error, fetchServers } = useServerDataStore();

  // 페이지네이션 상태
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 8; // 8개로 변경하여 페이지네이션 제공

  // 선택된 서버 상태
  const [selectedServer, setSelectedServer] = useState<Server | null>(null);

  // 서버 메트릭 훅
  const { metricsHistory } = useServerMetrics();

  // 서버 데이터 로드
  useEffect(() => {
    fetchServers();
  }, [fetchServers]);

  // 실제 서버 데이터 또는 폴백 데이터 사용
  const actualServers = useMemo(() => {
    if (servers && servers.length > 0) {
      // EnhancedServerMetrics를 Server 타입으로 변환
      return servers.map(
        (server: any): Server => ({
          id: server.id,
          name: server.name || server.hostname,
          hostname: server.hostname || server.name,
          status: server.status,
          cpu: server.cpu_usage || 0,
          memory: server.memory_usage || 0,
          disk: server.disk_usage || 0,
          network: server.network_in + server.network_out || 0,
          uptime: server.uptime || 0,
          location: server.location || 'Unknown',
          alerts: server.alerts || 0,
          ip: server.ip || '192.168.1.1',
          os: server.os || 'Ubuntu 22.04 LTS',
          type: server.role || 'worker',
          environment: server.environment || 'production',
          provider: server.provider || 'AWS',
          specs: {
            cpu_cores: 4,
            memory_gb: 8,
            disk_gb: 250,
            network_speed: '1Gbps',
          },
          lastUpdate: server.lastUpdate || new Date(),
          services: server.services || [],
          networkStatus:
            server.status === 'healthy'
              ? 'healthy'
              : server.status === 'warning'
                ? 'warning'
                : 'critical',
          systemInfo: {
            os: server.os || 'Ubuntu 22.04 LTS',
            uptime:
              typeof server.uptime === 'string'
                ? server.uptime
                : `${Math.floor(server.uptime / 3600)}h`,
            processes: Math.floor(Math.random() * 200) + 50,
            zombieProcesses: Math.floor(Math.random() * 5),
            loadAverage: '1.23, 1.45, 1.67',
            lastUpdate: server.lastUpdate || new Date(),
          },
          networkInfo: {
            interface: 'eth0',
            receivedBytes: `${Math.floor(server.network_in || 0)} MB`,
            sentBytes: `${Math.floor(server.network_out || 0)} MB`,
            receivedErrors: Math.floor(Math.random() * 10),
            sentErrors: Math.floor(Math.random() * 10),
            status:
              server.status === 'healthy'
                ? 'healthy'
                : server.status === 'warning'
                  ? 'warning'
                  : 'critical',
          },
        })
      );
    }
    return fallbackServers;
  }, [servers]);

  // 페이지네이션된 서버 데이터
  const paginatedServers = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return actualServers.slice(startIndex, endIndex);
  }, [actualServers, currentPage]);

  // 총 페이지 수 계산
  const totalPages = Math.ceil(actualServers.length / ITEMS_PER_PAGE);

  // 통계 계산
  const stats = useMemo(() => {
    const total = actualServers.length;
    const online = actualServers.filter(
      s => s.status === 'healthy' || s.status === 'online'
    ).length;
    const offline = actualServers.filter(
      s => s.status === 'critical' || s.status === 'offline'
    ).length;
    const warning = actualServers.filter(s => s.status === 'warning').length;

    const avgCpu =
      actualServers.reduce((sum, s) => sum + ((s as any).cpu || 0), 0) / total;
    const avgMemory =
      actualServers.reduce((sum, s) => sum + ((s as any).memory || 0), 0) /
      total;
    const avgDisk =
      actualServers.reduce((sum, s) => sum + ((s as any).disk || 0), 0) / total;

    return {
      total,
      online,
      offline,
      warning,
      avgCpu: Math.round(avgCpu),
      avgMemory: Math.round(avgMemory),
      avgDisk: Math.round(avgDisk),
    };
  }, [actualServers]);

  // 통계 업데이트 콜백 호출
  useEffect(() => {
    if (onStatsUpdate) {
      onStatsUpdate(stats);
    }
  }, [stats, onStatsUpdate]);

  // 서버 선택 핸들러
  const handleServerSelect = (server: Server) => {
    setSelectedServer(server);
  };

  // 모달 닫기 핸들러
  const handleModalClose = () => {
    setSelectedServer(null);
  };

  // 선택된 서버의 메트릭 계산
  const selectedServerMetrics = useMemo(() => {
    if (!selectedServer) return null;

    return {
      cpu: (selectedServer as any).cpu || 0,
      memory: (selectedServer as any).memory || 0,
      disk: (selectedServer as any).disk || 0,
      network: (selectedServer as any).network || 0,
      uptime: (selectedServer as any).uptime || 0,
      timestamp: new Date().toISOString(),
    };
  }, [selectedServer]);

  return {
    // 데이터
    servers: actualServers,
    paginatedServers,
    isLoading,
    error,
    stats,

    // 페이지네이션
    currentPage,
    totalPages,
    setCurrentPage,

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
