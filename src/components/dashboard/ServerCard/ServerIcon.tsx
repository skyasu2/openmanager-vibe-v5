/**
 * 🎯 ServerIcon Component v2.0
 *
 * 서버 타입별 아이콘 표시 컴포넌트
 * - 서버 상태에 따른 아이콘 변경
 * - 환경별 아이콘 지원 (AWS, GCP, Azure 등)
 * - 애니메이션 및 호버 효과
 */

import React, { memo } from 'react';
import { Server } from '../../../types/server';

interface ServerIconProps {
  server: Server;
  size?: 'sm' | 'md' | 'lg';
  showTooltip?: boolean;
}

const ServerIcon: React.FC<ServerIconProps> = memo(
  ({ server, size = 'md', showTooltip = true }) => {
    // 크기별 클래스
    const sizeClasses = {
      sm: 'w-6 h-6 text-sm',
      md: 'w-8 h-8 text-base',
      lg: 'w-10 h-10 text-lg',
    };

    // 상태별 아이콘 및 색상
    const getIconInfo = () => {
      switch (server.status) {
        case 'online':
          return {
            icon: '🖥️',
            bgColor: 'bg-green-100',
            borderColor: 'border-green-300',
            textColor: 'text-green-700',
          };
        case 'warning':
          return {
            icon: '⚠️',
            bgColor: 'bg-yellow-100',
            borderColor: 'border-yellow-300',
            textColor: 'text-yellow-700',
          };
        case 'offline':
          return {
            icon: '💤',
            bgColor: 'bg-red-100',
            borderColor: 'border-red-300',
            textColor: 'text-red-700',
          };
        default:
          return {
            icon: '❓',
            bgColor: 'bg-gray-100',
            borderColor: 'border-gray-300',
            textColor: 'text-gray-700',
          };
      }
    };

    // 환경별 추가 아이콘 (보조)
    const getEnvironmentIcon = () => {
      if (server.location?.toLowerCase().includes('aws')) return '☁️';
      if (server.location?.toLowerCase().includes('azure')) return '🔷';
      if (server.location?.toLowerCase().includes('gcp')) return '🌐';
      return null;
    };

    const iconInfo = getIconInfo();
    const environmentIcon = getEnvironmentIcon();

    return (
      <div className='relative inline-flex items-center'>
        {/* 메인 아이콘 */}
        <div
          className={`
          ${sizeClasses[size]} 
          ${iconInfo.bgColor} 
          ${iconInfo.borderColor} 
          ${iconInfo.textColor}
          rounded-lg border-2 flex items-center justify-center
          transition-all duration-200 hover:scale-110
          ${server.status === 'online' ? 'animate-pulse' : ''}
        `}
          title={showTooltip ? `${server.name} - ${server.status}` : undefined}
        >
          <span className='text-xl'>{iconInfo.icon}</span>
        </div>

        {/* 환경 아이콘 (우하단 오버레이) */}
        {environmentIcon && (
          <div className='absolute -bottom-1 -right-1 w-4 h-4 bg-white rounded-full border border-gray-200 flex items-center justify-center'>
            <span className='text-xs'>{environmentIcon}</span>
          </div>
        )}

        {/* 알림 뱃지 */}
        {server.alerts > 0 && (
          <div className='absolute -top-1 -right-1 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full min-w-[18px] text-center'>
            {server.alerts}
          </div>
        )}
      </div>
    );
  }
);

ServerIcon.displayName = 'ServerIcon';

export default ServerIcon;
