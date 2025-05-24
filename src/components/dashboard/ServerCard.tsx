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
      case 'online': return 'bg-green-500';
      case 'warning': return 'bg-yellow-500';
      case 'offline': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'online': return '온라인';
      case 'warning': return '경고';
      case 'offline': return '오프라인';
      default: return '알 수 없음';
    }
  };

  return (
    <div 
      className={`
        relative bg-white rounded-2xl p-6 border border-gray-200 
        cursor-pointer transition-all duration-300 
        hover:shadow-xl hover:border-blue-300 hover:-translate-y-1
        ${isHovered ? 'shadow-xl border-blue-300 -translate-y-1' : 'shadow-md'}
      `}
      onClick={() => onClick(server)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 상태 뱃지 */}
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <div className={`w-3 h-3 rounded-full ${getStatusColor(server.status)}`}></div>
        <span className="text-sm font-medium text-gray-600">
          {getStatusText(server.status)}
        </span>
      </div>

      {/* 알림 뱃지 */}
      {server.alerts > 0 && (
        <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
          {server.alerts}
        </div>
      )}

      {/* 서버 정보 */}
      <div className="mb-4">
        <h3 className="text-xl font-bold text-gray-900 mb-1">{server.name}</h3>
        <p className="text-sm text-gray-500 flex items-center gap-1">
          <i className="fas fa-map-marker-alt"></i>
          {server.location}
        </p>
      </div>

      {/* 리소스 메트릭 */}
      <div className="space-y-3">
        {/* CPU */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm font-medium text-gray-600">CPU</span>
            <span className="text-sm font-bold text-gray-900">{server.cpu}%</span>
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

        {/* Memory */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm font-medium text-gray-600">메모리</span>
            <span className="text-sm font-bold text-gray-900">{server.memory}%</span>
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

        {/* Disk */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm font-medium text-gray-600">디스크</span>
            <span className="text-sm font-bold text-gray-900">{server.disk}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${
                server.disk > 80 ? 'bg-red-500' : 
                server.disk > 60 ? 'bg-yellow-500' : 'bg-purple-500'
              }`}
              style={{ width: `${server.disk}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* 업타임 */}
      <div className="mt-4 pt-3 border-t border-gray-100">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">업타임</span>
          <span className="text-sm font-medium text-gray-900">{server.uptime}</span>
        </div>
      </div>

      {/* 호버 효과용 액션 힌트 */}
      {isHovered && (
        <div className="absolute inset-0 bg-blue-50 bg-opacity-50 rounded-2xl flex items-center justify-center">
          <div className="text-blue-600 font-medium">클릭하여 상세 정보 보기</div>
        </div>
      )}
    </div>
  );
} 