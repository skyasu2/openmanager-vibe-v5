/**
 * 🌟 Improved Server Card v3.1 - AI 교차검증 개선판
 *
 * 기존 문제점 해결 + AI 교차검증 개선사항 반영:
 * - ✅ 가독성 대폭 향상 (메트릭 크기 증가, 색상 개선)
 * - ✅ 정보 밀도 최적화 (중요 정보 우선 표시)
 * - ✅ 인터랙션 강화 (실시간 피드백, 애니메이션)
 * - ✅ 호버 블러 효과 제거 (사용자 피드백 반영)
 * - ✅ 그래프 색상 직관적 매칭 (Critical→빨강, Warning→주황, Normal→녹색)
 * - ✅ 24시간 실시간 시간 표시
 * - 🆕 에러 바운더리 적용 (Codex 제안)
 * - 🆕 접근성 개선 강화 (Gemini 제안)
 * - 🆕 메트릭 값 검증 일관성 (Codex 제안)
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
import { memo, useCallback, useEffect, useState, useMemo, useRef, type FC, Fragment } from 'react';
import type { Server as ServerType } from '../../types/server';
import { ServerCardLineChart } from '../shared/ServerMetricsLineChart';
import ServerCardErrorBoundary from '../error/ServerCardErrorBoundary';
import { validateMetricValue, validateServerMetrics, generateSafeMetricValue, type MetricType } from '../../utils/metricValidation';

interface ImprovedServerCardProps {
  server: ServerType;
  onClick: (server: ServerType) => void;
  variant?: 'compact' | 'standard' | 'detailed';
  showRealTimeUpdates?: boolean;
  index?: number;
}

const ImprovedServerCardInner: FC<ImprovedServerCardProps> = memo(
  ({
    server,
    onClick,
    variant = 'standard',
    showRealTimeUpdates = true,
    index = 0,
  }) => {
    const [isHovered, setIsHovered] = useState(false);
    const isMountedRef = useRef(true); // 비동기 상태 관리 개선 (Codex 제안)
    
    // 초기 메트릭 값 검증 적용
    const [realtimeMetrics, setRealtimeMetrics] = useState(() => 
      validateServerMetrics({
        cpu: server.cpu,
        memory: server.memory,
        disk: server.disk,
        network: server.network || 25,
      })
    );

    // 컴포넌트 언마운트 추적
    useEffect(() => {
      isMountedRef.current = true;
      return () => {
        isMountedRef.current = false;
      };
    }, []);

    // 실시간 메트릭 업데이트 시뮬레이션 (안정화 버전 + 검증 강화)
    useEffect(() => {
      if (!showRealTimeUpdates) return;

      const interval = setInterval(
        () => {
          // 컴포넌트가 언마운트된 경우 setState 방지 (Codex 제안)
          if (!isMountedRef.current) return;

          setRealtimeMetrics((prev) => ({
            // 안전한 메트릭 값 생성 함수 사용
            cpu: generateSafeMetricValue(prev.cpu, 3, 'cpu'),
            memory: generateSafeMetricValue(prev.memory, 2, 'memory'),
            disk: generateSafeMetricValue(prev.disk, 0.5, 'disk'),
            network: generateSafeMetricValue(prev.network, 5, 'network'),
          }));
        },
        45000 + index * 1000 // 🎯 데이터 수집 간격 최적화 (45초 + 서버별 지연)
      );

      return () => clearInterval(interval);
    }, [showRealTimeUpdates, index]);

    // 🎨 현대적 Glassmorphism + Material You 기반 서버 상태별 테마 (메모이제이션 최적화)
    const getStatusTheme = useMemo(() => {
      // 서버 상태를 표준 상태로 매핑
      const normalizedStatus =
        server.status === 'healthy'
          ? 'online'
          : server.status === 'critical'
            ? 'offline'
            : server.status;

      switch (normalizedStatus) {
        case 'online':
          return {
            cardBg: 'bg-gradient-to-br from-white/80 via-green-50/60 to-emerald-50/40 backdrop-blur-sm',
            border: 'border-emerald-200/60',
            hoverBorder: 'hover:border-emerald-300/80',
            glowEffect: 'hover:shadow-emerald-500/20',
            statusColor: 'text-emerald-800 bg-emerald-100/80 backdrop-blur-sm',
            statusIcon: <CheckCircle2 className="h-4 w-4" aria-hidden="true" />,
            statusText: '정상',
            pulse: 'bg-emerald-500',
            accent: 'text-emerald-600',
          };
        case 'warning':
          return {
            cardBg: 'bg-gradient-to-br from-white/80 via-amber-50/60 to-orange-50/40 backdrop-blur-sm',
            border: 'border-amber-200/60',
            hoverBorder: 'hover:border-amber-300/80',
            glowEffect: 'hover:shadow-amber-500/20',
            statusColor: 'text-amber-800 bg-amber-100/80 backdrop-blur-sm',
            statusIcon: <AlertCircle className="h-4 w-4" aria-hidden="true" />,
            statusText: '경고',
            pulse: 'bg-amber-500',
            accent: 'text-amber-600',
          };
        case 'offline':
          return {
            cardBg: 'bg-gradient-to-br from-white/80 via-red-50/60 to-rose-50/40 backdrop-blur-sm',
            border: 'border-red-200/60',
            hoverBorder: 'hover:border-red-300/80',
            glowEffect: 'hover:shadow-red-500/20',
            statusColor: 'text-red-800 bg-red-100/80 backdrop-blur-sm',
            statusIcon: <AlertCircle className="h-4 w-4" aria-hidden="true" />,
            statusText: '심각',
            pulse: 'bg-red-500',
            accent: 'text-red-600',
          };
        default:
          return {
            cardBg: 'bg-gradient-to-br from-white/80 via-blue-50/60 to-cyan-50/40 backdrop-blur-sm',
            border: 'border-blue-200/60',
            hoverBorder: 'hover:border-blue-300/80',
            glowEffect: 'hover:shadow-blue-500/20',
            statusColor: 'text-blue-800 bg-blue-100/80 backdrop-blur-sm',
            statusIcon: <CheckCircle2 className="h-4 w-4" aria-hidden="true" />,
            statusText: '정상',
            pulse: 'bg-blue-500',
            accent: 'text-blue-600',
          };
      }
    }, [server.status]); // 상태별 의존성 최적화 (Gemini 제안 반영)

    // 서버 타입별 아이콘 가져오기
    const getServerIcon = () => {
      switch (server.type) {
        case 'web':
          return <Globe className="h-5 w-5" aria-hidden="true" />;
        case 'database':
          return <Database className="h-5 w-5" aria-hidden="true" />;
        case 'storage':
          return <HardDrive className="h-5 w-5" aria-hidden="true" />;
        case 'backup':
          return <Archive className="h-5 w-5" aria-hidden="true" />;
        case 'app':
        default:
          return <Server className="h-5 w-5" aria-hidden="true" />;
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
          <span className="text-base" title={server.os} aria-label={`운영체제: ${server.os}`}>
            🐧
          </span>
        );
      } else if (
        os.includes('centos') ||
        os.includes('red hat') ||
        os.includes('rhel')
      ) {
        return (
          <span className="text-base" title={server.os} aria-label={`운영체제: ${server.os}`}>
            🎩
          </span>
        );
      } else if (os.includes('windows')) {
        return (
          <span className="text-base" title={server.os} aria-label={`운영체제: ${server.os}`}>
            🪟
          </span>
        );
      }
      return null;
    };

    // 배리언트별 스타일 (라인 그래프에 최적화) - 메모이제이션 최적화
    const getVariantStyles = useMemo(() => {
      switch (variant) {
        case 'compact':
          return {
            container: 'p-4 min-h-[300px]',
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
            container: 'p-6 min-h-[380px]',
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
            container: 'p-5 min-h-[340px]',
            titleSize: 'text-base font-semibold',
            metricSize: 'text-sm',
            progressHeight: 'h-2.5',
            spacing: 'space-y-4',
            showServices: true,
            maxServices: 3,
            showDetails: true,
          };
      }
    }, [variant]);

    // 🚀 클릭 핸들러 메모이제이션 (성능 최적화)
    const handleClick = useCallback(() => {
      onClick(server);
    }, [server.id, onClick]); // 의존성 최적화

    // 🎯 키보드 접근성 개선 (Gemini 제안)
    const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        handleClick();
      }
    }, [handleClick]);

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
          focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:ring-offset-2
        `}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        aria-label={`${server.name} 서버 - ${getStatusTheme.statusText} 상태. CPU ${Math.round(realtimeMetrics.cpu)}%, 메모리 ${Math.round(realtimeMetrics.memory)}% 사용 중`}
        role="button"
        tabIndex={0}
      >
        {/* 실시간 활동 인디케이터 */}
        {showRealTimeUpdates && (
          <div className="absolute right-3 top-3 z-10" aria-hidden="true">
            <div
              className={`h-2 w-2 ${getStatusTheme.pulse} rounded-full shadow-lg`}
              title="실시간 업데이트 중"
            />
          </div>
        )}

        {/* 헤더 */}
        <header className="mb-4 flex items-start justify-between">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <div
              className={`rounded-lg p-2.5 ${getStatusTheme.statusColor} shadow-sm`}
              role="img"
              aria-label={`서버 타입: ${server.type}`}
            >
              {getServerIcon()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex items-center gap-2">
                <h3
                  className={`${getVariantStyles.titleSize} truncate text-gray-900`}
                  id={`server-${server.id}-title`}
                >
                  {server.name}
                </h3>
                {getOSIcon()}
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <MapPin className="h-3 w-3" aria-hidden="true" />
                <span aria-label="서버 위치">{server.location || 'Seoul DC1'}</span>
                {getVariantStyles.showDetails && (
                  <>
                    <span aria-hidden="true">•</span>
                    <Clock className="h-3 w-3" aria-hidden="true" />
                    <span aria-label="현재 시간">
                      {new Date().toLocaleTimeString('ko-KR', { 
                        hour12: false, 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div
            className={`flex items-center gap-2 rounded-full px-3 py-1.5 ${getStatusTheme.statusColor} shadow-sm`}
            role="status"
            aria-label={`서버 상태: ${getStatusTheme.statusText}`}
          >
            {getStatusTheme.statusIcon}
            <span className="text-xs font-semibold">
              {getStatusTheme.statusText}
            </span>
          </div>
        </header>

        {/* 📈 정보 계층화 메트릭 섹션 - 우선순위 기반 레이아웃 */}
        <section 
          className={`space-y-6 ${getVariantStyles.spacing}`}
          aria-labelledby={`server-${server.id}-title`}
        >
          {/* 🔴 주요 메트릭 (CPU, 메모리) */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-3">
              <div className="h-1 w-1 rounded-full bg-red-500" aria-hidden="true"></div>
              <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                핵심 지표
              </h4>
            </div>
            <div className="grid grid-cols-2 gap-6" role="group" aria-label="주요 서버 메트릭">
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

          {/* 🟡 보조 메트릭 (디스크, 네트워크) */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-1 w-1 rounded-full bg-blue-400" aria-hidden="true"></div>
              <h4 className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                보조 지표
              </h4>
            </div>
            <div className="grid grid-cols-2 gap-4 opacity-90" role="group" aria-label="보조 서버 메트릭">
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
                  value={realtimeMetrics.network}
                  type="network"
                  showRealTimeUpdates={showRealTimeUpdates}
                  serverStatus={server.status}
                />
              </div>
            </div>
          </div>
        </section>

        {/* 서비스 상태 */}
        {getVariantStyles.showServices &&
          server.services &&
          server.services.length > 0 && (
            <footer className="mt-4" role="complementary" aria-label="서비스 상태 목록">
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
                      role="status"
                      aria-label={`${service.name} 서비스: ${
                        service.status === 'running' ? '실행중' : 
                        service.status === 'stopped' ? '중단' : '경고'
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
                        aria-hidden="true"
                      />
                      <span>{service.name}</span>
                    </div>
                  ))}
                {server.services.length > getVariantStyles.maxServices && (
                  <div 
                    className="flex items-center rounded-lg bg-gray-100 px-2.5 py-1 text-xs text-gray-500"
                    aria-label={`${server.services.length - getVariantStyles.maxServices}개 서비스 더 있음`}
                  >
                    +{server.services.length - getVariantStyles.maxServices} more
                  </div>
                )}
              </div>
            </footer>
          )}

        {/* 호버 효과 - 블러 효과 제거됨 (사용자 피드백 반영) */}
        <Fragment>
          {isHovered && (
            <div
              className="pointer-events-none absolute inset-0 rounded-xl bg-gradient-to-br from-blue-500/5 to-purple-500/5"
              aria-hidden="true"
            />
          )}
        </Fragment>
      </button>
    );
  }
);

ImprovedServerCardInner.displayName = 'ImprovedServerCardInner';

// 🛡️ 에러 바운더리로 감싼 최종 컴포넌트 (Codex 제안 반영)
const ImprovedServerCard: FC<ImprovedServerCardProps> = (props) => {
  return (
    <ServerCardErrorBoundary>
      <ImprovedServerCardInner {...props} />
    </ServerCardErrorBoundary>
  );
};

ImprovedServerCard.displayName = 'ImprovedServerCard';

export default ImprovedServerCard;