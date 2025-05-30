'use client';

import { useState, useEffect, useMemo } from 'react';
import ServerCard from './ServerCard';
import ServerDetailModal from './ServerDetailModal';
import { Server } from '../../types/server';
import { useServerDataStore } from '../../stores/serverDataStore';
import { timerManager } from '../../utils/TimerManager';

interface ServerDashboardProps {
  onStatsUpdate?: (stats: { total: number; online: number; warning: number; offline: number }) => void;
}

// 스크린샷과 동일한 목업 서버 데이터
const fallbackServers: Server[] = [
  {
    id: 'api-eu-043',
    name: 'api-eu-043',
    status: 'online',
    location: 'EU West',
    cpu: 19,
    memory: 36.2,
    disk: 34.6,
    uptime: '15일 3시간',
    lastUpdate: new Date(),
    alerts: 0,
    services: [
      { name: 'gunicorn', status: 'running', port: 8000 },
      { name: 'python', status: 'running', port: 3000 },
      { name: 'nodejs', status: 'running', port: 3001 },
      { name: 'nginx', status: 'running', port: 80 }
    ]
  },
  {
    id: 'api-eu-045',
    name: 'api-eu-045',
    status: 'warning',
    location: 'EU West',
    cpu: 48,
    memory: 29.2,
    disk: 15.6,
    uptime: '8일 12시간',
    lastUpdate: new Date(),
    alerts: 0,
    services: [
      { name: 'nodejs', status: 'stopped', port: 3000 },
      { name: 'nginx', status: 'running', port: 80 },
      { name: 'gunicorn', status: 'running', port: 8000 }
    ]
  },
  {
    id: 'api-jp-040',
    name: 'api-jp-040',
    status: 'offline',
    location: 'Asia Pacific',
    cpu: 19,
    memory: 53.2,
    disk: 29.6,
    uptime: '3일 4시간',
    lastUpdate: new Date(),
    alerts: 3,
    services: [
      { name: 'nginx', status: 'stopped', port: 80 },
      { name: 'nodejs', status: 'running', port: 3000 },
      { name: 'gunicorn', status: 'running', port: 8000 },
      { name: 'uwsgi', status: 'stopped', port: 8080 }
    ]
  },
  {
    id: 'api-sg-042',
    name: 'api-sg-042',
    status: 'warning',
    location: 'Singapore',
    cpu: 37,
    memory: 41.2,
    disk: 19.6,
    uptime: '8일 6시간',
    lastUpdate: new Date(),
    alerts: 0,
    services: [
      { name: 'gunicorn', status: 'stopped', port: 8000 },
      { name: 'python', status: 'stopped', port: 3000 },
      { name: 'uwsgi', status: 'running', port: 8080 }
    ]
  },
  {
    id: 'api-sg-044',
    name: 'api-sg-044',
    status: 'offline',
    location: 'Singapore',
    cpu: 35,
    memory: 30.2,
    disk: 26.6,
    uptime: '0분',
    lastUpdate: new Date(),
    alerts: 3,
    services: [
      { name: 'nodejs', status: 'stopped', port: 3000 },
      { name: 'nginx', status: 'running', port: 80 }
    ]
  },
  {
    id: 'api-us-039',
    name: 'api-us-039',
    status: 'warning',
    location: 'US East',
    cpu: 30,
    memory: 35.2,
    disk: 5.6,
    uptime: '45일 18시간',
    lastUpdate: new Date(),
    alerts: 0,
    services: [
      { name: 'uwsgi', status: 'stopped', port: 8080 },
      { name: 'gunicorn', status: 'running', port: 8000 }
    ]
  },
  {
    id: 'api-us-041',
    name: 'api-us-041',
    status: 'online',
    location: 'US East',
    cpu: 59,
    memory: 48.2,
    disk: 30.6,
    uptime: '22일 5시간',
    lastUpdate: new Date(),
    alerts: 0,
    services: [
      { name: 'uwsgi', status: 'running', port: 8080 },
      { name: 'gunicorn', status: 'running', port: 8000 },
      { name: 'python', status: 'running', port: 3000 },
      { name: 'nodejs', status: 'running', port: 3001 }
    ]
  },
  {
    id: 'app-eu-025',
    name: 'app-eu-025',
    status: 'warning',
    location: 'EU West',
    cpu: 14.4,
    memory: 44.5,
    disk: 27.8,
    uptime: '18일 12시간',
    lastUpdate: new Date(),
    alerts: 0,
    services: [
      { name: 'tomcat', status: 'stopped', port: 8080 },
      { name: 'nodejs', status: 'running', port: 3000 }
    ]
  },
  {
    id: 'app-jp-020',
    name: 'app-jp-020',
    status: 'warning',
    location: 'Asia Pacific',
    cpu: 55.4,
    memory: 22.5,
    disk: 28.8,
    uptime: '9일 6시간',
    lastUpdate: new Date(),
    alerts: 0,
    services: [
      { name: 'supervisor', status: 'running', port: 9001 },
      { name: 'tomcat', status: 'running', port: 8080 },
      { name: 'nodejs', status: 'running', port: 3000 },
      { name: 'pm2', status: 'stopped', port: 0 }
    ]
  },
  {
    id: 'app-jp-022',
    name: 'app-jp-022',
    status: 'online',
    location: 'Asia Pacific',
    cpu: 17.4,
    memory: 58.5,
    disk: 25.8,
    uptime: '31일 2시간',
    lastUpdate: new Date(),
    alerts: 0,
    services: [
      { name: 'docker', status: 'running', port: 2375 },
      { name: 'pm2', status: 'running', port: 0 },
      { name: 'supervisor', status: 'running', port: 9001 },
      { name: 'nodejs', status: 'running', port: 3000 }
    ]
  }
];

