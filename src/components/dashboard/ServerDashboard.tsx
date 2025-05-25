'use client';

import { useState, useEffect } from 'react';
import ServerCard from './ServerCard';
import ServerDetailModal from './ServerDetailModal';
import { Server } from '../../types/server';

interface ServerDashboardProps {
  onStatsUpdate?: (stats: { total: number; online: number; warning: number; offline: number }) => void;
}

import { useDemoStore } from '../../stores/demoStore';

// 스크린샷과 동일한 목업 서버 데이터 (fallback용)
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
  
  // demoStore에서 실제 서버 데이터 가져오기
  const { servers } = useDemoStore();
  const currentServers = servers.length > 0 ? servers.map(s => ({
    id: s.id,
    name: s.name,
    status: s.status === 'healthy' ? 'online' : s.status === 'warning' ? 'warning' : 'offline',
    location: s.location,
    cpu: s.metrics.cpu,
    memory: s.metrics.memory,
    disk: s.metrics.disk,
    uptime: `${s.uptime}일`,
    lastUpdate: s.lastUpdate,
    alerts: s.status === 'critical' ? 3 : s.status === 'warning' ? 1 : 0,
    services: [
      { name: 'nginx', status: 'running', port: 80 },
      { name: 'nodejs', status: 'running', port: 3000 }
    ]
  } as Server)) : fallbackServers;

  // 서버 통계 계산
  const serverStats = {
    total: currentServers.length,
    online: currentServers.filter((s: Server) => s.status === 'online').length,
    warning: currentServers.filter((s: Server) => s.status === 'warning').length,
    offline: currentServers.filter((s: Server) => s.status === 'offline').length
  };

  // 통계 업데이트 알림
  useEffect(() => {
    if (onStatsUpdate) {
      onStatsUpdate(serverStats);
    }
  }, [onStatsUpdate]);

  // 필터링
  const filteredServers = currentServers.filter((server: Server) => 
    server.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleServerClick = (server: Server) => {
    setSelectedServer(server);
  };

  const handleCloseModal = () => {
    setSelectedServer(null);
  };

  return (
    <div className="p-4 sm:p-6 bg-gray-50 min-h-screen">
      {/* 상단 검색바 */}
      <div className="mb-4 sm:mb-6">
        <div className="bg-white rounded-lg p-3 sm:p-4 shadow-sm border border-gray-200">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="서버 이름 검색..."
                className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <button className="px-3 sm:px-4 py-2 bg-blue-500 text-white text-sm rounded-md hover:bg-blue-600 transition-colors">
                검색
              </button>
              <button className="px-3 sm:px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded-md hover:bg-gray-200 transition-colors">
                필터
              </button>
              <button className="px-3 sm:px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded-md hover:bg-gray-200 transition-colors">
                정렬
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 서버 카드 그리드 - 모바일 친화적 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-4">
        {filteredServers.map((server: Server) => (
          <ServerCard
            key={server.id}
            server={server}
            onClick={handleServerClick}
          />
        ))}
      </div>

      {/* 서버 상세 모달 */}
      {selectedServer && (
        <ServerDetailModal
          server={selectedServer}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
} 