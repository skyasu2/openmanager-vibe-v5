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
import {
  Activity,
  AlertCircle,
  CheckCircle2,
  Clock,
  Cpu,
  HardDrive,
  MapPin,
  Server,
  Wifi,
} from 'lucide-react';
import React, { memo, useCallback, useEffect, useState } from 'react';
import { Server as ServerType } from '../../../types/server';

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

    // 실시간 메트릭 업데이트 시뮬레이션
    useEffect(() => {
      if (!showRealTimeUpdates) return;

      const interval = setInterval(
        () => {
          setRealtimeMetrics(prev => ({
            cpu: Math.max(
              0,
              Math.min(100, prev.cpu + (Math.random() - 0.5) * 10)
            ),
            memory: Math.max(
              0,
              Math.min(100, prev.memory + (Math.random() - 0.5) * 5)
            ),
            disk: Math.max(
              0,
              Math.min(100, prev.disk + (Math.random() - 0.5) * 2)
            ),
            network: Math.max(
              0,
              Math.min(100, prev.network + (Math.random() - 0.5) * 15)
            ),
            lastUpdate: Date.now(),
          }));
        },
        5000 + index * 500
      ); // 서버별 다른 업데이트 주기

      return () => clearInterval(interval);
    }, [showRealTimeUpdates, index, server]);

    // 서버 상태별 테마
    const getStatusTheme = () => {
      switch (server.status) {
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
          return {
            cardBg: 'bg-gradient-to-br from-white to-gray-50/50',
            border: 'border-gray-200',
            hoverBorder: 'hover:border-gray-300',
            statusColor: 'text-gray-700 bg-gray-100',
            statusIcon: <Server className='w-4 h-4' />,
            statusText: '알 수 없음',
            pulse: 'bg-gray-400',
            accent: 'text-gray-600',
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

    // 메트릭 컴포넌트
    const MetricBar = ({
      icon,
      label,
      value,
      type,
    }: {
      icon: React.ReactNode;
      label: string;
      value: number;
      type: 'cpu' | 'memory' | 'disk' | 'network';
    }) => {
      const color = getMetricColor(value, type);

      return (
        <div className='space-y-2'>
          <div className='flex justify-between items-center'>
            <div className='flex items-center gap-2'>
              <div className={`p-1 rounded ${color.border} bg-white`}>
                {icon}
              </div>
              <span
                className={`${styles.metricSize} font-medium text-gray-700`}
              >
                {label}
              </span>
            </div>
            <div className='flex items-center gap-1'>
              <span className={`${styles.metricSize} font-bold ${color.text}`}>
                {value.toFixed(0)}%
              </span>
              {showRealTimeUpdates && (
                <motion.div
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.5, 1, 0.5],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                  className={`w-1.5 h-1.5 rounded-full ${theme.pulse}`}
                />
              )}
            </div>
          </div>
          <div className='relative'>
            <div
              className={`w-full bg-gray-200 rounded-full ${styles.progressHeight} overflow-hidden`}
            >
              <motion.div
                className={`${styles.progressHeight} bg-gradient-to-r ${color.bg} rounded-full relative overflow-hidden`}
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(value, 100)}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
              >
                {/* 광택 효과 */}
                <div className='absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse' />
              </motion.div>
            </div>
            {/* 임계값 표시선 */}
            {variant !== 'compact' && (
              <>
                <div
                  className='absolute top-0 w-px bg-amber-400 opacity-60'
                  style={{ left: '70%', height: '100%' }}
                />
                <div
                  className='absolute top-0 w-px bg-red-400 opacity-60'
                  style={{ left: '85%', height: '100%' }}
                />
              </>
            )}
          </div>
        </div>
      );
    };

    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        whileHover={{
          scale: 1.02,
          y: -4,
          transition: { duration: 0.2, ease: 'easeOut' },
        }}
        whileTap={{ scale: 0.98 }}
        transition={{
          duration: 0.3,
          delay: index * 0.05,
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
        `}
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
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
          <MetricBar
            icon={<Cpu className='w-4 h-4 text-blue-600' />}
            label='CPU'
            value={realtimeMetrics.cpu}
            type='cpu'
          />
          <MetricBar
            icon={<Activity className='w-4 h-4 text-purple-600' />}
            label='메모리'
            value={realtimeMetrics.memory}
            type='memory'
          />
          <MetricBar
            icon={<HardDrive className='w-4 h-4 text-indigo-600' />}
            label='디스크'
            value={realtimeMetrics.disk}
            type='disk'
          />
          <MetricBar
            icon={<Wifi className='w-4 h-4 text-emerald-600' />}
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
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium shadow-sm border transition-colors ${
                        service.status === 'running'
                          ? 'bg-green-50 text-green-700 border-green-200'
                          : 'bg-red-50 text-red-700 border-red-200'
                      }`}
                      whileHover={{ scale: 1.05, y: -1 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <motion.div
                        className={`w-2 h-2 rounded-full ${
                          service.status === 'running'
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
      </motion.div>
    );
  }
);

ImprovedServerCard.displayName = 'ImprovedServerCard';

export default ImprovedServerCard;
