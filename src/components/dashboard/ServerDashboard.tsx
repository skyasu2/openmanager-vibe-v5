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

  const renderServerGroup = (
    title: string,
    status: ('critical' | 'warning' | 'healthy')[]
  ) => {
    const filtered = paginatedServers.filter(s =>
      status.includes(s.status as any)
    );
    if (filtered.length === 0) return null;

    return (
      <div className='space-y-4'>
        <h3 className='text-lg font-semibold text-gray-800 flex items-center gap-2'>
          <span
            className={`w-3 h-3 rounded-full ${status[0] === 'critical' ? 'bg-red-500' : status[0] === 'warning' ? 'bg-yellow-500' : 'bg-green-500'}`}
          ></span>
          {title} ({filtered.length})
        </h3>
        <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 3xl:grid-cols-6'>
          {filtered.map((server, index) => (
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
    );
  };

  return (
    <div>
      {/* <ServerDashboardTabs
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        stats={serverStats}
      /> */}

      <div className='mt-6'>
        {activeTab === 'servers' && (
          <div className='space-y-6'>
            {renderServerGroup('위험 상태', ['critical'])}
            {renderServerGroup('주의 상태', ['warning'])}
            {renderServerGroup('정상 상태', ['healthy'])}
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
