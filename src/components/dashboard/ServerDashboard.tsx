'use client';

import { useState } from 'react';
import ServerCard from './ServerCard';
import ServerDetailModal from './ServerDetailModal';
import { Server } from '../../types/server';

interface ServerDashboardProps {
  onAskAI: (query: string, serverId: string) => void;
}

// 목업 데이터
const mockServers: Server[] = [
  {
    id: 'api-us-001',
    name: 'API-US-001',
    status: 'online',
    cpu: 45,
    memory: 62,
    disk: 78,
    uptime: '15일 3시간',
    location: '미국 동부',
    alerts: 0,
    ip: '192.168.1.10',
    os: 'Ubuntu 22.04',
    services: [
      { name: 'nginx', status: 'running', port: 80 },
      { name: 'node.js', status: 'running', port: 3000 },
      { name: 'redis', status: 'running', port: 6379 }
    ],
    logs: [
      { timestamp: '2025-01-03 14:30:15', level: 'INFO', message: 'Server started successfully' },
      { timestamp: '2025-01-03 14:25:32', level: 'WARN', message: 'High memory usage detected' },
      { timestamp: '2025-01-03 14:20:45', level: 'INFO', message: 'Database connection established' }
    ]
  },
  {
    id: 'db-eu-002',
    name: 'DB-EU-002',
    status: 'warning',
    cpu: 85,
    memory: 91,
    disk: 45,
    uptime: '8일 12시간',
    location: '유럽 서부',
    alerts: 2,
    ip: '192.168.1.20',
    os: 'CentOS 8',
    services: [
      { name: 'mysql', status: 'running', port: 3306 },
      { name: 'backup-service', status: 'stopped', port: 8080 }
    ],
    logs: [
      { timestamp: '2025-01-03 14:35:22', level: 'ERROR', message: 'High CPU usage: 85%' },
      { timestamp: '2025-01-03 14:30:11', level: 'WARN', message: 'Memory usage critical: 91%' },
      { timestamp: '2025-01-03 14:25:55', level: 'INFO', message: 'Database backup completed' }
    ]
  },
  {
    id: 'web-ap-003',
    name: 'WEB-AP-003',
    status: 'online',
    cpu: 32,
    memory: 48,
    disk: 65,
    uptime: '3일 7시간',
    location: '아시아 태평양',
    alerts: 1,
    ip: '192.168.1.30',
    os: 'Amazon Linux 2',
    services: [
      { name: 'apache', status: 'running', port: 80 },
      { name: 'php-fpm', status: 'running', port: 9000 },
      { name: 'memcached', status: 'running', port: 11211 }
    ],
    logs: [
      { timestamp: '2025-01-03 14:40:18', level: 'INFO', message: 'Server restart completed' },
      { timestamp: '2025-01-03 14:35:44', level: 'WARN', message: 'SSL certificate expires in 7 days' },
      { timestamp: '2025-01-03 14:30:29', level: 'INFO', message: 'Cache cleared successfully' }
    ]
  },
  {
    id: 'cache-us-004',
    name: 'CACHE-US-004',
    status: 'offline',
    cpu: 0,
    memory: 0,
    disk: 88,
    uptime: '0분',
    location: '미국 서부',
    alerts: 5,
    ip: '192.168.1.40',
    os: 'Ubuntu 20.04',
    services: [
      { name: 'redis', status: 'stopped', port: 6379 },
      { name: 'monitoring', status: 'stopped', port: 9090 }
    ],
    logs: [
      { timestamp: '2025-01-03 14:42:33', level: 'ERROR', message: 'Server connection lost' },
      { timestamp: '2025-01-03 14:40:15', level: 'ERROR', message: 'Redis service crashed' },
      { timestamp: '2025-01-03 14:38:22', level: 'WARN', message: 'Disk space critical: 88%' }
    ]
  },
  {
    id: 'monitor-eu-005',
    name: 'MONITOR-EU-005',
    status: 'online',
    cpu: 23,
    memory: 34,
    disk: 42,
    uptime: '45일 18시간',
    location: '유럽 중부',
    alerts: 0,
    ip: '192.168.1.50',
    os: 'Debian 11',
    services: [
      { name: 'prometheus', status: 'running', port: 9090 },
      { name: 'grafana', status: 'running', port: 3000 },
      { name: 'alertmanager', status: 'running', port: 9093 }
    ],
    logs: [
      { timestamp: '2025-01-03 14:45:12', level: 'INFO', message: 'Monitoring data collected' },
      { timestamp: '2025-01-03 14:40:38', level: 'INFO', message: 'Alert rules updated' },
      { timestamp: '2025-01-03 14:35:55', level: 'INFO', message: 'Dashboard refreshed' }
    ]
  },
  {
    id: 'backup-ap-006',
    name: 'BACKUP-AP-006',
    status: 'online',
    cpu: 18,
    memory: 29,
    disk: 95,
    uptime: '22일 5시간',
    location: '아시아 남동부',
    alerts: 1,
    ip: '192.168.1.60',
    os: 'Ubuntu 22.04',
    services: [
      { name: 'rsync', status: 'running', port: 873 },
      { name: 'cron', status: 'running', port: 0 }
    ],
    logs: [
      { timestamp: '2025-01-03 14:48:45', level: 'WARN', message: 'Disk space almost full: 95%' },
      { timestamp: '2025-01-03 14:45:22', level: 'INFO', message: 'Backup job completed successfully' },
      { timestamp: '2025-01-03 14:40:18', level: 'INFO', message: 'Daily backup started' }
    ]
  }
];

