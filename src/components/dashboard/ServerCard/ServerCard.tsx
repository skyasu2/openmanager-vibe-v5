/**
 * 🎯 ServerCard Component v2.0
 * 
 * 모듈화된 서버 카드 컴포넌트
 * - 4개 하위 컴포넌트로 분리된 구조
 * - 3가지 variant 지원 (default, compact, detailed)
 * - React.memo 성능 최적화
 * - 100% 호환성 유지
 */

import React, { memo, useState, useCallback } from 'react';
import { Server } from '../../../types/server';
import ServerIcon from './ServerIcon';
import MetricsDisplay from './MetricsDisplay';
import StatusBadge from './StatusBadge';
import ActionButtons from './ActionButtons';

interface ServerCardProps {
  server: Server;
  onClick: (server: Server) => void;
  variant?: 'default' | 'compact' | 'detailed';
  showActions?: boolean;
  onAction?: (action: string, server: Server) => void;
}

const ServerCard: React.FC<ServerCardProps> = memo(({
  server,
  onClick,
  variant = 'default',
  showActions = true,
  onAction
}) => {
  const [isHovered, setIsHovered] = useState(false);

  // 서비스 태그 색상 결정
  const getServiceTagColor = useCallback((status: string) => {
    switch (status) {
      case 'running': return 'bg-green-100 text-green-700 border-green-300';
      case 'stopped': return 'bg-red-100 text-red-700 border-red-300';
      default: return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  }, []);

  // 배리언트별 스타일
  const getVariantStyles = () => {
    switch (variant) {
      case 'compact':
        return {
          container: 'p-3 min-h-[180px]',
          headerSpacing: 'mb-2',
          metricsSpacing: 'mb-3',
          infoSpacing: 'mb-2',
          servicesSpacing: 'mb-2',
          titleSize: 'text-sm font-semibold',
          showDetailedInfo: false,
          maxServices: 2
        };
      case 'detailed':
        return {
          container: 'p-6 min-h-[320px]',
          headerSpacing: 'mb-4',
          metricsSpacing: 'mb-6',
          infoSpacing: 'mb-4',
          servicesSpacing: 'mb-4',
          titleSize: 'text-lg font-bold',
          showDetailedInfo: true,
          maxServices: 4
        };
      default:
        return {
          container: 'p-4 min-h-[240px] sm:min-h-[260px]',
          headerSpacing: 'mb-3',
          metricsSpacing: 'mb-4',
          infoSpacing: 'mb-3',
          servicesSpacing: 'mb-2',
          titleSize: 'text-sm sm:text-base font-semibold',
          showDetailedInfo: false,
          maxServices: 2
        };
    }
  };

  const styles = getVariantStyles();

  // 카드 클릭 핸들러
  const handleCardClick = useCallback(() => {
    onClick(server);
  }, [onClick, server]);

  // 액션 핸들러
  const handleAction = useCallback((action: string, targetServer: Server) => {
    if (onAction) {
      onAction(action, targetServer);
    } else {
      // 기본 액션: 상세보기는 카드 클릭과 동일
      if (action === 'view') {
        onClick(targetServer);
      }
    }
  }, [onAction, onClick]);

  return (
    <div 
      className={`
        relative bg-white rounded-lg border border-gray-200 
        cursor-pointer transition-all duration-200 
        hover:shadow-lg hover:border-gray-300
        ${isHovered ? 'shadow-lg border-gray-300' : 'shadow-sm'}
        ${styles.container}
      `}
      onClick={handleCardClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role="button"
      tabIndex={0}
      aria-label={`서버 ${server.name} 카드`}
    >
      {/* 헤더: 서버 아이콘 + 이름 + 상태 */}
      <div className={`flex justify-between items-start ${styles.headerSpacing}`}>
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {/* 서버 아이콘 */}
          <ServerIcon 
            server={server} 
            size={variant === 'detailed' ? 'lg' : variant === 'compact' ? 'sm' : 'md'}
            showTooltip={variant !== 'compact'}
          />
          
          {/* 서버명 */}
          <h3 className={`${styles.titleSize} text-gray-900 truncate pr-2`}>
            {server.name}
          </h3>
        </div>

        {/* 상태 뱃지 */}
        <StatusBadge 
          server={server} 
          variant={variant}
          showText={variant !== 'compact'}
        />
      </div>

      {/* 메트릭 표시 */}
      <div className={styles.metricsSpacing}>
        <MetricsDisplay 
          server={server} 
          variant={variant}
          showLabels={variant !== 'compact'}
          showValues={true}
        />
      </div>

      {/* 추가 정보 (detailed 모드가 아닌 경우) */}
      {!styles.showDetailedInfo && (
        <div className={`space-y-1 ${styles.infoSpacing} text-xs text-gray-600`}>
          <div className="flex justify-between">
            <span>위치</span>
            <span className="font-medium text-gray-900 truncate ml-2">
              {server.location || 'Seoul DC1'}
            </span>
          </div>
          <div className="flex justify-between">
            <span>업타임</span>
            <span className="font-medium text-gray-900">{server.uptime}</span>
          </div>
          {variant !== 'compact' && (
            <>
              <div className="flex justify-between">
                <span>IP주소</span>
                <span className="font-medium text-gray-900 text-xs">
                  {server.ip || '192.168.1.100'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>응답속도</span>
                <span className="font-medium text-gray-900">
                  {(Math.random() * 200 + 50).toFixed(0)}ms
                </span>
              </div>
            </>
          )}
        </div>
      )}

      {/* 상세 정보 (detailed 모드에서만) */}
      {styles.showDetailedInfo && (
        <div className={`space-y-3 ${styles.infoSpacing}`}>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-gray-600 text-xs mb-1">시스템 정보</div>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-600">OS</span>
                  <span className="font-medium">{server.os || 'Ubuntu 20.04'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">IP</span>
                  <span className="font-medium">{server.ip || '192.168.1.100'}</span>
                </div>
              </div>
            </div>
            <div>
              <div className="text-gray-600 text-xs mb-1">성능 정보</div>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-600">업타임</span>
                  <span className="font-medium">{server.uptime}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">응답</span>
                  <span className="font-medium">{(Math.random() * 200 + 50).toFixed(0)}ms</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 서비스 태그 */}
      {server.services && server.services.length > 0 && (
        <div className={`flex flex-wrap gap-1 ${styles.servicesSpacing}`}>
          {server.services.slice(0, styles.maxServices).map((service, index) => (
            <span
              key={index}
              className={`px-1.5 py-0.5 rounded text-xs border ${getServiceTagColor(service.status)}`}
            >
              {service.name}
            </span>
          ))}
          {server.services.length > styles.maxServices && (
            <span className="px-1.5 py-0.5 rounded text-xs bg-gray-100 text-gray-600 border border-gray-300">
              +{server.services.length - styles.maxServices}
            </span>
          )}
        </div>
      )}

      {/* 액션 버튼들 (하단) */}
      {showActions && (
        <div className="mt-auto pt-2">
          <ActionButtons
            server={server}
            variant={variant}
            onAction={handleAction}
            showLabels={variant === 'detailed'}
          />
        </div>
      )}

      {/* 호버 효과 오버레이 */}
      {isHovered && (
        <div className="absolute inset-0 bg-blue-50 bg-opacity-10 rounded-lg pointer-events-none" />
      )}
    </div>
  );
});

ServerCard.displayName = 'ServerCard';

export default ServerCard; 