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
  const [activeTab, setActiveTab] = useState<DashboardTab>('servers');
  const {
    paginatedServers,
    servers,
    currentPage,
    totalPages,
    setCurrentPage,
    changePageSize,
    handleServerSelect,
    selectedServer,
    selectedServerMetrics,
    handleModalClose,
  } = useServerDashboard({ onStatsUpdate });

  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <div className='flex items-center justify-center h-64'>
        <Loader2 className='mx-auto h-12 w-12 animate-spin text-blue-600' />
        <p className='mt-2'>대시보드 로딩 중...</p>
      </div>
    );
  }

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

  return (
    <div>
      {/* <ServerDashboardTabs
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        stats={serverStats}
      /> */}

      <div className='mt-6'>
        {activeTab === 'servers' && (
          <div className='space-y-4'>
            {/* 📊 페이지네이션 정보 헤더 */}
            {totalPages > 1 && (
              <div className='bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6'>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-3'>
                    <div className='text-blue-600'>
                      <svg
                        className='w-5 h-5'
                        fill='none'
                        stroke='currentColor'
                        viewBox='0 0 24 24'
                      >
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={2}
                          d='M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z'
                        />
                      </svg>
                    </div>
                    <div>
                      <p className='text-blue-900 font-medium'>
                        전체 {paginationInfo.totalServers}개 서버 중 {paginationInfo.startIndex}-{paginationInfo.endIndex}
                        번째 표시
                      </p>
                      <p className='text-blue-700 text-sm'>
                        {paginationInfo.pageSize}개씩 페이지네이션 • {currentPage}/{totalPages}{' '}
                        페이지
                      </p>
                    </div>
                  </div>
                  <div className='flex items-center gap-3'>
                    {/* 페이지 크기 선택 */}
                    <div className='flex items-center gap-2'>
                      <span className='text-blue-700 text-sm'>표시 개수:</span>
                      <select
                        value={paginationInfo.pageSize}
                        onChange={e => changePageSize(Number(e.target.value))}
                        className='text-blue-700 bg-blue-100 border border-blue-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
                        aria-label='페이지당 표시할 서버 개수 선택'
                      >
                        <option value={4}>4개씩</option>
                        <option value={6}>6개씩</option>
                        <option value={8}>8개씩</option>
                        <option value={12}>12개씩</option>
                        <option value={15}>모두 보기</option>
                      </select>
                    </div>
                    <div className='text-blue-600 text-sm font-mono bg-blue-100 px-3 py-1 rounded-full'>
                      {paginationInfo.startIndex}-{paginationInfo.endIndex} / {paginationInfo.totalServers}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 🎯 15개 서버 최적화 그리드 레이아웃 - ImprovedServerCard 사용 */}
            <div className='grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
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
                  variant='compact'
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
        <div className='mt-8 flex justify-center'>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href='#'
                  onClick={e => {
                    e.preventDefault();
                    setCurrentPage(p => Math.max(1, p - 1));
                  }}
                />
              </PaginationItem>
              {[...Array(totalPages)].map((_, i) => (
                <PaginationItem key={i}>
                  <PaginationLink
                    href='#'
                    isActive={currentPage === i + 1}
                    onClick={e => {
                      e.preventDefault();
                      setCurrentPage(i + 1);
                    }}
                  >
                    {i + 1}
                  </PaginationLink>
                </PaginationItem>
              ))}
              <PaginationItem>
                <PaginationNext
                  href='#'
                  onClick={e => {
                    e.preventDefault();
                    setCurrentPage(p => Math.min(totalPages, p + 1));
                  }}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
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
