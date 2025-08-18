'use client';

import EnhancedServerModal from '@/components/dashboard/EnhancedServerModal';
import ImprovedServerCard from '@/components/dashboard/ImprovedServerCard';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { DashboardTab } from '@/hooks/useServerDashboard';
import { useServerDashboard } from '@/hooks/useServerDashboard';
import { Loader2 } from 'lucide-react';
import { useEffect, useState, useMemo } from 'react';
import { formatUptime, getAlertsCount } from './types/server-dashboard.types';
import { serverTypeGuards } from '@/utils/serverUtils';
import type { Server } from '@/types/server';
interface ServerDashboardProps {
  servers?: Server[];
  onServerClick?: (server: Server) => void;
  showModal?: boolean;
  onClose?: () => void;
  selectedServerId?: string;
  onStatsUpdate?: (stats: {
    total: number;
    online: number;
    warning: number;
    offline: number;
  }) => void;
}

export default function ServerDashboard({
  servers: _externalServers,
  onServerClick: _onServerClick,
  showModal: _showModal,
  onClose: _onClose,
  selectedServerId: _selectedServerId,
  onStatsUpdate,
}: ServerDashboardProps) {
  const [activeTab] = useState<DashboardTab>('servers');
  const {
    paginatedServers,
    servers,
    currentPage,
    totalPages,
    pageSize,
    setCurrentPage,
    changePageSize,
    handleServerSelect,
    selectedServer,
    // selectedServerMetrics,
    handleModalClose,
  } = useServerDashboard({ onStatsUpdate });

  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
  }, []);

  // 서버를 심각→주의→정상 순으로 정렬 (CLS 방지를 위해 메모이제이션 적용)
  const sortedServers = useMemo(() => {
    return [...paginatedServers].sort((a, b) => {
      const statusPriority = {
        critical: 0,
        offline: 0,
        warning: 1,
        healthy: 2,
        online: 2,
      };

      const priorityA =
        statusPriority[a.status as keyof typeof statusPriority] ?? 3;
      const priorityB =
        statusPriority[b.status as keyof typeof statusPriority] ?? 3;

      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }

      // 같은 우선순위면 알림 수로 정렬 (많은 순)
      const alertsA =
        typeof a.alerts === 'number'
          ? a.alerts
          : Array.isArray(a.alerts)
            ? a.alerts.length
            : 0;
      const alertsB =
        typeof b.alerts === 'number'
          ? b.alerts
          : Array.isArray(b.alerts)
            ? b.alerts.length
            : 0;

      return alertsB - alertsA;
    });
  }, [paginatedServers]);

  // 페이지네이션 정보 계산 (메모이제이션으로 최적화)
  const paginationInfo = useMemo(() => {
    const pageSize = Math.ceil(servers.length / totalPages) || 8;
    const startIndex = (currentPage - 1) * pageSize + 1;
    const endIndex = Math.min(currentPage * pageSize, servers.length);
    const totalServers = servers.length;

    return { pageSize, startIndex, endIndex, totalServers };
  }, [servers.length, totalPages, currentPage]);

  if (!isClient) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="mx-auto h-12 w-12 animate-spin text-blue-600" />
        <p className="mt-2">대시보드 로딩 중...</p>
      </div>
    );
  }

  return (
    <div>
      {/* <ServerDashboardTabs
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        stats={serverStats}
      /> */}

      <div className="mt-6">
        {activeTab === 'servers' && (
          <div className="space-y-4">
            {/* 📊 페이지네이션 정보 헤더 */}
            {totalPages > 1 && (
              <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-blue-600">
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-blue-900">
                        전체 {paginationInfo.totalServers}개 서버 중{' '}
                        {paginationInfo.startIndex}-{paginationInfo.endIndex}
                        번째 표시
                      </p>
                      <p className="text-sm text-blue-700">
                        {paginationInfo.pageSize}개씩 페이지네이션 •{' '}
                        {currentPage}/{totalPages} 페이지
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {/* 페이지 크기 선택 */}
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-blue-700">표시 개수:</span>
                      <select
                        value={paginationInfo.pageSize}
                        onChange={(e) => changePageSize(Number(e.target.value))}
                        className="rounded border border-blue-300 bg-blue-100 px-2 py-1 text-sm text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        aria-label="페이지당 표시할 서버 개수 선택"
                      >
                        <option value={4}>4개씩</option>
                        <option value={6}>6개씩</option>
                        <option value={8}>8개씩</option>
                        <option value={12}>12개씩</option>
                        <option value={15}>모두 보기</option>
                      </select>
                    </div>
                    <div className="rounded-full bg-blue-100 px-3 py-1 font-mono text-sm text-blue-600">
                      {paginationInfo.startIndex}-{paginationInfo.endIndex} /{' '}
                      {paginationInfo.totalServers}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 🎯 페이지 크기에 따른 동적 그리드 레이아웃 */}
            <div
              className={`grid gap-4 transition-all duration-300 sm:gap-6 ${
                pageSize <= 3
                  ? 'grid-cols-1' // 3개: 모바일 최적화 (1열)
                  : pageSize <= 6
                    ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' // 6개: 2x3 레이아웃
                    : pageSize <= 9
                      ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' // 9개: 3x3 레이아웃
                      : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' // 12개 이상: 3x4 레이아웃
              }`}
            >
              {sortedServers.map((server, index) => (
                <ImprovedServerCard
                  key={server.id}
                  server={{
                    id: server.id,
                    name: server.name,
                    status:
                      server.status === 'online' ? 'online' : server.status,
                    cpu: serverTypeGuards.getCpu(server),
                    memory: serverTypeGuards.getMemory(server),
                    disk: serverTypeGuards.getDisk(server),
                    network: serverTypeGuards.getNetwork(server),
                    location: server.location || 'unknown',
                    uptime: formatUptime(server.uptime),
                    ip: server.ip || '192.168.1.100',
                    os: server.os || 'Ubuntu 22.04',
                    alerts: getAlertsCount(server.alerts),
                    lastUpdate: server.lastUpdate || new Date(),
                    services: server.services || [],
                  }}
                  variant="compact"
                  showRealTimeUpdates={true}
                  index={index}
                  onClick={() => handleServerSelect(server)}
                />
              ))}
            </div>
          </div>
        )}
        {/* 다른 탭 컨텐츠는 여기에 추가될 수 있습니다. */}
      </div>

      {totalPages > 1 && activeTab === 'servers' && (
        <div className="mt-8 space-y-4">
          {/* 페이지당 표시 개수 선택 */}
          <div className="flex justify-end">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                페이지당 표시:
              </span>
              <Select
                value={String(pageSize)}
                onValueChange={(value) => {
                  changePageSize(Number(value));
                  setCurrentPage(1); // 페이지 크기 변경 시 첫 페이지로 이동
                }}
              >
                <SelectTrigger className="w-[100px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="6">6개 (모바일)</SelectItem>
                  <SelectItem value="9">9개 (태블릿)</SelectItem>
                  <SelectItem value="12">12개</SelectItem>
                  <SelectItem value="15">15개 (전체 - 권장)</SelectItem>
                  <SelectItem value="20">20개 (확장)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 페이지네이션 */}
          <div className="flex justify-center">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      if (currentPage > 1) {
                        setCurrentPage(currentPage - 1);
                      }
                    }}
                    className={
                      currentPage === 1
                        ? 'pointer-events-none opacity-50'
                        : 'cursor-pointer'
                    }
                  />
                </PaginationItem>

                {/* 페이지 번호 표시 로직 개선 */}
                {(() => {
                  const maxVisiblePages = 5;
                  let startPage = Math.max(
                    1,
                    currentPage - Math.floor(maxVisiblePages / 2)
                  );
                  const endPage = Math.min(
                    totalPages,
                    startPage + maxVisiblePages - 1
                  );

                  if (endPage - startPage < maxVisiblePages - 1) {
                    startPage = Math.max(1, endPage - maxVisiblePages + 1);
                  }

                  const pages = [];

                  // 첫 페이지
                  if (startPage > 1) {
                    pages.push(
                      <PaginationItem key={1}>
                        <PaginationLink
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            setCurrentPage(1);
                          }}
                        >
                          1
                        </PaginationLink>
                      </PaginationItem>
                    );
                    if (startPage > 2) {
                      pages.push(
                        <PaginationItem key="ellipsis-start">
                          <span className="px-3">...</span>
                        </PaginationItem>
                      );
                    }
                  }

                  // 중간 페이지들
                  for (let i = startPage; i <= endPage; i++) {
                    pages.push(
                      <PaginationItem key={i}>
                        <PaginationLink
                          href="#"
                          isActive={currentPage === i}
                          onClick={(e) => {
                            e.preventDefault();
                            setCurrentPage(i);
                          }}
                        >
                          {i}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  }

                  // 마지막 페이지
                  if (endPage < totalPages) {
                    if (endPage < totalPages - 1) {
                      pages.push(
                        <PaginationItem key="ellipsis-end">
                          <span className="px-3">...</span>
                        </PaginationItem>
                      );
                    }
                    pages.push(
                      <PaginationItem key={totalPages}>
                        <PaginationLink
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            setCurrentPage(totalPages);
                          }}
                        >
                          {totalPages}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  }

                  return pages;
                })()}

                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      if (currentPage < totalPages) {
                        setCurrentPage(currentPage + 1);
                      }
                    }}
                    className={
                      currentPage === totalPages
                        ? 'pointer-events-none opacity-50'
                        : 'cursor-pointer'
                    }
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>

          {/* 현재 페이지 정보 */}
          <div className="text-center text-sm text-gray-600 dark:text-gray-400">
            {servers.length}개 서버 중 {(currentPage - 1) * pageSize + 1}-
            {Math.min(currentPage * pageSize, servers.length)}번째 표시 중
          </div>
        </div>
      )}

      {/* 🎯 통합된 모달 - EnhancedServerModal 사용 */}
      {selectedServer && (
        <EnhancedServerModal
          server={{
            id: selectedServer.id,
            hostname: selectedServer.hostname || selectedServer.name,
            name: selectedServer.name,
            type: selectedServer.type || 'api',
            environment: selectedServer.environment || 'prod',
            location: selectedServer.location || 'unknown',
            provider: selectedServer.provider || 'Unknown',
            status: serverTypeGuards.getStatus(selectedServer.status),
            cpu: serverTypeGuards.getCpu(selectedServer),
            memory: serverTypeGuards.getMemory(selectedServer),
            disk: serverTypeGuards.getDisk(selectedServer),
            network: serverTypeGuards.getNetwork(selectedServer),
            uptime: formatUptime(selectedServer.uptime),
            lastUpdate: selectedServer.lastUpdate || new Date(),
            alerts: getAlertsCount(selectedServer.alerts),
            services: selectedServer.services || [],
            specs: serverTypeGuards.getSpecs(selectedServer),
            os: selectedServer.os || 'Ubuntu 22.04',
            ip: selectedServer.ip || '192.168.1.100',
            networkStatus: (() => {
              // Server 타입의 networkStatus를 ServerDashboardData 타입으로 매핑
              const status = selectedServer.networkStatus;
              if (status === 'healthy') return 'excellent';
              if (status === 'warning') return 'good';
              if (status === 'critical' || status === 'maintenance')
                return 'poor';
              if (status === 'offline') return 'offline';
              return 'good'; // 기본값
            })(),
            health: selectedServer.health || {
              score: 85,
              trend: [80, 82, 85, 87, 85],
            },
            alertsSummary: selectedServer.alertsSummary || {
              total: getAlertsCount(selectedServer.alerts),
              critical: 0,
              warning: getAlertsCount(selectedServer.alerts),
            },
          }}
          onClose={handleModalClose}
        />
      )}
    </div>
  );
}
