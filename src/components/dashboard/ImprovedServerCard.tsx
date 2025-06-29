/**
 * 🌟 Improved Server Card v3.0 - UX/UI 완전 개선판
 *
 * 기존 문제점 해결:
 * - ✅ 가독성 대폭 향상 (메트릭 크기 증가, 색상 개선)
 * - ✅ 정보 밀도 최적화 (중요 정보 우선 표시)
 * - ✅ 인터랙션 강화 (실시간 피드백, 애니메이션)
 * - ✅ 접근성 개선 (명확한 상태 표시, 키보드 내비게이션)
 * - ✅ 반응형 디자인 완전 지원
 */

import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, CheckCircle2, Clock, MapPin, Server } from 'lucide-react';
import React, { memo, useCallback, useEffect, useState } from 'react';
import { Server as ServerType } from '../../types/server';
import UnifiedCircularGauge from '../shared/UnifiedCircularGauge';

interface ImprovedServerCardProps {
  server: ServerType;
  onClick: (server: ServerType) => void;
  variant?: 'compact' | 'standard' | 'detailed';
  showRealTimeUpdates?: boolean;
  index?: number;
}

const ImprovedServerCard: React.FC<ImprovedServerCardProps> = memo(
  ({
    server,
    onClick,
    variant = 'standard',
    showRealTimeUpdates = true,
    index = 0,
  }) => {
    const [isHovered, setIsHovered] = useState(false);
    const [realtimeMetrics, setRealtimeMetrics] = useState({
      cpu: server.cpu,
      memory: server.memory,
      disk: server.disk,
      network: server.network || 25,
      lastUpdate: Date.now(),
    });

    // 실시간 메트릭 업데이트 시뮬레이션 (안정화 버전)
    useEffect(() => {
      if (!showRealTimeUpdates) return;

      const interval = setInterval(
        () => {
          setRealtimeMetrics(prev => ({
            // 더 안정적인 변화량으로 조정 (기존 10 → 3)
            cpu: Math.max(
              0,
              Math.min(100, prev.cpu + (Math.random() - 0.5) * 3)
            ),
            // 메모리는 더 천천히 변화 (기존 5 → 2)
            memory: Math.max(
              0,
              Math.min(100, prev.memory + (Math.random() - 0.5) * 2)
            ),
            // 디스크는 거의 변화 없음 (기존 2 → 0.5)
            disk: Math.max(
              0,
              Math.min(100, prev.disk + (Math.random() - 0.5) * 0.5)
            ),
            // 네트워크는 중간 정도 변화 (기존 15 → 5)
            network: Math.max(
              0,
              Math.min(100, prev.network + (Math.random() - 0.5) * 5)
            ),
            lastUpdate: Date.now(),
          }));
        },
        20000 + index * 500 // 🎯 데이터 수집 간격 (20초 + 서버별 지연) - RealServerDataGenerator 동기화
      );

      return () => clearInterval(interval);
    }, [showRealTimeUpdates, index, server]);

    // 서버 상태별 테마 (상태 매핑 포함)
    const getStatusTheme = () => {
      // 서버 상태를 표준 상태로 매핑 (Server 타입: 'online' | 'offline' | 'warning' | 'healthy' | 'critical')
      const normalizedStatus =
        server.status === 'healthy'
          ? 'online'
          : server.status === 'critical'
            ? 'offline'
            : server.status;

      switch (normalizedStatus) {
        case 'online':
          return {
            cardBg: 'bg-gradient-to-br from-white to-green-50/50',
            border: 'border-green-200',
            hoverBorder: 'hover:border-green-300',
            statusColor: 'text-green-700 bg-green-100',
            statusIcon: <CheckCircle2 className='w-4 h-4' />,
            statusText: '정상',
            pulse: 'bg-green-400',
            accent: 'text-green-600',
          };
        case 'warning':
          return {
            cardBg: 'bg-gradient-to-br from-white to-amber-50/50',
            border: 'border-amber-200',
            hoverBorder: 'hover:border-amber-300',
            statusColor: 'text-amber-700 bg-amber-100',
            statusIcon: <AlertCircle className='w-4 h-4' />,
            statusText: '경고',
            pulse: 'bg-amber-400',
            accent: 'text-amber-600',
          };
        case 'offline':
          return {
            cardBg: 'bg-gradient-to-br from-white to-red-50/50',
            border: 'border-red-200',
            hoverBorder: 'hover:border-red-300',
            statusColor: 'text-red-700 bg-red-100',
            statusIcon: <AlertCircle className='w-4 h-4' />,
            statusText: '오프라인',
            pulse: 'bg-red-400',
            accent: 'text-red-600',
          };
        default:
          // 기본값을 온라인 상태로 처리하여 회색 카드 문제 해결
          return {
            cardBg: 'bg-gradient-to-br from-white to-green-50/50',
            border: 'border-green-200',
            hoverBorder: 'hover:border-green-300',
            statusColor: 'text-green-700 bg-green-100',
            statusIcon: <CheckCircle2 className='w-4 h-4' />,
            statusText: '정상',
            pulse: 'bg-green-400',
            accent: 'text-green-600',
          };
      }
    };

    // 메트릭 색상 결정 (통합 컴포넌트로 이동됨)
    const getMetricColor = (
      value: number,
      type: 'cpu' | 'memory' | 'disk' | 'network'
    ) => {
      const thresholds = {
        cpu: { warning: 70, critical: 85 },
        memory: { warning: 80, critical: 90 },
        disk: { warning: 80, critical: 95 },
        network: { warning: 60, critical: 80 },
      };

      const threshold = thresholds[type];
      if (value >= threshold.critical) {
        return {
          bg: 'from-red-500 to-red-600',
          text: 'text-red-700',
          border: 'border-red-300',
        };
      } else if (value >= threshold.warning) {
        return {
          bg: 'from-amber-500 to-amber-600',
          text: 'text-amber-700',
          border: 'border-amber-300',
        };
      } else {
        const colors = {
          cpu: {
            bg: 'from-blue-500 to-blue-600',
            text: 'text-blue-700',
            border: 'border-blue-300',
          },
          memory: {
            bg: 'from-purple-500 to-purple-600',
            text: 'text-purple-700',
            border: 'border-purple-300',
          },
          disk: {
            bg: 'from-indigo-500 to-indigo-600',
            text: 'text-indigo-700',
            border: 'border-indigo-300',
          },
          network: {
            bg: 'from-emerald-500 to-emerald-600',
            text: 'text-emerald-700',
            border: 'border-emerald-300',
          },
        };
        return colors[type];
      }
    };

    // 배리언트별 스타일
    const getVariantStyles = () => {
      switch (variant) {
        case 'compact':
          return {
            container: 'p-4 min-h-[200px]', // 기존 180px → 200px로 증가
            titleSize: 'text-sm font-semibold',
            metricSize: 'text-xs',
            progressHeight: 'h-2', // 기존 h-1 → h-2로 증가
            spacing: 'space-y-3',
            showServices: true,
            maxServices: 3, // 기존 2개 → 3개로 증가
            showDetails: false,
          };
        case 'detailed':
          return {
            container: 'p-6 min-h-[280px]', // 기존 250px → 280px로 증가
            titleSize: 'text-lg font-bold',
            metricSize: 'text-sm',
            progressHeight: 'h-3', // 기존 h-2 → h-3로 증가
            spacing: 'space-y-4',
            showServices: true,
            maxServices: 5, // 기존 4개 → 5개로 증가
            showDetails: true,
          };
        default: // standard
          return {
            container: 'p-5 min-h-[240px]', // 기존 220px → 240px로 증가
            titleSize: 'text-base font-semibold',
            metricSize: 'text-sm',
            progressHeight: 'h-2.5', // 기존 h-1.5 → h-2.5로 증가
            spacing: 'space-y-3',
            showServices: true,
            maxServices: 4, // 기존 3개 → 4개로 증가
            showDetails: true,
          };
      }
    };

    const handleClick = useCallback(() => {
      onClick(server);
    }, [onClick, server]);

    return (
      <motion.button
        type='button'
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{
          delay: index * 0.1,
          type: 'spring',
          stiffness: 260,
          damping: 20,
        }}
        className={`
          relative cursor-pointer rounded-xl border-2 transition-all duration-300
          ${getStatusTheme().cardBg} ${getStatusTheme().border} ${getStatusTheme().hoverBorder}
          ${getVariantStyles().container}
          hover:shadow-lg hover:shadow-black/5
          group overflow-hidden
          text-left w-full
        `}
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        aria-label={`${server.name} 서버 - ${getStatusTheme().statusText}`}
      >
        {/* 실시간 활동 인디케이터 */}
        {showRealTimeUpdates && (
          <div className='absolute top-3 right-3 z-10'>
            <motion.div
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.6, 1, 0.6],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className={`w-2 h-2 ${getStatusTheme().pulse} rounded-full shadow-lg`}
            />
          </div>
        )}

        {/* 헤더 */}
        <div className='flex justify-between items-start mb-4'>
          <div className='flex items-center gap-3 flex-1 min-w-0'>
            <motion.div
              className={`p-2.5 rounded-lg ${getStatusTheme().statusColor} shadow-sm`}
              whileHover={{ rotate: 5, scale: 1.1 }}
              transition={{ duration: 0.2 }}
            >
              <Server className='w-5 h-5' />
            </motion.div>
            <div className='flex-1 min-w-0'>
              <h3
                className={`${getVariantStyles().titleSize} text-gray-900 truncate mb-1`}
              >
                {server.name}
              </h3>
              <div className='flex items-center gap-2 text-xs text-gray-500'>
                <MapPin className='w-3 h-3' />
                <span>{server.location || 'Seoul DC1'}</span>
                {getVariantStyles().showDetails && (
                  <>
                    <span>•</span>
                    <Clock className='w-3 h-3' />
                    <span>{server.uptime}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <motion.div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${getStatusTheme().statusColor} shadow-sm`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {getStatusTheme().statusIcon}
            <span className='text-xs font-semibold'>
              {getStatusTheme().statusText}
            </span>
          </motion.div>
        </div>

        {/* 메트릭 섹션 */}
        <div className={`grid grid-cols-2 gap-4 ${getVariantStyles().spacing}`}>
          <UnifiedCircularGauge
            label='CPU'
            value={realtimeMetrics.cpu}
            type='cpu'
            size={variant === 'compact' ? 50 : 60}
            variant='card'
            showRealTimeUpdates={showRealTimeUpdates}
          />
          <UnifiedCircularGauge
            label='메모리'
            value={realtimeMetrics.memory}
            type='memory'
            size={variant === 'compact' ? 50 : 60}
            variant='card'
            showRealTimeUpdates={showRealTimeUpdates}
          />
          <UnifiedCircularGauge
            label='디스크'
            value={realtimeMetrics.disk}
            type='disk'
            size={variant === 'compact' ? 50 : 60}
            variant='card'
            showRealTimeUpdates={showRealTimeUpdates}
          />
          <UnifiedCircularGauge
            label='네트워크'
            value={realtimeMetrics.network}
            type='network'
            size={variant === 'compact' ? 50 : 60}
            variant='card'
            showRealTimeUpdates={showRealTimeUpdates}
          />
        </div>

        {/* 서비스 상태 */}
        {getVariantStyles().showServices &&
          server.services &&
          server.services.length > 0 && (
            <div className='mt-4'>
              <div className='flex flex-wrap gap-2'>
                {server.services
                  .slice(0, getVariantStyles().maxServices)
                  .map((service, idx) => (
                    <motion.div
                      key={idx}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium shadow-sm border transition-colors ${
                        service.status === 'running'
                          ? 'bg-green-50 text-green-700 border-green-200'
                          : service.status === 'stopped'
                            ? 'bg-red-50 text-red-700 border-red-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <div
                        className={`w-1.5 h-1.5 rounded-full ${
                          service.status === 'running'
                            ? 'bg-green-500'
                            : service.status === 'stopped'
                              ? 'bg-red-500'
                              : 'bg-amber-500'
                        }`}
                      />
                      <span>{service.name}</span>
                    </motion.div>
                  ))}
                {server.services.length > getVariantStyles().maxServices && (
                  <div className='flex items-center px-2.5 py-1 text-xs text-gray-500 bg-gray-100 rounded-lg'>
                    +{server.services.length - getVariantStyles().maxServices}{' '}
                    more
                  </div>
                )}
              </div>
            </div>
          )}

        {/* 호버 효과 */}
        <AnimatePresence>
          {isHovered && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className='absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 rounded-xl pointer-events-none'
            />
          )}
        </AnimatePresence>

        {/* 클릭 효과 */}
        <motion.div
          className='absolute inset-0 bg-blue-500/10 rounded-xl opacity-0'
          whileTap={{ opacity: 1 }}
          transition={{ duration: 0.1 }}
        />
      </motion.button>
    );
  }
);

ImprovedServerCard.displayName = 'ImprovedServerCard';

export default ImprovedServerCard;
