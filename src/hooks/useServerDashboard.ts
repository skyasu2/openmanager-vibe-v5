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
  const ITEMS_PER_PAGE = 15; // 15개로 고정하여 모든 서버 표시

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
      return servers;
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
