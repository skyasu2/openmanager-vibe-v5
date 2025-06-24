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
    currentPage,
    totalPages,
    setCurrentPage,
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
            {/* 🎯 15개 서버 최적화 그리드 레이아웃 */}
            <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6'>
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
        <ServerDetailModal
          server={selectedServer}
          metricsHistory={selectedServerMetrics ? [selectedServerMetrics] : []}
          onClose={handleModalClose}
        />
      )}
    </div>
  );
}
