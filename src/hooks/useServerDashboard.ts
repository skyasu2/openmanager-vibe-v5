'use client';

import { UNIFIED_FALLBACK_SERVERS } from '@/config/fallback-data';
// 🎯 새로운 데이터 일관성 모듈 사용
import { useServerMetrics } from '@/hooks/useServerMetrics';
import { getServerSettings } from '@/modules/data-consistency';
import { useServerDataStore } from '@/stores/serverDataStore';
import { Server } from '@/types/server';
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

  if (days > 0) return `${days}일 ${hours}시간`;
  if (hours > 0) return `${hours}시간 ${minutes}분`;
  return `${minutes}분`;
};

export function useServerDashboard() {
  const [activeTab, setActiveTab] = useState<DashboardTab>('servers');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [currentPage, setCurrentPage] = useState(1);

  // 🎯 중앙집중식 설정에서 페이지 크기 가져오기
  const serverSettings = getServerSettings();
  const ITEMS_PER_PAGE = serverSettings.itemsPerPage;

  // 서버 데이터와 메트릭 가져오기
  const {
    servers: rawServers,
    isLoading,
    error,
    lastUpdate,
    fetchServers
  } = useServerDataStore();

  // useServerMetrics 훅에서 실제 반환되는 값들만 사용
  const {
    metricsHistory,
    isLoadingHistory: metricsLoading
  } = useServerMetrics();

  // 서버 데이터 변환 및 정제
  const servers = useMemo(() => {
    if (!rawServers || rawServers.length === 0) {
      console.log('⚠️ 서버 데이터가 없어 폴백 데이터 사용');
      return fallbackServers;
    }

    return rawServers.map((server: any) => ({
      id: server.id || server.serverId || `server-${Math.random()}`,
      name: server.name || server.hostname || 'Unknown Server',
      hostname: server.hostname || server.name || 'unknown.local',
      status: server.status || 'unknown',
      environment: server.environment || 'production',
      role: server.role || 'worker',
      cpu: server.cpu || server.cpu_usage || 0,
      memory: server.memory || server.memory_usage || 0,
      disk: server.disk || server.disk_usage || 0,
      network: server.network || server.network_usage || 0,
      uptime: server.uptime || 0,
      location: server.location || 'unknown',
      lastUpdate: server.lastUpdate ? new Date(server.lastUpdate) : new Date(),
      alerts: server.alerts || [],
      services: server.services || [],
    }));
  }, [rawServers]);

  // 페이지네이션 계산
  const totalPages = Math.ceil(servers.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedServers = servers.slice(startIndex, endIndex);

  // 통계 계산
  const stats = useMemo(() => {
    const total = servers.length;
    const running = servers.filter(s => s.status === 'online' || s.status === 'running').length;
    const warning = servers.filter(s => s.status === 'warning').length;
    const error = servers.filter(s => s.status === 'error' || s.status === 'offline').length;
    const stopped = servers.filter(s => s.status === 'stopped').length;

    const avgCpu = total > 0 ? servers.reduce((sum, s) => sum + (s.cpu || 0), 0) / total : 0;
    const avgMemory = total > 0 ? servers.reduce((sum, s) => sum + (s.memory || 0), 0) / total : 0;
    const avgDisk = total > 0 ? servers.reduce((sum, s) => sum + (s.disk || 0), 0) / total : 0;

    return {
      total,
      running,
      warning,
      error,
      stopped,
      avgCpu: Math.round(avgCpu * 100) / 100,
      avgMemory: Math.round(avgMemory * 100) / 100,
      avgDisk: Math.round(avgDisk * 100) / 100,
    };
  }, [servers]);

  // 서버 상태별 필터링
  const filterServersByStatus = (status: string) => {
    return servers.filter(server => server.status === status);
  };

  // 페이지 변경 핸들러
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // 데이터 새로고침
  const refreshData = async () => {
    try {
      await fetchServers();
    } catch (error) {
      console.error('서버 데이터 새로고침 실패:', error);
    }
  };

  // 초기 데이터 로드
  useEffect(() => {
    if (servers.length === 0 && !isLoading) {
      refreshData();
    }
  }, []);

  // 🔍 데이터 일관성 로깅 (개발 환경)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('📊 서버 대시보드 상태:');
      console.log(`  총 서버: ${servers.length}개`);
      console.log(`  페이지당 표시: ${ITEMS_PER_PAGE}개`);
      console.log(`  현재 페이지: ${currentPage}/${totalPages}`);
      console.log(`  표시 중인 서버: ${paginatedServers.length}개`);

      if (servers.length !== serverSettings.totalCount) {
        console.warn(`⚠️ 서버 개수 불일치: 실제=${servers.length}, 설정=${serverSettings.totalCount}`);
      }
    }
  }, [servers.length, ITEMS_PER_PAGE, currentPage, totalPages, paginatedServers.length, serverSettings.totalCount]);

  return {
    // 데이터
    servers: paginatedServers,
    allServers: servers,
    stats,
    metricsHistory,

    // 상태
    isLoading: isLoading || metricsLoading,
    error,
    lastUpdate,

    // UI 상태
    activeTab,
    viewMode,
    currentPage,
    totalPages,

    // 설정
    itemsPerPage: ITEMS_PER_PAGE,

    // 액션
    setActiveTab,
    setViewMode,
    handlePageChange,
    refreshData,
    filterServersByStatus,

    // 유틸리티
    formatUptime,
  };
}
