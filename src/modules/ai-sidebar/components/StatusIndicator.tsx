/**
 * StatusIndicator Component
 * 
 * 🟢 AI 상태 표시 컴포넌트
 */

'use client';

import React from 'react';

interface StatusIndicatorProps {
  status?: 'online' | 'offline' | 'loading';
  className?: string;
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  status = 'online',
  className = ''
}) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'online':
        return {
          color: 'bg-green-500',
          label: '온라인',
          icon: '🟢'
        };
      case 'offline':
        return {
          color: 'bg-red-500',
          label: '오프라인',
          icon: '🔴'
        };
      case 'loading':
        return {
          color: 'bg-yellow-500 animate-pulse',
          label: '연결 중',
          icon: '🟡'
        };
      default:
        return {
          color: 'bg-gray-500',
          label: '알 수 없음',
          icon: '⚪'
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div className={`flex items-center space-x-1 ${className}`}>
      <div className={`w-2 h-2 rounded-full ${config.color}`} />
      <span className="text-xs text-gray-500 dark:text-gray-400">
        {config.label}
      </span>
    </div>
  );
}; 