'use client';

import EnhancedServerCard from '@/components/dashboard/EnhancedServerCard';
import ServerDetailModal from '@/components/dashboard/ServerDetailModal';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { DashboardTab, useServerDashboard } from '@/hooks/useServerDashboard';
import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';

interface ServerDashboardProps {
  onStatsUpdate?: (stats: {
    total: number;
    online: number;
    warning: number;
    offline: number;
  }) => void;
}

export default function ServerDashboard({
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

  // 서버를 심각→주의→정상 순으로 정렬
  const sortedServers = [...paginatedServers].sort((a, b) => {
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

  // 페이지네이션 정보 계산
  const pageSize = Math.ceil(servers.length / totalPages) || 8;
  const startIndex = (currentPage - 1) * pageSize + 1;
  const endIndex = Math.min(currentPage * pageSize, servers.length);
  const totalServers = servers.length;

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
                        전체 {totalServers}개 서버 중 {startIndex}-{endIndex}
                        번째 표시
                      </p>
                      <p className='text-blue-700 text-sm'>
                        {pageSize}개씩 페이지네이션 • {currentPage}/{totalPages}{' '}
                        페이지
                      </p>
                    </div>
                  </div>
                  <div className='flex items-center gap-3'>
                    {/* 페이지 크기 선택 */}
                    <div className='flex items-center gap-2'>
                      <span className='text-blue-700 text-sm'>표시 개수:</span>
                      <select
                        value={pageSize}
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
                      {startIndex}-{endIndex} / {totalServers}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 🎯 15개 서버 최적화 그리드 레이아웃 */}
            <div className='grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
              {sortedServers.map((server, index) => (
                <EnhancedServerCard
                  key={server.id}
                  server={{
                    ...server,
                    cpu: (server as any).cpu || 0,
                    memory: (server as any).memory || 0,
                    disk: (server as any).disk || 0,
                    lastUpdate: (server as any).lastUpdate || new Date(),
                    services: (server as any).services || [],
                    ...server,
                    hostname: (server as any).hostname || server.name,
                    type: (server as any).type || 'api',
                    environment: (server as any).environment || 'prod',
                    location: (server as any).location || 'unknown',
                    provider: (server as any).provider || 'Unknown',
                    status:
                      server.status === 'online'
                        ? 'healthy'
                        : (server.status as any),
                    uptime:
                      typeof (server as any).uptime === 'string'
                        ? (server as any).uptime
                        : typeof (server as any).uptime === 'number'
                          ? `${Math.floor((server as any).uptime / 3600)}h ${Math.floor(((server as any).uptime % 3600) / 60)}m`
                          : '0h 0m',
                    alerts:
                      typeof (server as any).alerts === 'number'
                        ? (server as any).alerts
                        : Array.isArray((server as any).alerts)
                          ? (server as any).alerts.length
                          : 0,
                  }}
                  index={index}
                  onClick={() => handleServerSelect(server as any)}
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

      {selectedServer && (
        <EnhancedServerModal
          server={selectedServer}
          onClose={handleModalClose}
        />
      )}
    </div>
  );
}
