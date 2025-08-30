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
} from 'lucide-react';
import dynamic from 'next/dynamic';
import { memo, useCallback, useEffect, useState, useMemo, type FC, Fragment } from 'react';
import type { Server as ServerType } from '../../types/server';
import { ServerCardLineChart } from '../shared/ServerMetricsLineChart';

// framer-motion을 동적 import로 처리
// framer-motion 제거됨
// framer-motion 제거됨

interface ImprovedServerCardProps {
  server: ServerType;
  onClick: (server: ServerType) => void;
  variant?: 'compact' | 'standard' | 'detailed';
  showRealTimeUpdates?: boolean;
  index?: number;
}

const ImprovedServerCard: FC<ImprovedServerCardProps> = memo(
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
        45000 + index * 1000 // 🎯 데이터 수집 간격 최적화 (45초 + 서버별 지연)
      );

      return () => clearInterval(interval);
    }, [showRealTimeUpdates, index, server]); // server 객체 의존성 복구

    // 🎨 현대적 Glassmorphism + Material You 기반 서버 상태별 테마 (메모이제이션 최적화)
    const getStatusTheme = useMemo(() => {
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
            // 🌟 Glassmorphism 효과 - 성공 상태 (Material You Green)
            cardBg: 'bg-gradient-to-br from-white/80 via-green-50/60 to-emerald-50/40 backdrop-blur-sm',
            border: 'border-emerald-200/60',
            hoverBorder: 'hover:border-emerald-300/80',
            glowEffect: 'hover:shadow-emerald-500/20',
            statusColor: 'text-emerald-800 bg-emerald-100/80 backdrop-blur-sm',
            statusIcon: <CheckCircle2 className="h-4 w-4" />,
            statusText: '정상',
            pulse: 'bg-emerald-500',
            accent: 'text-emerald-600',
          };
        case 'warning':
          return {
            // ⚠️ Glassmorphism 효과 - 경고 상태 (Material You Amber)
            cardBg: 'bg-gradient-to-br from-white/80 via-amber-50/60 to-orange-50/40 backdrop-blur-sm',
            border: 'border-amber-200/60',
            hoverBorder: 'hover:border-amber-300/80',
            glowEffect: 'hover:shadow-amber-500/20',
            statusColor: 'text-amber-800 bg-amber-100/80 backdrop-blur-sm',
            statusIcon: <AlertCircle className="h-4 w-4" />,
            statusText: '경고',
            pulse: 'bg-amber-500',
            accent: 'text-amber-600',
          };
        case 'offline':
          return {
            // 🚨 Glassmorphism 효과 - 심각 상태 (Material You Red)
            cardBg: 'bg-gradient-to-br from-white/80 via-red-50/60 to-rose-50/40 backdrop-blur-sm',
            border: 'border-red-200/60',
            hoverBorder: 'hover:border-red-300/80',
            glowEffect: 'hover:shadow-red-500/20',
            statusColor: 'text-red-800 bg-red-100/80 backdrop-blur-sm',
            statusIcon: <AlertCircle className="h-4 w-4" />,
            statusText: '심각',
            pulse: 'bg-red-500',
            accent: 'text-red-600',
          };
        default:
          // 🔵 기본값 - 온라인 상태 (Material You Blue)
          return {
            cardBg: 'bg-gradient-to-br from-white/80 via-blue-50/60 to-cyan-50/40 backdrop-blur-sm',
            border: 'border-blue-200/60',
            hoverBorder: 'hover:border-blue-300/80',
            glowEffect: 'hover:shadow-blue-500/20',
            statusColor: 'text-blue-800 bg-blue-100/80 backdrop-blur-sm',
            statusIcon: <CheckCircle2 className="h-4 w-4" />,
            statusText: '정상',
            pulse: 'bg-blue-500',
            accent: 'text-blue-600',
          };
      }
    }, [server.status]); // 🚀 상태 달라질 때만 재계산

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

    // 배리언트별 스타일 (라인 그래프에 최적화) - 메모이제이션 최적화
    const getVariantStyles = useMemo(() => {
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
    }, [variant]); // 🚀 변형이 달라질 때만 재계산

    // 🚀 클릭 핸들러 메모이제이션 (성능 최적화)
    const handleClick = useCallback(() => {
      onClick(server);
    }, [server.id, server.name, onClick]); // onClick 함수 의존성 복구

    return (
      <button
        type="button"
        className={`
          relative cursor-pointer rounded-2xl border-2 w-full overflow-hidden text-left group
          transition-all duration-300 ease-out
          ${getStatusTheme.cardBg} 
          ${getStatusTheme.border} 
          ${getStatusTheme.hoverBorder}
          ${getVariantStyles.container}
          hover:shadow-2xl hover:shadow-black/10 ${getStatusTheme.glowEffect}
          hover:-translate-y-1 hover:scale-[1.02]
          active:scale-[0.98] active:translate-y-0
          focus:outline-none focus:ring-4 focus:ring-blue-500/20
        `}
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        aria-label={`${server.name} 서버 - ${getStatusTheme.statusText}`}
      >
        {/* 실시간 활동 인디케이터 */}
        {showRealTimeUpdates && (
          <div className="absolute right-3 top-3 z-10">
            <div
              className={`h-2 w-2 ${getStatusTheme.pulse} rounded-full shadow-lg`}
            />
          </div>
        )}

        {/* 헤더 */}
        <div className="mb-4 flex items-start justify-between">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <div
              className={`rounded-lg p-2.5 ${getStatusTheme.statusColor} shadow-sm`}
            >
              {getServerIcon()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex items-center gap-2">
                <h3
                  className={`${getVariantStyles.titleSize} truncate text-gray-900`}
                >
                  {server.name}
                </h3>
                {getOSIcon()}
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <MapPin className="h-3 w-3" />
                <span>{server.location || 'Seoul DC1'}</span>
                {getVariantStyles.showDetails && (
                  <>
                    <span>•</span>
                    <Clock className="h-3 w-3" />
                    <span>{new Date().toLocaleTimeString('ko-KR', { hour12: false, hour: '2-digit', minute: '2-digit' })}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div
            className={`flex items-center gap-2 rounded-full px-3 py-1.5 ${getStatusTheme.statusColor} shadow-sm`}
          >
            {getStatusTheme.statusIcon}
            <span className="text-xs font-semibold">
              {getStatusTheme.statusText}
            </span>
          </div>
        </div>

        {/* 📈 정보 계층화 메트릭 섹션 - 우선순위 기반 레이아웃 */}
        <div className={`space-y-6 ${getVariantStyles.spacing}`}>
          {/* 🔴 주요 메트릭 (CPU, 메모리) - 더 큰 크기와 강조 */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-3">
              <div className="h-1 w-1 rounded-full bg-red-500"></div>
              <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                핵심 지표
              </span>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="transform transition-transform duration-200 hover:scale-105">
                <ServerCardLineChart
                  label="CPU"
                  value={realtimeMetrics.cpu}
                  type="cpu"
                  showRealTimeUpdates={showRealTimeUpdates}
                  serverStatus={server.status}
                />
              </div>
              <div className="transform transition-transform duration-200 hover:scale-105">
                <ServerCardLineChart
                  label="메모리"
                  value={realtimeMetrics.memory}
                  type="memory"
                  showRealTimeUpdates={showRealTimeUpdates}
                  serverStatus={server.status}
                />
              </div>
            </div>
          </div>

          {/* 🟡 보조 메트릭 (디스크, 네트워크) - 작은 크기 */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-1 w-1 rounded-full bg-blue-400"></div>
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                보조 지표
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4 opacity-90">
              <div className="transform transition-all duration-200 hover:opacity-100 hover:scale-102">
                <ServerCardLineChart
                  label="디스크"
                  value={realtimeMetrics.disk}
                  type="disk"
                  showRealTimeUpdates={showRealTimeUpdates}
                  serverStatus={server.status}
                />
              </div>
              <div className="transform transition-all duration-200 hover:opacity-100 hover:scale-102">
                <ServerCardLineChart
                  label="네트워크"
                  value={Math.min(100, Math.max(0, realtimeMetrics.network))}
                  type="network"
                  showRealTimeUpdates={showRealTimeUpdates}
                  serverStatus={server.status}
                />
              </div>
            </div>
          </div>
        </div>

        {/* 서비스 상태 */}
        {getVariantStyles.showServices &&
          server.services &&
          server.services.length > 0 && (
            <div className="mt-4">
              <div className="flex flex-wrap gap-2">
                {server.services
                  .slice(0, getVariantStyles.maxServices)
                  .map((service, idx) => (
                    <div
                      key={idx}
                      className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium shadow-sm transition-colors ${
                        service.status === 'running'
                          ? 'border-green-300 bg-green-50 text-green-700'
                          : service.status === 'stopped'
                            ? 'border-red-300 bg-red-50 text-red-700'
                            : 'border-yellow-300 bg-yellow-50 text-yellow-700'
                      }`}
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
                    </div>
                  ))}
                {server.services.length > getVariantStyles.maxServices && (
                  <div className="flex items-center rounded-lg bg-gray-100 px-2.5 py-1 text-xs text-gray-500">
                    +{server.services.length - getVariantStyles.maxServices}{' '}
                    more
                  </div>
                )}
              </div>
            </div>
          )}

        {/* 호버 효과 */}
        <Fragment>
          {isHovered && (
            <div
              className="pointer-events-none absolute inset-0 rounded-xl bg-gradient-to-br from-blue-500/5 to-purple-500/5"
            />
          )}
        </Fragment>

        {/* 클릭 효과 */}
        <div
          className="absolute inset-0 rounded-xl bg-blue-500/10 opacity-0"
        />
      </button>
    );
  }
);

ImprovedServerCard.displayName = 'ImprovedServerCard';

export default ImprovedServerCard;
