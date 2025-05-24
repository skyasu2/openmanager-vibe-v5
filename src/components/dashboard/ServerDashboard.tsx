'use client';

import { useState } from 'react';
import ServerCard from './ServerCard';
import ServerDetailModal from './ServerDetailModal';
import { Server } from '../../types/server';

interface ServerDashboardProps {
  onAskAI?: (query: string, context?: any) => void;
}

// 목업 데이터
const mockServers: Server[] = [
  {
    id: 'api-eu-043',
    name: 'api-eu-043',
    status: 'online',
    location: 'EU West',
    cpu: 19,
    memory: 36.2,
    disk: 34.6,
    uptime: '11 days, 14 hours',
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
    uptime: '8 days, 3 hours',
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
    uptime: '2 days, 12 hours',
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
    uptime: '15 days, 8 hours',
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
    uptime: '5 days, 16 hours',
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
    uptime: '22 days, 4 hours',
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
    uptime: '11 days, 14 hours',
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
    uptime: '18 days, 12 hours',
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
    uptime: '9 days, 6 hours',
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
    uptime: '31 days, 2 hours',
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

export default function ServerDashboard({ onAskAI }: ServerDashboardProps) {
  const [selectedServer, setSelectedServer] = useState<Server | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // 필터링
  const filteredServers = mockServers.filter(server => {
    const matchesSearch = server.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || server.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // 페이지네이션
  const totalPages = Math.ceil(filteredServers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentServers = filteredServers.slice(startIndex, startIndex + itemsPerPage);

  const handleServerClick = (server: Server) => {
    setSelectedServer(server);
  };

  const handleCloseModal = () => {
    setSelectedServer(null);
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* 검색 및 필터 */}
      <div className="mb-6 bg-white p-4 rounded-lg shadow-sm">
        <div className="flex gap-4 items-center">
          <div className="flex-1">
            <input
              type="text"
              placeholder="서버 이름 검색..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">전체</option>
            <option value="online">정상</option>
            <option value="warning">경고</option>
            <option value="offline">실패</option>
          </select>
        </div>
      </div>

      {/* 서버 카드 그리드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
        {currentServers.map((server) => (
          <ServerCard
            key={server.id}
            server={server}
            onClick={handleServerClick}
          />
        ))}
      </div>

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2">
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="px-3 py-2 rounded-md bg-white border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            이전
          </button>
          
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`px-3 py-2 rounded-md ${
                currentPage === page
                  ? 'bg-blue-500 text-white'
                  : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {page}
            </button>
          ))}
          
          <button
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-2 rounded-md bg-white border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            다음
          </button>
        </div>
      )}

      {/* 서버 상세 모달 */}
      {selectedServer && (
        <ServerDetailModal
          server={selectedServer}
          onClose={handleCloseModal}
          onAskAI={onAskAI}
        />
      )}
    </div>
  );
} 