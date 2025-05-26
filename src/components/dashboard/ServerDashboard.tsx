'use client';

import { useState, useEffect, useMemo } from 'react';
import ServerCard from './ServerCard';
import ServerDetailModal from './ServerDetailModal';
import { Server } from '../../types/server';
import { useServerDataStore } from '../../stores/serverDataStore';

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
  
  // ✅ API 기반 서버 데이터 스토어 사용
  const { 
    servers, 
    fetchServers, 
    refreshData, 
    isLoading, 
    error 
  } = useServerDataStore();
  
  // 서버 데이터를 Server 타입으로 변환
  const currentServers: Server[] = servers.map(server => ({
    id: server.id,
    name: server.name,
    status: server.status === 'healthy' ? 'online' : 
            server.status === 'warning' ? 'warning' : 'offline',
    location: server.location,
    cpu: server.metrics.cpu,
    memory: server.metrics.memory,
    disk: server.metrics.disk,
    uptime: `${server.uptime}일`,
    lastUpdate: server.lastUpdate,
    alerts: server.status === 'critical' ? 3 : server.status === 'warning' ? 1 : 0,
    services: [
      { name: 'nginx', status: server.status === 'critical' ? 'stopped' : 'running', port: 80 },
      { name: 'nodejs', status: 'running', port: 3000 },
      { name: 'gunicorn', status: 'running', port: 8000 }
    ]
  }));

  // 서버 통계 계산 (useMemo로 최적화)
  const serverStats = useMemo(() => ({
    total: currentServers.length,
    online: currentServers.filter((s: Server) => s.status === 'online').length,
    warning: currentServers.filter((s: Server) => s.status === 'warning').length,
    offline: currentServers.filter((s: Server) => s.status === 'offline').length
  }), [currentServers]);

  // ✅ 컴포넌트 마운트 시 서버 데이터 로드
  useEffect(() => {
    fetchServers();
    
    // 30초마다 데이터 새로고침
    const interval = setInterval(() => {
      refreshData();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [fetchServers, refreshData]);

  // 통계 업데이트 알림
  useEffect(() => {
    if (onStatsUpdate) {
      onStatsUpdate(serverStats);
    }
  }, [onStatsUpdate, serverStats]);

  // 검색 필터링
  const filteredServers = useMemo(() => {
    if (!searchTerm) return currentServers;
    
    return currentServers.filter(server => 
      server.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      server.location.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [currentServers, searchTerm]);

  // 서버 선택 핸들러
  const handleServerSelect = (server: Server) => {
    setSelectedServer(server);
  };

  // 서버 상태별 그룹핑
  const groupedServers = useMemo(() => {
    const groups = {
      critical: filteredServers.filter(s => s.status === 'offline'),
      warning: filteredServers.filter(s => s.status === 'warning'),
      healthy: filteredServers.filter(s => s.status === 'online')
    };
    return groups;
  }, [filteredServers]);

  // 로딩 상태 표시
  if (isLoading && servers.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-2 text-gray-600">서버 데이터를 로딩 중...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 에러 메시지 표시 */}
      {error && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-800">
                {error}
              </p>
            </div>
            <div className="ml-auto pl-3">
              <button
                onClick={() => fetchServers()}
                className="text-yellow-800 hover:text-yellow-900 text-sm underline"
              >
                다시 시도
              </button>
            </div>
          </div>
        </div>
      )}

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
          <button
            onClick={() => refreshData()}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            )}
            새로고침
          </button>
        </div>
      </div>

      {/* 서버 상태별 섹션 */}
      {groupedServers.critical.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-red-600 flex items-center gap-2">
            <span className="w-3 h-3 bg-red-500 rounded-full"></span>
            위험 상태 ({groupedServers.critical.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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

      {/* 서버 상세 모달 */}
      <ServerDetailModal
        server={selectedServer}
        onClose={() => setSelectedServer(null)}
      />
    </div>
  );
} 