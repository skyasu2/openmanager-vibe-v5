'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Server,
  Search,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  XCircle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useRealtimeServers } from '@/hooks/api/useRealtimeServers';
import EnhancedServerCard from './EnhancedServerCard';
import EnhancedServerModal from './EnhancedServerModal';
import type { Server as ServerType } from '@/types/server';

// 🎯 서버 카드 표시 개수 설정 (8개로 제한)
const SERVERS_PER_PAGE = 8;

interface DashboardContentProps {
  showSequentialGeneration: boolean;
  servers: any[];
  status: any;
  actions: any;
  selectedServer: ServerType | null;
  onServerClick: (server: any) => void;
  onServerModalClose: () => void;
  onStatsUpdate: (stats: {
    total: number;
    online: number;
    warning: number;
    offline: number;
  }) => void;
  onShowSequentialChange: (show: boolean) => void;
  mainContentVariants: any;
  isAgentOpen: boolean;
}

export default function DashboardContent({
  showSequentialGeneration,
  servers,
  status,
  actions,
  selectedServer,
  onServerClick,
  onServerModalClose,
  onStatsUpdate,
  onShowSequentialChange,
  mainContentVariants,
  isAgentOpen,
}: DashboardContentProps) {
  // 🎯 상태 관리 - 서버 모니터링 전용으로 단순화
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // ✅ API 기반 서버 데이터 스토어 사용
  const {
    servers: currentServers = [],
    isLoading: dataLoading,
    refreshAll,
  } = useRealtimeServers();

  // 🎯 초기 데이터 로드
  useEffect(() => {
    const initializeData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        await refreshAll();
      } catch (err) {
        console.error('서버 데이터 로드 실패:', err);
        setError('서버 데이터를 불러오는데 실패했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    initializeData();
  }, [refreshAll]);

  // 🎯 서버 상태 매핑 함수
  const mapServerStatus = (
    status: string
  ): 'online' | 'offline' | 'warning' => {
    if (!status) return 'offline';
    const normalizedStatus = status.toLowerCase();
    if (
      normalizedStatus.includes('running') ||
      normalizedStatus.includes('healthy')
    )
      return 'online';
    if (
      normalizedStatus.includes('warning') ||
      normalizedStatus.includes('maintenance')
    )
      return 'warning';
    return 'offline';
  };

  // 🎯 서버 데이터 변환 및 필터링
  const filteredAndSortedServers = useMemo(() => {
    if (!Array.isArray(currentServers)) return [];

    // 서버 데이터를 ServerType으로 변환
    const convertedServers: ServerType[] = currentServers.map(
      (server: any) => ({
        id: server.id || `server-${Math.random()}`,
        name: server.name || server.hostname || `Server-${server.id}`,
        status: mapServerStatus(server.status),
        location: server.location || server.region || 'Unknown',
        cpu: server.cpu || server.metrics?.cpu || Math.random() * 100,
        memory: server.memory || server.metrics?.memory || Math.random() * 100,
        disk: server.disk || server.metrics?.disk || Math.random() * 100,
        network:
          server.network || server.metrics?.network || Math.random() * 100,
        uptime: server.uptime || '99.9%',
        lastUpdate:
          server.lastUpdated || server.lastUpdate || new Date().toISOString(),
        environment: server.environment || 'production',
        role: server.role || 'web-server',
        version: server.version || '1.0.0',
        tags: server.tags || [],
        alerts: server.alerts || [],
        metrics: server.metrics || {},
        services: server.services || [],
        networkStatus: server.networkStatus || {
          bandwidth: Math.random() * 1000,
          latency: Math.random() * 50,
          connections: Math.floor(Math.random() * 1000),
          uptime: Math.random() * 100,
        },
      })
    );

    const filtered = convertedServers.filter(
      server =>
        server.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        server.location?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // 🎯 심각 → 경고 → 정상 순으로 정렬
    return filtered.sort((a, b) => {
      const statusPriority = { offline: 0, warning: 1, online: 2 };
      return statusPriority[a.status] - statusPriority[b.status];
    });
  }, [currentServers, searchTerm]);

  // 🎯 통계 업데이트
  useEffect(() => {
    if (onStatsUpdate && filteredAndSortedServers.length > 0) {
      const stats = {
        total: filteredAndSortedServers.length,
        online: filteredAndSortedServers.filter(s => s.status === 'online')
          .length,
        warning: filteredAndSortedServers.filter(s => s.status === 'warning')
          .length,
        offline: filteredAndSortedServers.filter(s => s.status === 'offline')
          .length,
      };
      onStatsUpdate(stats);
    }
  }, [filteredAndSortedServers, onStatsUpdate]);

  // 🎯 페이지네이션 계산
  const totalPages = Math.ceil(
    filteredAndSortedServers.length / SERVERS_PER_PAGE
  );
  const startIndex = (currentPage - 1) * SERVERS_PER_PAGE;
  const endIndex = startIndex + SERVERS_PER_PAGE;
  const currentPageServers = filteredAndSortedServers.slice(
    startIndex,
    endIndex
  );

  // 🎯 페이지 변경 핸들러
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // 🎯 서버 선택 핸들러
  const handleServerSelect = (server: ServerType) => {
    onServerClick(server);
  };

  // 🎯 새로고침 핸들러
  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      await refreshAll();
    } catch (err) {
      console.error('새로고침 실패:', err);
      setError('데이터 새로고침에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 🚀 디버깅을 위한 콘솔 로그 추가
  console.log('🔍 DashboardContent 렌더링:', {
    showSequentialGeneration,
    serversCount: servers?.length,
    selectedServer: selectedServer?.name,
    isAgentOpen,
    status: status?.type,
    timestamp: new Date().toISOString(),
  });

  // 시퀀셜 생성 모드 처리
  if (showSequentialGeneration) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-6'>
        <div className='max-w-7xl mx-auto'>
          <div className='bg-white rounded-lg shadow-lg p-6'>
            <h2 className='text-2xl font-bold text-gray-900 mb-4'>
              🔄 서버 생성 중...
            </h2>
            <p className='text-gray-600'>
              시퀀셜 서버 생성 모드가 활성화되었습니다.
            </p>
            <button
              onClick={() => onShowSequentialChange(false)}
              className='mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600'
            >
              일반 모드로 전환
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 로딩 상태
  if (isLoading || dataLoading) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4'></div>
          <p className='text-gray-600'>서버 데이터를 로드하고 있습니다...</p>
        </div>
      </div>
    );
  }

  // 에러 상태
  if (error) {
    return (
      <div className='min-h-screen bg-red-50 flex items-center justify-center p-4'>
        <div className='bg-white rounded-lg shadow-lg p-6 max-w-md w-full'>
          <div className='text-center'>
            <div className='text-red-500 text-4xl mb-4'>⚠️</div>
            <h2 className='text-xl font-semibold text-gray-900 mb-2'>
              오류 발생
            </h2>
            <p className='text-gray-600 mb-4'>{error}</p>
            <button
              onClick={handleRefresh}
              className='px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600'
            >
              다시 시도
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 to-blue-50'>
      <div className='p-6'>
        <div className='max-w-7xl mx-auto'>
          {/* 🎯 헤더 섹션 */}
          <div className='mb-8'>
            <div className='flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6'>
              <div>
                <h1 className='text-3xl font-bold text-gray-900 mb-2'>
                  서버 모니터링
                </h1>
                <p className='text-gray-600'>
                  실시간 서버 상태 및 성능 모니터링
                </p>
              </div>
              <div className='flex items-center gap-4 mt-4 lg:mt-0'>
                <button
                  onClick={handleRefresh}
                  disabled={isLoading}
                  className='flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50'
                >
                  <RefreshCw
                    className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`}
                  />
                  새로고침
                </button>
              </div>
            </div>

            {/* 🎯 통계 카드 */}
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8'>
              <div className='bg-white rounded-lg shadow-sm p-6'>
                <div className='flex items-center justify-between'>
                  <div>
                    <dt className='text-sm font-medium text-gray-500'>
                      전체 서버
                    </dt>
                    <dd className='text-lg font-medium text-gray-900'>
                      {filteredAndSortedServers.length}
                    </dd>
                  </div>
                  <Server className='w-8 h-8 text-gray-400' />
                </div>
              </div>

              <div className='bg-white rounded-lg shadow-sm p-6'>
                <div className='flex items-center justify-between'>
                  <div>
                    <dt className='text-sm font-medium text-gray-500'>정상</dt>
                    <dd className='text-lg font-medium text-gray-900'>
                      {
                        filteredAndSortedServers.filter(
                          s => s.status === 'online'
                        ).length
                      }
                    </dd>
                  </div>
                  <CheckCircle className='w-8 h-8 text-green-400' />
                </div>
              </div>

              <div className='bg-white rounded-lg shadow-sm p-6'>
                <div className='flex items-center justify-between'>
                  <div>
                    <dt className='text-sm font-medium text-gray-500'>경고</dt>
                    <dd className='text-lg font-medium text-gray-900'>
                      {
                        filteredAndSortedServers.filter(
                          s => s.status === 'warning'
                        ).length
                      }
                    </dd>
                  </div>
                  <AlertTriangle className='w-8 h-8 text-yellow-400' />
                </div>
              </div>

              <div className='bg-white rounded-lg shadow-sm p-6'>
                <div className='flex items-center justify-between'>
                  <div>
                    <dt className='text-sm font-medium text-gray-500'>
                      오프라인
                    </dt>
                    <dd className='text-lg font-medium text-gray-900'>
                      {
                        filteredAndSortedServers.filter(
                          s => s.status === 'offline'
                        ).length
                      }
                    </dd>
                  </div>
                  <XCircle className='w-8 h-8 text-red-400' />
                </div>
              </div>
            </div>

            {/* 🎯 검색 및 필터 */}
            <div className='flex flex-col sm:flex-row gap-4 mb-6'>
              <div className='relative flex-1'>
                <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4' />
                <input
                  type='text'
                  placeholder='서버 이름 또는 위치로 검색...'
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className='w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                />
              </div>
            </div>
          </div>

          {/* 🎯 서버 카드 그리드 (8개 제한) */}
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8'>
            <AnimatePresence mode='wait'>
              {currentPageServers.map((server, index) => (
                <motion.div
                  key={server.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <EnhancedServerCard
                    server={server as any}
                    onClick={() => handleServerSelect(server)}
                    index={index}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* 🎯 페이지네이션 */}
          {totalPages > 1 && (
            <div className='flex items-center justify-between bg-white px-4 py-3 rounded-lg shadow-sm'>
              <div className='flex items-center text-sm text-gray-700'>
                <span>
                  전체 {filteredAndSortedServers.length}개 서버 중{' '}
                  {startIndex + 1}-
                  {Math.min(endIndex, filteredAndSortedServers.length)}개 표시
                </span>
              </div>

              <div className='flex items-center gap-2'>
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className='p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed'
                  title='이전 페이지'
                >
                  <ChevronLeft className='w-4 h-4' />
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  page => (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium ${
                        currentPage === page
                          ? 'bg-blue-500 text-white'
                          : 'border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  )
                )}

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className='p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed'
                  title='다음 페이지'
                >
                  <ChevronRight className='w-4 h-4' />
                </button>
              </div>
            </div>
          )}

          {/* 🎯 서버 상세 모달 */}
          {selectedServer && (
            <EnhancedServerModal
              server={selectedServer as any}
              onClose={onServerModalClose}
            />
          )}
        </div>
      </div>
    </div>
  );
}
