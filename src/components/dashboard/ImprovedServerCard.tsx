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

import {
  AlertCircle,
  CheckCircle2,
  Clock,
  MapPin,
  Server,
  Database,
  Globe,
  HardDrive,
  Archive,
  RefreshCw,
} from 'lucide-react';
import dynamic from 'next/dynamic';
import React, { memo, useCallback, useEffect, useState } from 'react';
import type { Server as ServerType } from '../../types/server';
import { ServerCardLineChart } from '../shared/ServerMetricsLineChart';
import { timeRotationService } from '@/services/time/TimeRotationService';

// framer-motion을 동적 import로 처리
const MotionButton = dynamic(
  () => import('framer-motion').then((mod) => ({ default: mod.motion.button })),
  { ssr: false }
);
const MotionDiv = dynamic(
  () => import('framer-motion').then((mod) => ({ default: mod.motion.div })),
  { ssr: false }
);
const AnimatePresence = dynamic(
  () =>
    import('framer-motion').then((mod) => ({ default: mod.AnimatePresence })),
  { ssr: false }
);

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

    // 🕐 시뮬레이션 시간 기반 업데이트 시간 계산
    const [simulatedLastUpdate, setSimulatedLastUpdate] = useState<string>('');
    const [simulatedExactTime, setSimulatedExactTime] = useState<string>('');
    
    useEffect(() => {
      const updateSimulatedTime = () => {
        if (timeRotationService.getState().isActive) {
          const lastUpdate = timeRotationService.getServerLastUpdate(server.type || 'unknown', index);
          const relativeTime = timeRotationService.getRelativeTime(lastUpdate);
          setSimulatedLastUpdate(relativeTime);
          
          // 정확한 시간도 저장 (툴팁용)
          const exactTime = lastUpdate.toLocaleTimeString('ko-KR', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          });
          setSimulatedExactTime(exactTime);
          
          // 디버깅: 첫 번째 서버만 로그 출력
          if (index === 0) {
            console.log('🕐 서버 업데이트 시간 동기화:', {
              서버명: server.name,
              타입: server.type,
              인덱스: index,
              시뮬레이션시간: timeRotationService.getFormattedTime().time,
              마지막업데이트: relativeTime,
              정확한시간: exactTime
            });
          }
        }
      };

      // 초기 업데이트
      updateSimulatedTime();

      // 1초마다 업데이트
      const interval = setInterval(updateSimulatedTime, 1000);

      // TimeRotation 상태 변경 구독
      const unsubscribe = timeRotationService.subscribe(() => {
        updateSimulatedTime();
      });

      return () => {
        clearInterval(interval);
        unsubscribe();
      };
    }, [server.type, index, server.name]);

    // 실시간 메트릭 업데이트 시뮬레이션 (안정화 버전)
    useEffect(() => {
      if (!showRealTimeUpdates) return;

      const interval = setInterval(
        () => {
          setRealtimeMetrics((prev) => ({
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
        30000 + index * 500 // 🎯 데이터 수집 간격 최적화 (30초 + 서버별 지연)
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
            cardBg: 'bg-gradient-to-br from-white to-green-50/30',
            border: 'border-green-300',
            hoverBorder: 'hover:border-green-400',
            statusColor: 'text-green-700 bg-green-100',
            statusIcon: <CheckCircle2 className="h-4 w-4" />,
            statusText: '정상',
            pulse: 'bg-green-500',
            accent: 'text-green-600',
          };
        case 'warning':
          return {
            cardBg: 'bg-gradient-to-br from-white to-yellow-50/30',
            border: 'border-yellow-300',
            hoverBorder: 'hover:border-yellow-400',
            statusColor: 'text-yellow-700 bg-yellow-100',
            statusIcon: <AlertCircle className="h-4 w-4" />,
            statusText: '경고',
            pulse: 'bg-yellow-500',
            accent: 'text-yellow-600',
          };
        case 'offline':
          return {
            cardBg: 'bg-gradient-to-br from-white to-red-50/30',
            border: 'border-red-300',
            hoverBorder: 'hover:border-red-400',
            statusColor: 'text-red-700 bg-red-100',
            statusIcon: <AlertCircle className="h-4 w-4" />,
            statusText: '심각',
            pulse: 'bg-red-500',
            accent: 'text-red-600',
          };
        default:
          // 기본값을 온라인 상태로 처리하여 회색 카드 문제 해결
          return {
            cardBg: 'bg-gradient-to-br from-white to-green-50/30',
            border: 'border-green-300',
            hoverBorder: 'hover:border-green-400',
            statusColor: 'text-green-700 bg-green-100',
            statusIcon: <CheckCircle2 className="h-4 w-4" />,
            statusText: '정상',
            pulse: 'bg-green-500',
            accent: 'text-green-600',
          };
      }
    };

    // 서버 타입별 아이콘 가져오기
    const getServerIcon = () => {
      switch (server.type) {
        case 'web':
          return <Globe className="h-5 w-5" />;
        case 'database':
          return <Database className="h-5 w-5" />;
        case 'storage':
          return <HardDrive className="h-5 w-5" />;
        case 'backup':
          return <Archive className="h-5 w-5" />;
        case 'app':
        default:
          return <Server className="h-5 w-5" />;
      }
    };

    // OS별 아이콘/이모지 가져오기
    const getOSIcon = () => {
      const os = server.os?.toLowerCase() || '';

      if (
        os.includes('ubuntu') ||
        os.includes('debian') ||
        os.includes('linux')
      ) {
        return (
          <span className="text-base" title={server.os}>
            🐧
          </span>
        );
      } else if (
        os.includes('centos') ||
        os.includes('red hat') ||
        os.includes('rhel')
      ) {
        return (
          <span className="text-base" title={server.os}>
            🎩
          </span>
        );
      } else if (os.includes('windows')) {
        return (
          <span className="text-base" title={server.os}>
            🪟
          </span>
        );
      }
      return null;
    };

    // 메트릭 색상 결정 (통합 컴포넌트로 이동됨)
    const _getMetricColor = (
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

    // 배리언트별 스타일 (라인 그래프에 최적화)
    const getVariantStyles = () => {
      switch (variant) {
        case 'compact':
          return {
            container: 'p-4 min-h-[300px]', // 라인 그래프에 최적화
            titleSize: 'text-sm font-semibold',
            metricSize: 'text-xs',
            progressHeight: 'h-2',
            spacing: 'space-y-4',
            showServices: true,
            maxServices: 2,
            showDetails: false,
          };
        case 'detailed':
          return {
            container: 'p-6 min-h-[380px]', // 라인 그래프에 최적화
            titleSize: 'text-lg font-bold',
            metricSize: 'text-sm',
            progressHeight: 'h-3',
            spacing: 'space-y-5',
            showServices: true,
            maxServices: 4,
            showDetails: true,
          };
        default: // standard
          return {
            container: 'p-5 min-h-[340px]', // 라인 그래프에 최적화
            titleSize: 'text-base font-semibold',
            metricSize: 'text-sm',
            progressHeight: 'h-2.5',
            spacing: 'space-y-4',
            showServices: true,
            maxServices: 3,
            showDetails: true,
          };
      }
    };

    const handleClick = useCallback(() => {
      onClick(server);
    }, [onClick, server]);

    return (
      <MotionButton
        type="button"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{
          delay: index * 0.1,
          type: 'spring',
          stiffness: 260,
          damping: 20,
        }}
        className={`relative cursor-pointer rounded-xl border-2 transition-all duration-300 ${getStatusTheme().cardBg} ${getStatusTheme().border} ${getStatusTheme().hoverBorder} ${getVariantStyles().container} group w-full overflow-hidden text-left hover:shadow-lg hover:shadow-black/5`}
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        aria-label={`${server.name} 서버 - ${getStatusTheme().statusText}`}
      >
        {/* 실시간 활동 인디케이터 */}
        {showRealTimeUpdates && (
          <div className="absolute right-3 top-3 z-10">
            <MotionDiv
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.6, 1, 0.6],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className={`h-2 w-2 ${getStatusTheme().pulse} rounded-full shadow-lg`}
            />
          </div>
        )}

        {/* 헤더 */}
        <div className="mb-4 flex items-start justify-between">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <MotionDiv
              className={`rounded-lg p-2.5 ${getStatusTheme().statusColor} shadow-sm`}
              whileHover={{ rotate: 5, scale: 1.1 }}
              transition={{ duration: 0.2 }}
            >
              {getServerIcon()}
            </MotionDiv>
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex items-center gap-2">
                <h3
                  className={`${getVariantStyles().titleSize} truncate text-gray-900`}
                >
                  {server.name}
                </h3>
                {getOSIcon()}
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <MapPin className="h-3 w-3" />
                <span>{server.location || 'Seoul DC1'}</span>
                {getVariantStyles().showDetails && (
                  <>
                    <span>•</span>
                    <Clock className="h-3 w-3" />
                    <span>{server.uptime}</span>
                  </>
                )}
                {/* 🕐 시뮬레이션 시간 기반 마지막 업데이트 표시 */}
                {timeRotationService.getState().isActive && simulatedLastUpdate && (
                  <>
                    <span>•</span>
                    <RefreshCw className="h-3 w-3 animate-pulse text-blue-500" />
                    <span 
                      className="text-blue-600 font-medium cursor-help"
                      title={`정확한 시간: ${simulatedExactTime}`}
                    >
                      {simulatedLastUpdate}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          <MotionDiv
            className={`flex items-center gap-2 rounded-full px-3 py-1.5 ${getStatusTheme().statusColor} shadow-sm`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {getStatusTheme().statusIcon}
            <span className="text-xs font-semibold">
              {getStatusTheme().statusText}
            </span>
          </MotionDiv>
        </div>

        {/* 메트릭 섹션 - 라인 그래프로 최근 5분간 데이터 표시 */}
        <div className={`grid grid-cols-2 gap-4 ${getVariantStyles().spacing}`}>
          <ServerCardLineChart
            label="CPU"
            value={realtimeMetrics.cpu}
            type="cpu"
            showRealTimeUpdates={showRealTimeUpdates}
          />
          <ServerCardLineChart
            label="메모리"
            value={realtimeMetrics.memory}
            type="memory"
            showRealTimeUpdates={showRealTimeUpdates}
          />
          <ServerCardLineChart
            label="디스크"
            value={realtimeMetrics.disk}
            type="disk"
            showRealTimeUpdates={showRealTimeUpdates}
          />
          <ServerCardLineChart
            label="네트워크"
            value={Math.min(100, Math.max(0, realtimeMetrics.network))}
            type="network"
            showRealTimeUpdates={showRealTimeUpdates}
          />
        </div>

        {/* 서비스 상태 */}
        {getVariantStyles().showServices &&
          server.services &&
          server.services.length > 0 && (
            <div className="mt-4">
              <div className="flex flex-wrap gap-2">
                {server.services
                  .slice(0, getVariantStyles().maxServices)
                  .map((service, idx) => (
                    <MotionDiv
                      key={idx}
                      className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium shadow-sm transition-colors ${
                        service.status === 'running'
                          ? 'border-green-300 bg-green-50 text-green-700'
                          : service.status === 'stopped'
                            ? 'border-red-300 bg-red-50 text-red-700'
                            : 'border-yellow-300 bg-yellow-50 text-yellow-700'
                      }`}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <div
                        className={`h-1.5 w-1.5 rounded-full ${
                          service.status === 'running'
                            ? 'bg-green-500'
                            : service.status === 'stopped'
                              ? 'bg-red-500'
                              : 'bg-yellow-500'
                        }`}
                      />
                      <span>{service.name}</span>
                    </MotionDiv>
                  ))}
                {server.services.length > getVariantStyles().maxServices && (
                  <div className="flex items-center rounded-lg bg-gray-100 px-2.5 py-1 text-xs text-gray-500">
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
            <MotionDiv
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="pointer-events-none absolute inset-0 rounded-xl bg-gradient-to-br from-blue-500/5 to-purple-500/5"
            />
          )}
        </AnimatePresence>

        {/* 클릭 효과 */}
        <MotionDiv
          className="absolute inset-0 rounded-xl bg-blue-500/10 opacity-0"
          whileTap={{ opacity: 1 }}
          transition={{ duration: 0.1 }}
        />
      </MotionButton>
    );
  }
);

ImprovedServerCard.displayName = 'ImprovedServerCard';

export default ImprovedServerCard;
