/**
 * 🏷️ StatusBadge Component v2.0
 *
 * 서버 상태 뱃지 컴포넌트
 * - 상태별 색상 코딩
 * - 애니메이션 효과
 * - 액세서빌리티 지원
 */

import React, { memo } from 'react';
import { Server } from '../../../types/server';

interface StatusBadgeProps {
  server: Server;
  variant?: 'default' | 'compact' | 'detailed';
  showText?: boolean;
  showIcon?: boolean;
}

const StatusBadge: React.FC<StatusBadgeProps> = memo(
  ({ server, variant = 'default', showText = true, showIcon = true }) => {
    // 상태별 정보
    const getStatusInfo = (status: string) => {
      switch (status) {
        case 'online':
          return {
            color: 'text-green-600',
            bgColor: 'bg-green-100',
            borderColor: 'border-green-300',
            label: '정상',
            icon: '●',
            description: '서버가 정상적으로 작동 중입니다',
          };
        case 'warning':
          return {
            color: 'text-yellow-600',
            bgColor: 'bg-yellow-100',
            borderColor: 'border-yellow-300',
            label: '경고',
            icon: '▲',
            description: '주의가 필요한 상태입니다',
          };
        case 'offline':
          return {
            color: 'text-red-600',
            bgColor: 'bg-red-100',
            borderColor: 'border-red-300',
            label: '실패',
            icon: '●',
            description: '서버에 연결할 수 없습니다',
          };
        default:
          return {
            color: 'text-gray-600',
            bgColor: 'bg-gray-100',
            borderColor: 'border-gray-300',
            label: '알 수 없음',
            icon: '●',
            description: '상태를 확인할 수 없습니다',
          };
      }
    };

    // 배리언트별 클래스
    const getVariantClasses = () => {
      switch (variant) {
        case 'compact':
          return {
            container: 'px-2 py-1 text-xs',
            iconSize: 'text-xs',
            textSize: 'text-xs',
          };
        case 'detailed':
          return {
            container: 'px-4 py-2 text-sm',
            iconSize: 'text-sm',
            textSize: 'text-sm',
          };
        default:
          return {
            container: 'px-3 py-1 text-xs',
            iconSize: 'text-xs',
            textSize: 'text-xs',
          };
      }
    };

    const statusInfo = getStatusInfo(server.status);
    const classes = getVariantClasses();

    // 업타임 기반 추가 정보
    const getUptimeInfo = () => {
      const uptimeValue = server.uptime;

      // 업타임을 문자열로 변환
      let uptimeText: string;
      if (typeof uptimeValue === 'string') {
        uptimeText = uptimeValue;
      } else if (typeof uptimeValue === 'number') {
        // 숫자를 시간 형식으로 변환 (초 단위 가정)
        const hours = Math.floor(uptimeValue / 3600);
        const days = Math.floor(hours / 24);
        if (days > 0) {
          uptimeText = `${days} days`;
        } else {
          const minutes = Math.floor((uptimeValue % 3600) / 60);
          uptimeText = `${hours}h ${minutes}m`;
        }
      } else {
        return null;
      }

      if (uptimeText.includes('day')) {
        const days = parseInt(uptimeText);
        if (days > 365)
          return { badge: '🏆', text: '1년+', color: 'text-green-600' };
        if (days > 90)
          return { badge: '⭐', text: '90일+', color: 'text-blue-600' };
        if (days > 30)
          return { badge: '✅', text: '30일+', color: 'text-green-600' };
      }
      return null;
    };

    const uptimeInfo = getUptimeInfo();

    return (
      <div className='flex items-center gap-2'>
        {/* 메인 상태 뱃지 */}
        <div
          className={`
          ${classes.container}
          ${statusInfo.bgColor} 
          ${statusInfo.borderColor} 
          ${statusInfo.color}
          border rounded-lg font-medium flex items-center gap-1 flex-shrink-0
          transition-all duration-200 hover:shadow-sm
          ${server.status === 'online' ? 'animate-pulse' : ''}
        `}
          title={statusInfo.description}
          role='status'
          aria-label={`서버 상태: ${statusInfo.label}`}
        >
          {showIcon && (
            <span className={`${classes.iconSize} animate-pulse`}>
              {statusInfo.icon}
            </span>
          )}
          {showText && variant !== 'compact' && (
            <span className={classes.textSize}>{statusInfo.label}</span>
          )}
        </div>

        {/* 업타임 뱃지 (detailed 모드에서만) */}
        {variant === 'detailed' && uptimeInfo && (
          <div
            className={`
            px-2 py-1 bg-gray-50 border border-gray-200 rounded-lg 
            flex items-center gap-1 text-xs font-medium ${uptimeInfo.color}
          `}
            title={`연속 가동 시간: ${typeof server.uptime === 'string' ? server.uptime : typeof server.uptime === 'number' ? `${Math.floor(server.uptime / 3600)}h ${Math.floor((server.uptime % 3600) / 60)}m` : '알 수 없음'}`}
          >
            <span>{uptimeInfo.badge}</span>
            <span>{uptimeInfo.text}</span>
          </div>
        )}

        {/* 응답 시간 지표 (detailed 모드에서만) */}
        {variant === 'detailed' && (
          <div className='flex items-center gap-1 text-xs text-gray-500'>
            <span>📡</span>
            <span>{server.network ? `${server.network}ms` : '0ms'}</span>
          </div>
        )}

        {/* 위치 정보 (detailed 모드에서만) */}
        {variant === 'detailed' && server.location && (
          <div className='flex items-center gap-1 text-xs text-gray-500'>
            <span>📍</span>
            <span className='truncate max-w-20'>{server.location}</span>
          </div>
        )}

        {/* 서비스 수 표시 (compact가 아닌 경우) */}
        {variant !== 'compact' && server.services?.length > 0 && (
          <div className='flex items-center gap-1 text-xs text-gray-500'>
            <span>⚙️</span>
            <span>{server.services.length}</span>
          </div>
        )}
      </div>
    );
  }
);

StatusBadge.displayName = 'StatusBadge';

export default StatusBadge;