export default function ServerDashboard({ onAskAI }: ServerDashboardProps) {
  const [selectedServer, setSelectedServer] = useState<Server | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'online' | 'warning' | 'offline'>('all');

  const handleServerClick = (server: Server) => {
    setSelectedServer(server);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedServer(null);
  };

  const filteredServers = mockServers.filter(server => {
    if (filter === 'all') return true;
    return server.status === filter;
  });

  const getFilterCount = (status: string) => {
    if (status === 'all') return mockServers.length;
    return mockServers.filter(s => s.status === status).length;
  };

  return (
    <div className="p-6">
      {/* 헤더 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">서버 대시보드</h1>
        <p className="text-gray-600">실시간 서버 상태 및 성능 모니터링</p>
      </div>

      {/* 요약 통계 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">전체 서버</p>
              <p className="text-2xl font-bold text-gray-900">{mockServers.length}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <i className="fas fa-server text-blue-600 text-xl"></i>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">온라인</p>
              <p className="text-2xl font-bold text-green-600">{getFilterCount('online')}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <i className="fas fa-check-circle text-green-600 text-xl"></i>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">경고</p>
              <p className="text-2xl font-bold text-yellow-600">{getFilterCount('warning')}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <i className="fas fa-exclamation-triangle text-yellow-600 text-xl"></i>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">오프라인</p>
              <p className="text-2xl font-bold text-red-600">{getFilterCount('offline')}</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <i className="fas fa-times-circle text-red-600 text-xl"></i>
            </div>
          </div>
        </div>
      </div>

      {/* 필터 버튼 */}
      <div className="flex items-center gap-4 mb-6">
        <span className="text-sm font-medium text-gray-700">필터:</span>
        {[
          { key: 'all', label: '전체', count: getFilterCount('all') },
          { key: 'online', label: '온라인', count: getFilterCount('online') },
          { key: 'warning', label: '경고', count: getFilterCount('warning') },
          { key: 'offline', label: '오프라인', count: getFilterCount('offline') }
        ].map(({ key, label, count }) => (
          <button
            key={key}
            onClick={() => setFilter(key as any)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === key
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {label} ({count})
          </button>
        ))}
      </div>

      {/* 서버 카드 그리드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredServers.map((server) => (
          <ServerCard
            key={server.id}
            server={server}
            onClick={handleServerClick}
          />
        ))}
      </div>

      {/* 빈 상태 */}
      {filteredServers.length === 0 && (
        <div className="text-center py-12">
          <i className="fas fa-search text-4xl text-gray-400 mb-4"></i>
          <p className="text-gray-500">해당 조건에 맞는 서버가 없습니다.</p>
        </div>
      )}

      {/* 서버 상세 모달 */}
      <ServerDetailModal
        server={selectedServer}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onAskAI={onAskAI}
      />
    </div>
  );
} 