export default function ServerDashboard({ onStatsUpdate }: ServerDashboardProps) {
  const [selectedServer, setSelectedServer] = useState<Server | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isClient, setIsClient] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const SERVERS_PER_PAGE = 8; // 페이지당 최대 8개 서버
  
  // ✅ API 기반 서버 데이터 스토어 사용
  const { 
    servers, 
    fetchServers, 
    refreshData, 
    isLoading, 
    error 
  } = useServerDataStore();

  // 🚀 디버깅 로그 추가
  console.log('📊 ServerDashboard 렌더링:', {
    serversCount: servers?.length,
    isClient,
    isLoading,
    error,
    searchTerm,
    currentPage,
    timestamp: new Date().toISOString()
  });

  // 클라이언트 사이드 확인
  useEffect(() => {
    console.log('✅ ServerDashboard 클라이언트 설정');
    setIsClient(true);
  }, []);
  
  // 서버 데이터를 Server 타입으로 변환 (클라이언트에서만)
  const currentServers: Server[] = useMemo(() => {
    if (!isClient) {
      return [];
    }

    // 🔍 디버깅 정보 추가
    console.log('🔄 ServerDashboard 데이터 매핑:', {
      serversFromStore: servers.length,
      isClient,
      serversArray: servers,
      timestamp: new Date().toISOString()
    });

    // ⚡ 개선: API 데이터 우선 사용, 더 안전한 타입 변환
    if (servers.length === 0) {
      console.warn('⚠️ API 서버 데이터가 없음 - fallback 데이터 사용');
      return fallbackServers;
    }

    const mappedServers = servers.map(server => {
      // API 데이터 구조에 맞게 안전한 매핑
      const serverData = (server as any).data || server;
      
      // 🔍 서버별 매핑 정보 로깅
      console.log('🗂️ 서버 매핑:', {
        id: serverData.id || serverData.hostname,
        status: serverData.status,
        cpu: serverData.cpu_usage || serverData.cpu,
        hasMetrics: !!serverData.metrics
      });
      
      // ✅ 타입 안전한 상태 매핑
      const mapStatus = (status: string): 'online' | 'offline' | 'warning' => {
        switch (status) {
          case 'healthy': return 'online';
          case 'warning': return 'warning';
          case 'critical': return 'offline';
          default: return 'online';
        }
      };
      
      return {
        id: serverData.id || serverData.hostname || `server-${Date.now()}-${Math.random()}`,
        name: serverData.name || serverData.hostname || 'Unknown Server',
        status: mapStatus(serverData.status || 'healthy'),
        location: serverData.location || serverData.environment || 'Seoul DC1',
        cpu: Math.round(serverData.cpu_usage || serverData.cpu || serverData.metrics?.cpu || Math.random() * 50 + 20),
        memory: Math.round(serverData.memory_usage || serverData.memory || serverData.metrics?.memory || Math.random() * 60 + 30),
        disk: Math.round(serverData.disk_usage || serverData.disk || serverData.metrics?.disk || Math.random() * 40 + 10),
        uptime: serverData.uptime || `${Math.floor(serverData.uptime_hours || Math.random() * 30)}일 ${Math.floor(Math.random() * 24)}시간`,
        lastUpdate: serverData.last_updated ? new Date(serverData.last_updated) : new Date(),
        alerts: serverData.alerts?.length || (serverData.status === 'critical' ? 3 : serverData.status === 'warning' ? 1 : 0),
        ip: serverData.ip || '192.168.1.100',
        os: serverData.os || 'Ubuntu 22.04 LTS',
        services: serverData.services || [
          { name: 'nginx', status: serverData.status === 'critical' ? 'stopped' : 'running', port: 80 },
          { name: 'nodejs', status: 'running', port: 3000 },
          { name: 'gunicorn', status: serverData.status === 'critical' ? 'stopped' : 'running', port: 8000 }
        ]
      } as Server;
    });

    console.log(`✅ 서버 매핑 완료: ${mappedServers.length}개 서버`);
    return mappedServers;
  }, [servers, isClient]);

  // 서버 통계 계산 (useMemo로 최적화)
  const serverStats = useMemo(() => {
    // 🚀 안전한 배열 처리: currentServers가 배열인지 확인
    if (!Array.isArray(currentServers)) {
      console.warn('⚠️ currentServers가 배열이 아닙니다:', typeof currentServers);
      return { total: 0, online: 0, warning: 0, offline: 0 };
    }
    
    return {
      total: currentServers.length,
      online: currentServers.filter((s: Server) => s?.status === 'online').length,
      warning: currentServers.filter((s: Server) => s?.status === 'warning').length,
      offline: currentServers.filter((s: Server) => s?.status === 'offline').length
    };
  }, [currentServers]);

  // ✅ 컴포넌트 마운트 시 서버 데이터 로드 (클라이언트에서만)
  useEffect(() => {
    if (!isClient) return;
    
    // 백그라운드에서 최신 데이터 가져오기 (이미 초기 데이터가 있으므로)
    refreshData();
    
    // TimerManager를 사용한 5초마다 데이터 새로고침
    timerManager.register({
      id: 'server-dashboard-refresh',
      callback: refreshData,
      interval: 5000,
      priority: 'medium'
    });
    
    return () => {
      timerManager.unregister('server-dashboard-refresh');
    };
  }, [refreshData, isClient]);

  // 통계 업데이트 알림
  useEffect(() => {
    if (onStatsUpdate && isClient) {
      onStatsUpdate(serverStats);
    }
  }, [onStatsUpdate, serverStats, isClient]);

  // 🔍 서버 데이터 동기화 상태 감지 및 자동 수정
  useEffect(() => {
    if (!isClient) return;
    
    console.log(`🔍 데이터 동기화 확인: API ${servers.length}개 ↔ UI ${currentServers.length}개`);
    
    // 불일치 감지시 강제 새로고침 (API에 데이터가 더 많은 경우)
    if (servers.length > 0 && servers.length !== currentServers.length) {
      console.warn('⚠️ 서버 수 불일치 감지 - 강제 동기화 실행');
      
      // 3초 후 자동 새로고침 (너무 빈번한 새로고침 방지)
      setTimeout(() => {
        console.log('🔄 자동 데이터 새로고침 실행');
        refreshData();
      }, 3000);
    }
  }, [servers.length, currentServers.length, isClient, refreshData]);

  // 검색 필터링
  const filteredServers = useMemo(() => {
    // 🚀 안전한 배열 처리: currentServers가 배열인지 확인
    if (!Array.isArray(currentServers)) {
      return [];
    }
    
    if (!searchTerm) return currentServers;
    
    return currentServers.filter(server => 
      server?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      server?.location?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [currentServers, searchTerm]);

  // 서버 선택 핸들러
  const handleServerSelect = (server: Server) => {
    setSelectedServer(server);
  };

  // 페이지네이션 계산
  const totalPages = Math.ceil((filteredServers?.length || 0) / SERVERS_PER_PAGE);
  const startIndex = (currentPage - 1) * SERVERS_PER_PAGE;
  const endIndex = startIndex + SERVERS_PER_PAGE;
  const paginatedServers = Array.isArray(filteredServers) ? filteredServers.slice(startIndex, endIndex) : [];

  // 페이지 변경 시 맨 위로 스크롤
  useEffect(() => {
    if (currentPage > 1) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentPage]);

  // 검색어 변경 시 첫 페이지로 이동
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // 서버 상태별 그룹핑 (페이지네이션 적용)
  const groupedServers = useMemo(() => {
    // 🚀 안전한 배열 처리: paginatedServers가 배열인지 확인
    if (!Array.isArray(paginatedServers)) {
      return { critical: [], warning: [], healthy: [] };
    }
    
    const groups = {
      critical: paginatedServers.filter(s => s?.status === 'offline'),
      warning: paginatedServers.filter(s => s?.status === 'warning'),
      healthy: paginatedServers.filter(s => s?.status === 'online')
    };
    return groups;
  }, [paginatedServers]);

  // 서버 사이드 렌더링 시 기본 UI 반환
  if (!isClient) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">서버 연결 중</h3>
          <p className="text-gray-600">모니터링 시스템을 초기화하고 있습니다...</p>
        </div>
      </div>
    );
  }

  // 서버가 없는 경우만 로딩 표시 (초기 데이터는 항상 있음)
  if (currentServers.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">서버 연결 중</h3>
          <p className="text-gray-600">모니터링 시스템을 초기화하고 있습니다...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 시스템 상태 표시 */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          </div>
          <div className="ml-3">
            <p className="text-sm text-green-800">
              실시간 모니터링 활성화 - 5초마다 자동 업데이트
            </p>
          </div>
          <div className="ml-auto pl-3">
            <span className="text-xs text-green-600">
              마지막 업데이트: {new Date().toLocaleTimeString()}
            </span>
          </div>
        </div>
      </div>

      {/* 검색 및 필터 */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <input
            type="text"
            placeholder="서버 이름 또는 위치로 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="flex gap-2">
          <div className="flex items-center gap-2">
            {isLoading && (
              <div className="flex items-center gap-2 text-sm text-blue-600">
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                <span>업데이트 중...</span>
              </div>
            )}
            <button
              onClick={() => refreshData()}
              disabled={isLoading}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              새로고침
            </button>
          </div>
        </div>
      </div>

      {/* 페이지네이션 정보 및 컨트롤 */}
      {filteredServers.length > 0 && (
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-600">
              전체 <span className="font-semibold text-gray-900">{filteredServers.length}</span>개 서버 중 
              <span className="font-semibold text-blue-600 mx-1">
                {startIndex + 1}-{Math.min(endIndex, filteredServers.length)}
              </span>개 표시
            </div>
            <div className="flex items-center gap-2 text-xs">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-gray-500">페이지당 최대 8개로 제한하여 성능 최적화</span>
            </div>
          </div>
          
          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
              >
                <i className="fas fa-chevron-left text-xs"></i>
                이전
              </button>
              
              <div className="flex items-center gap-1">
                {(() => {
                  const pages = [];
                  const maxVisiblePages = 5;
                  
                  if (totalPages <= maxVisiblePages) {
                    // 페이지가 5개 이하면 모두 표시
                    for (let i = 1; i <= totalPages; i++) {
                      pages.push(
                        <button
                          key={i}
                          onClick={() => setCurrentPage(i)}
                          className={`px-3 py-1 text-sm rounded-md transition-colors ${
                            currentPage === i
                              ? 'bg-blue-500 text-white'
                              : 'bg-white border border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {i}
                        </button>
                      );
                    }
                  } else {
                    // 페이지가 많을 때는 현재 페이지 주변만 표시
                    const startPage = Math.max(1, currentPage - 2);
                    const endPage = Math.min(totalPages, currentPage + 2);
                    
                    // 첫 페이지
                    if (startPage > 1) {
                      pages.push(
                        <button
                          key={1}
                          onClick={() => setCurrentPage(1)}
                          className="px-3 py-1 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                        >
                          1
                        </button>
                      );
                      if (startPage > 2) {
                        pages.push(
                          <span key="start-ellipsis" className="px-2 text-gray-500">...</span>
                        );
                      }
                    }
                    
                    // 현재 페이지 주변
                    for (let i = startPage; i <= endPage; i++) {
                      pages.push(
                        <button
                          key={i}
                          onClick={() => setCurrentPage(i)}
                          className={`px-3 py-1 text-sm rounded-md transition-colors ${
                            currentPage === i
                              ? 'bg-blue-500 text-white'
                              : 'bg-white border border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {i}
                        </button>
                      );
                    }
                    
                    // 마지막 페이지
                    if (endPage < totalPages) {
                      if (endPage < totalPages - 1) {
                        pages.push(
                          <span key="end-ellipsis" className="px-2 text-gray-500">...</span>
                        );
                      }
                      pages.push(
                        <button
                          key={totalPages}
                          onClick={() => setCurrentPage(totalPages)}
                          className="px-3 py-1 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                        >
                          {totalPages}
                        </button>
                      );
                    }
                  }
                  
                  return pages;
                })()}
              </div>
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
              >
                다음
                <i className="fas fa-chevron-right text-xs"></i>
              </button>
            </div>
          )}
        </div>
      )}

      {/* 서버 상태별 섹션 */}
      {groupedServers.critical.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-red-600 flex items-center gap-2">
            <span className="w-3 h-3 bg-red-500 rounded-full"></span>
            위험 상태 ({groupedServers.critical.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {groupedServers.critical.map((server) => (
              <ServerCard
                key={server.id}
                server={server}
                onClick={() => handleServerSelect(server)}
              />
            ))}
          </div>
        </div>
      )}

      {groupedServers.warning.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-yellow-600 flex items-center gap-2">
            <span className="w-3 h-3 bg-yellow-500 rounded-full"></span>
            주의 상태 ({groupedServers.warning.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {groupedServers.warning.map((server) => (
              <ServerCard
                key={server.id}
                server={server}
                onClick={() => handleServerSelect(server)}
              />
            ))}
          </div>
        </div>
      )}

      {groupedServers.healthy.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-green-600 flex items-center gap-2">
            <span className="w-3 h-3 bg-green-500 rounded-full"></span>
            정상 상태 ({groupedServers.healthy.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {groupedServers.healthy.map((server) => (
              <ServerCard
                key={server.id}
                server={server}
                onClick={() => handleServerSelect(server)}
              />
            ))}
          </div>
        </div>
      )}

      {/* 서버가 없는 경우 */}
      {filteredServers.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <div className="mx-auto h-12 w-12 text-gray-400">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="mt-2 text-sm font-medium text-gray-900">서버가 없습니다</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm ? '검색 조건에 맞는 서버가 없습니다.' : '등록된 서버가 없습니다.'}
          </p>
        </div>
      )}

      {/* 현재 페이지에 서버가 없는 경우 (전체 서버는 있지만 현재 페이지가 비어있음) */}
      {filteredServers.length > 0 && paginatedServers.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <div className="mx-auto h-12 w-12 text-gray-400">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="mt-2 text-sm font-medium text-gray-900">이 페이지에는 서버가 없습니다</h3>
          <p className="mt-1 text-sm text-gray-500">
            다른 페이지를 확인하거나 첫 페이지로 이동해보세요.
          </p>
          <button
            onClick={() => setCurrentPage(1)}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            첫 페이지로 이동
          </button>
        </div>
      )}

      {/* 서버 상세 모달 */}
      <ServerDetailModal
        server={selectedServer}
        onClose={() => setSelectedServer(null)}
      />
    </div>
  );
} 