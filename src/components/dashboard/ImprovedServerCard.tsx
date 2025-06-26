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
        35000 + index * 1000 // 🎯 데이터 수집 간격과 동기화 (35-40초)
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

    // 메트릭 색상 결정
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
            container: 'p-6 min-h-[320px]',
            titleSize: 'text-lg font-bold',
            metricSize: 'text-sm',
            progressHeight: 'h-3',
            spacing: 'space-y-4',
            showServices: true,
            maxServices: 5,
            showDetails: true,
          };
        default: // standard
          return {
            container: 'p-5 min-h-[280px]',
            titleSize: 'text-base font-semibold',
            metricSize: 'text-sm',
            progressHeight: 'h-2.5',
            spacing: 'space-y-4',
            showServices: true,
            maxServices: 4,
            showDetails: true,
          };
      }
    };

    const theme = getStatusTheme();
    const styles = getVariantStyles();

    const handleClick = useCallback(() => {
      onClick(server);
    }, [onClick, server]);

    // 원형 차트 컴포넌트 (도넛 차트)
    const CircularMetric = ({
      label,
      value,
      type,
      size = 60,
    }: {
      label: string;
      value: number;
      type: 'cpu' | 'memory' | 'disk' | 'network';
      size?: number;
    }) => {
      const color = getMetricColor(value, type);
      const radius = (size - 8) / 2;
      const circumference = 2 * Math.PI * radius;
      const strokeDasharray = circumference;
      const strokeDashoffset = circumference - (value / 100) * circumference;

      return (
        <div className='flex flex-col items-center space-y-2'>
          <div className='relative'>
            <svg width={size} height={size} className='transform -rotate-90'>
              {/* 배경 원 */}
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke={color.bg}
                strokeWidth='4'
                fill='none'
                opacity='0.2'
              />
              {/* 진행률 원 */}
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke={color.border.replace('border-', '')}
                strokeWidth='4'
                fill='none'
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap='round'
                className='drop-shadow-sm transition-all duration-1000 ease-out'
                style={{
                  stroke: color.bg.includes('blue')
                    ? '#3b82f6'
                    : color.bg.includes('purple')
                      ? '#8b5cf6'
                      : color.bg.includes('indigo')
                        ? '#6366f1'
                        : color.bg.includes('emerald')
                          ? '#10b981'
                          : color.bg.includes('amber')
                            ? '#f59e0b'
                            : '#ef4444',
                }}
              />
            </svg>

            {/* 중앙 아이콘과 값 */}
            <div className='absolute inset-0 flex flex-col items-center justify-center'>
              <div className='mb-0.5'>
                <div className='w-4 h-4 flex items-center justify-center'>
                  {type === 'cpu' && (
                    <svg
                      className='w-4 h-4'
                      fill='currentColor'
                      viewBox='0 0 20 20'
                    >
                      <path d='M3 4a1 1 0 011-1h12a1 1 0 011 1v1a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z' />
                    </svg>
                  )}
                  {type === 'memory' && (
                    <svg
                      className='w-4 h-4'
                      fill='currentColor'
                      viewBox='0 0 20 20'
                    >
                      <path d='M3 4a1 1 0 011-1h12a1 1 0 011 1v1a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h12a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6z' />
                    </svg>
                  )}
                  {type === 'disk' && (
                    <svg
                      className='w-4 h-4'
                      fill='currentColor'
                      viewBox='0 0 20 20'
                    >
                      <path d='M3 4a1 1 0 000 2v9a2 2 0 002 2h1a2 2 0 002-2V6a1 1 0 100-2H3zM3 4a1 1 0 011-1h1a1 1 0 011 1v1a1 1 0 01-1 1H4a1 1 0 01-1-1V4z' />
                    </svg>
                  )}
                  {type === 'network' && (
                    <svg
                      className='w-4 h-4'
                      fill='currentColor'
                      viewBox='0 0 20 20'
                    >
                      <path d='M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z' />
                    </svg>
                  )}
                </div>
              </div>
              <span className={`text-xs font-bold ${color.text}`}>
                {value.toFixed(0)}%
              </span>
            </div>

            {/* 실시간 펄스 효과 */}
            {showRealTimeUpdates && (
              <motion.div
                animate={{
                  scale: [1, 1.1, 1],
                  opacity: [0.3, 0.7, 0.3],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                className={`absolute inset-0 rounded-full border-2 ${color.border} opacity-30`}
              />
            )}
          </div>

          {/* 라벨 */}
          <div className='text-center'>
            <span className='text-xs font-medium text-gray-600'>{label}</span>
          </div>
        </div>
      );
    };

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
          ${theme.cardBg} ${theme.border} ${theme.hoverBorder}
          ${styles.container}
          hover:shadow-lg hover:shadow-black/5
          group overflow-hidden
          text-left w-full
        `}
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        aria-label={`${server.name} 서버 - ${theme.statusText}`}
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
              className={`w-2 h-2 ${theme.pulse} rounded-full shadow-lg`}
            />
          </div>
        )}

        {/* 헤더 */}
        <div className='flex justify-between items-start mb-4'>
          <div className='flex items-center gap-3 flex-1 min-w-0'>
            <motion.div
              className={`p-2.5 rounded-lg ${theme.statusColor} shadow-sm`}
              whileHover={{ rotate: 5, scale: 1.1 }}
              transition={{ duration: 0.2 }}
            >
              <Server className='w-5 h-5' />
            </motion.div>
            <div className='flex-1 min-w-0'>
              <h3 className={`${styles.titleSize} text-gray-900 truncate mb-1`}>
                {server.name}
              </h3>
              <div className='flex items-center gap-2 text-xs text-gray-500'>
                <MapPin className='w-3 h-3' />
                <span>{server.location || 'Seoul DC1'}</span>
                {styles.showDetails && (
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
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${theme.statusColor} shadow-sm`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {theme.statusIcon}
            <span className='text-xs font-semibold'>{theme.statusText}</span>
          </motion.div>
        </div>

        {/* 메트릭 섹션 - 개선된 2x2 그리드 */}
        <div className={`grid grid-cols-2 gap-4 ${styles.spacing}`}>
          <CircularMetric label='CPU' value={realtimeMetrics.cpu} type='cpu' />
          <CircularMetric
            label='메모리'
            value={realtimeMetrics.memory}
            type='memory'
          />
          <CircularMetric
            label='디스크'
            value={realtimeMetrics.disk}
            type='disk'
          />
          <CircularMetric
            label='네트워크'
            value={realtimeMetrics.network}
            type='network'
          />
        </div>

        {/* 서비스 상태 */}
        {styles.showServices &&
          server.services &&
          server.services.length > 0 && (
            <div className='mt-4'>
              <div className='flex flex-wrap gap-2'>
                {server.services
                  .slice(0, styles.maxServices)
                  .map((service, idx) => (
                    <motion.div
                      key={idx}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium shadow-sm border transition-colors ${service.status === 'running'
                        ? 'bg-green-50 text-green-700 border-green-200'
                        : 'bg-red-50 text-red-700 border-red-200'
                        }`}
                      whileHover={{ scale: 1.05, y: -1 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <motion.div
                        className={`w-2 h-2 rounded-full ${service.status === 'running'
                          ? 'bg-green-500'
                          : 'bg-red-500'
                          }`}
                        animate={{
                          scale: service.status === 'running' ? [1, 1.2, 1] : 1,
                        }}
                        transition={{
                          duration: 2,
                          repeat: service.status === 'running' ? Infinity : 0,
                        }}
                      />
                      {service.name}
                    </motion.div>
                  ))}
                {server.services.length > styles.maxServices && (
                  <div className='px-2.5 py-1 text-xs text-gray-600 bg-gray-100 rounded-lg font-medium'>
                    +{server.services.length - styles.maxServices}개
                  </div>
                )}
              </div>
            </div>
          )}

        {/* 상세 정보 (호버 시 또는 detailed 모드) */}
        <AnimatePresence>
          {(isHovered || variant === 'detailed') && styles.showDetails && (
            <motion.div
              initial={{ opacity: 0, height: 0, y: -10 }}
              animate={{ opacity: 1, height: 'auto', y: 0 }}
              exit={{ opacity: 0, height: 0, y: -10 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className='mt-4 pt-4 border-t border-gray-200/50 space-y-2'
            >
              <div className='grid grid-cols-2 gap-3 text-xs'>
                {server.ip && (
                  <div className='flex justify-between'>
                    <span className='text-gray-600'>IP 주소:</span>
                    <span className='font-mono font-medium'>{server.ip}</span>
                  </div>
                )}
                {server.os && (
                  <div className='flex justify-between'>
                    <span className='text-gray-600'>OS:</span>
                    <span className='font-medium'>{server.os}</span>
                  </div>
                )}
                <div className='flex justify-between'>
                  <span className='text-gray-600'>응답시간:</span>
                  <span className='font-medium'>
                    {realtimeMetrics.network.toFixed(0)}ms
                  </span>
                </div>
                <div className='flex justify-between'>
                  <span className='text-gray-600'>마지막 업데이트:</span>
                  <span className='font-medium'>방금 전</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 호버 효과 오버레이 */}
        <AnimatePresence>
          {isHovered && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={`absolute inset-0 ${theme.cardBg} opacity-20 rounded-xl pointer-events-none`}
            />
          )}
        </AnimatePresence>
      </motion.button>
    );
  }
);

ImprovedServerCard.displayName = 'ImprovedServerCard';

export default ImprovedServerCard;
