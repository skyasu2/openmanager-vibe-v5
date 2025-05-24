'use client';

import { useState } from 'react';
import { Server } from '../../types/server';

interface ServerCardProps {
  server: Server;
  onClick: (server: Server) => void;
}

export default function ServerCard({ server, onClick }: ServerCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return { bg: 'bg-green-500', text: 'text-green-700', label: '정상' };
      case 'warning': return { bg: 'bg-yellow-500', text: 'text-yellow-700', label: '경고' };
      case 'offline': return { bg: 'bg-red-500', text: 'text-red-700', label: '실패' };
      default: return { bg: 'bg-gray-500', text: 'text-gray-700', label: '알 수 없음' };
    }
  };

  const getServiceColor = (status: string) => {
    switch (status) {
      case 'running': return 'bg-green-100 text-green-700 border-green-200';
      case 'stopped': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const statusStyle = getStatusColor(server.status);

  return (
    <div 
      className={`
        relative bg-white rounded-lg p-4 border border-gray-200 
        cursor-pointer transition-all duration-200 
        hover:shadow-lg hover:border-gray-300
        ${isHovered ? 'shadow-lg border-gray-300' : 'shadow-sm'}
      `}
      onClick={() => onClick(server)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 헤더: 서버명 + 상태 */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{server.name}</h3>
        <span className={`px-2 py-1 rounded text-sm font-medium ${statusStyle.text} bg-gray-50`}>
          {statusStyle.label}
        </span>
      </div>

      {/* CPU 사용률 */}
      <div className="mb-3">
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm text-gray-600">CPU 사용률</span>
          <span className="text-sm font-semibold text-gray-900">{server.cpu}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-300 ${
              server.cpu > 80 ? 'bg-red-500' : 
              server.cpu > 60 ? 'bg-yellow-500' : 'bg-green-500'
            }`}
            style={{ width: `${server.cpu}%` }}
          ></div>
        </div>
      </div>

      {/* 메모리 사용률 */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm text-gray-600">메모리</span>
          <span className="text-sm font-semibold text-gray-900">{server.memory}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-300 ${
              server.memory > 80 ? 'bg-red-500' : 
              server.memory > 60 ? 'bg-yellow-500' : 'bg-blue-500'
            }`}
            style={{ width: `${server.memory}%` }}
          ></div>
        </div>
      </div>

      {/* 추가 정보 */}
      <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
        <div>
          <span className="text-gray-500">디스크 (/)</span>
          <div className="font-medium text-gray-900">{server.disk}%</div>
        </div>
        <div>
          <span className="text-gray-500">응답 속도</span>
          <div className="font-medium text-gray-900">
            {Math.random() > 0.5 ? (Math.random() * 0.5).toFixed(2) : (Math.random() * 2).toFixed(1)}
          </div>
        </div>
      </div>

      {/* 서비스 태그 */}
      <div className="flex flex-wrap gap-1">
        {server.services.map((service, index) => (
          <span
            key={index}
            className={`px-2 py-1 rounded text-xs border ${getServiceColor(service.status)}`}
          >
            {service.name} ({service.status === 'running' ? 'running' : 'stopped'})
          </span>
        ))}
      </div>

      {/* 상태 인디케이터 (우상단) */}
      <div className={`absolute top-3 right-12 w-2 h-2 rounded-full ${statusStyle.bg}`}></div>

      {/* 알림 뱃지 */}
      {server.alerts > 0 && (
        <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
          {server.alerts}
        </div>
      )}
    </div>
  );
} 