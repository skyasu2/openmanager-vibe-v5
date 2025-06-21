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
            {/* 심각→주의→정상 순으로 일렬 정렬된 서버 카드들 */}
            <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 3xl:grid-cols-6'>
              {sortedServers.map((server, index) => (
                <EnhancedServerCard
                  key={server.id}
                  server={{
                    ...server,
                    hostname: server.hostname || server.name,
                    type: server.type || 'api',
                    environment: server.environment || 'prod',
                    location: server.location || 'unknown',
                    provider: server.provider || 'Unknown',
                    status:
                      server.status === 'online'
                        ? 'healthy'
                        : (server.status as any),
                    uptime:
                      typeof server.uptime === 'string'
                        ? server.uptime
                        : typeof server.uptime === 'number'
                          ? `${Math.floor(server.uptime / 3600)}h ${Math.floor((server.uptime % 3600) / 60)}m`
                          : '0h 0m',
                    alerts:
                      typeof server.alerts === 'number'
                        ? server.alerts
                        : Array.isArray(server.alerts)
                          ? server.alerts.length
                          : 0,
                  }}
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

      {selectedServer && (
        <ServerDetailModal
          server={selectedServer}
          metricsHistory={selectedServerMetrics}
          onClose={handleModalClose}
        />
      )}
    </div>
  );
}
