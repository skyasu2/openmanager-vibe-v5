'use client';

import { useState } from 'react';
import { Server } from '../../types/server';

interface ServerCardProps {
  server: Server;
  onClick: (server: Server) => void;
}

export default function ServerCard({ server, onClick }: ServerCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'online': return { 
        color: 'text-green-600', 
        bgColor: 'bg-green-100',
        label: '정상',
        icon: '●'
      };
      case 'warning': return { 
        color: 'text-yellow-600', 
        bgColor: 'bg-yellow-100',
        label: '경고',
        icon: '▲'
      };
      case 'offline': return { 
        color: 'text-red-600', 
        bgColor: 'bg-red-100',
        label: '실패',
        icon: '●'
      };
      default: return { 
        color: 'text-gray-600', 
        bgColor: 'bg-gray-100',
        label: '알 수 없음',
        icon: '●'
      };
    }
  };

  const getProgressBarColor = (value: number, type: 'cpu' | 'memory' | 'disk') => {
    if (type === 'cpu') {
      if (value > 80) return 'bg-red-500';
      if (value > 60) return 'bg-yellow-500';
      return 'bg-green-500';
    }
    if (type === 'memory') {
      if (value > 80) return 'bg-red-500';
      if (value > 60) return 'bg-yellow-500';
      return 'bg-blue-500';
    }
    if (type === 'disk') {
      if (value > 80) return 'bg-red-500';
      if (value > 60) return 'bg-yellow-500';
      return 'bg-purple-500';
    }
    return 'bg-gray-500';
  };

  const getServiceTagColor = (status: string) => {
    switch (status) {
      case 'running': return 'bg-green-100 text-green-700 border-green-300';
      case 'stopped': return 'bg-red-100 text-red-700 border-red-300';
      default: return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const statusInfo = getStatusInfo(server.status);

  return (
    <div 
      className={`
        relative bg-white rounded-lg p-3 border border-gray-200 
        cursor-pointer transition-all duration-200 
        hover:shadow-md hover:border-gray-300
        ${isHovered ? 'shadow-md border-gray-300' : 'shadow-sm'}
        min-h-[200px] sm:min-h-[220px]
      `}
      onClick={() => onClick(server)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 헤더: 서버명 + 상태 */}
      <div className="flex justify-between items-start mb-3">
        <h3 className="text-sm sm:text-base font-semibold text-gray-900 truncate pr-2">
          {server.name}
        </h3>
        <span className={`${statusInfo.color} text-xs sm:text-sm font-medium flex items-center gap-1 flex-shrink-0`}>
          <span className="text-xs">{statusInfo.icon}</span>
          <span className="hidden sm:inline">{statusInfo.label}</span>
        </span>
      </div>

      {/* 리소스 사용률 (컴팩트) */}
      <div className="space-y-2 mb-3">
        {/* CPU */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs text-gray-600">CPU</span>
            <span className="text-xs font-medium text-gray-900">{server.cpu}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1">
            <div 
              className={`h-1 rounded-full transition-all duration-300 ${getProgressBarColor(server.cpu, 'cpu')}`}
              style={{ width: `${server.cpu}%` }}
            ></div>
          </div>
        </div>

        {/* 메모리 */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs text-gray-600">메모리</span>
            <span className="text-xs font-medium text-gray-900">{server.memory}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1">
            <div 
              className={`h-1 rounded-full transition-all duration-300 ${getProgressBarColor(server.memory, 'memory')}`}
              style={{ width: `${server.memory}%` }}
            ></div>
          </div>
        </div>

        {/* 디스크 */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs text-gray-600">디스크</span>
            <span className="text-xs font-medium text-gray-900">{server.disk}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1">
            <div 
              className={`h-1 rounded-full transition-all duration-300 ${getProgressBarColor(server.disk, 'disk')}`}
              style={{ width: `${server.disk}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* 추가 정보 (컴팩트) */}
      <div className="space-y-1 mb-3 text-xs text-gray-600">
        <div className="flex justify-between">
          <span>위치</span>
          <span className="font-medium text-gray-900 truncate ml-2">{server.location || 'N/A'}</span>
        </div>
        <div className="flex justify-between">
          <span>업타임</span>
          <span className="font-medium text-gray-900">{server.uptime}</span>
        </div>
        <div className="flex justify-between">
          <span>응답속도</span>
          <span className="font-medium text-gray-900">
            {(Math.random() * 0.5 + 0.1).toFixed(2)}s
          </span>
        </div>
      </div>

      {/* 서비스 태그 (최대 2개만 표시) */}
      <div className="flex flex-wrap gap-1 mb-2">
        {server.services.slice(0, 2).map((service, index) => (
          <span
            key={index}
            className={`px-1.5 py-0.5 rounded text-xs border ${getServiceTagColor(service.status)}`}
          >
            {service.name}
          </span>
        ))}
        {server.services.length > 2 && (
          <span className="px-1.5 py-0.5 rounded text-xs bg-gray-100 text-gray-600 border border-gray-300">
            +{server.services.length - 2}
          </span>
        )}
      </div>

      {/* 알림 뱃지 */}
      {server.alerts > 0 && (
        <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
          {server.alerts}
        </div>
      )}
    </div>
  );
} 